import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChefHat, Clock, CheckCircle, Truck, LogOut, 
  RefreshCw, Bell, Coffee, Loader2, ShieldAlert, UtensilsCrossed,
  Banknote, QrCode, CreditCard, XCircle, AlertTriangle, BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { useKitchenCancelOrder } from '@/hooks/useKitchenCancelOrder';
import { useAllOrders, useUpdateOrderStatus } from '@/hooks/useOrders';
import { useConfirmCashPayment } from '@/hooks/useConfirmPayment';
import { OrderWithItems } from '@/types/restaurant';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const statusConfig = {
  pending: { label: 'Menunggu', icon: Clock, color: 'bg-amber-100 text-amber-700 border-amber-200' },
  confirmed: { label: 'Dikonfirmasi', icon: CheckCircle, color: 'bg-blue-100 text-blue-700 border-blue-200' },
  preparing: { label: 'Dimasak', icon: Coffee, color: 'bg-purple-100 text-purple-700 border-purple-200' },
  ready: { label: 'Siap', icon: Bell, color: 'bg-green-100 text-green-700 border-green-200' },
  delivered: { label: 'Diantar', icon: Truck, color: 'bg-gray-100 text-gray-700 border-gray-200' },
  cancelled: { label: 'Dibatalkan', icon: Clock, color: 'bg-red-100 text-red-700 border-red-200' },
};

const paymentMethodConfig = {
  cash: { label: 'Tunai', icon: Banknote, color: 'bg-green-50 text-green-700 border-green-200' },
  qris: { label: 'QRIS', icon: QrCode, color: 'bg-blue-50 text-blue-700 border-blue-200' },
};

export default function KitchenDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'pending' | 'preparing' | 'ready'>('pending');
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [staffName, setStaffName] = useState<string>('');
  const [staffRole, setStaffRole] = useState<string>('');
  const { data: allOrders = [], isLoading, refetch } = useAllOrders();
  const updateStatus = useUpdateOrderStatus();
  const confirmPayment = useConfirmCashPayment();
   const kitchenCancel = useKitchenCancelOrder();
   const [cancelReason, setCancelReason] = useState('');
   // Track per-order pending state to prevent double-clicks
   const [pendingOrderActions, setPendingOrderActions] = useState<Set<string>>(new Set());

  // Check auth AND staff authorization
  useEffect(() => {
    const checkAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/admin');
        return;
      }
      
      // Check if user is in staff_profiles and is active
      const { data: profile, error } = await supabase
        .from('staff_profiles')
        .select('id, name, role, is_active')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .single();
      
      if (error || !profile) {
        console.error('Staff access check failed:', error);
        setIsAuthorized(false);
        toast.error('Akses ditolak: Anda bukan staff yang terdaftar');
        return;
      }
      
      // User is authorized staff
      setIsAuthorized(true);
      setStaffName(profile.name);
      setStaffRole(profile.role);
    };
    
    checkAccess();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate('/admin');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin');
  };

  const getFilteredOrders = (status: string[]) => {
    return allOrders.filter((order) => status.includes(order.status));
  };

  // Grouped order type for kitchen display
  interface GroupedTableOrder {
    tableKey: string;
    tableNumber: number | null;
    subOrders: OrderWithItems[];
    allItems: OrderWithItems['order_items'];
    totalAmount: number;
    earliestTime: string;
    allNotes: string[];
    // Derived: the "worst" status for display (pending < confirmed < preparing < ready)
    displayStatus: OrderWithItems['status'];
  }

  const statusPriority: Record<string, number> = {
    pending: 0, confirmed: 1, preparing: 2, ready: 3, delivered: 4, cancelled: 5,
  };

  const groupOrdersByTable = (orders: OrderWithItems[]): GroupedTableOrder[] => {
    const tableGroups = new Map<string, GroupedTableOrder>();
    
    orders.forEach((order) => {
      const tableKey = order.table_id || order.id;
      
      if (tableGroups.has(tableKey)) {
        const existing = tableGroups.get(tableKey)!;
        existing.subOrders.push(order);
        existing.allItems = [...existing.allItems, ...order.order_items];
        existing.totalAmount += (order.total_amount || 0);
        if (new Date(order.created_at) < new Date(existing.earliestTime)) {
          existing.earliestTime = order.created_at;
        }
        if (order.notes) existing.allNotes.push(order.notes);
        // Display status = the "lowest priority" (earliest in flow) among sub-orders
        if (statusPriority[order.status] < statusPriority[existing.displayStatus]) {
          existing.displayStatus = order.status;
        }
      } else {
        tableGroups.set(tableKey, {
          tableKey,
          tableNumber: order.tables?.table_number ?? null,
          subOrders: [order],
          allItems: [...order.order_items],
          totalAmount: order.total_amount || 0,
          earliestTime: order.created_at,
          allNotes: order.notes ? [order.notes] : [],
          displayStatus: order.status,
        });
      }
    });
    
    return Array.from(tableGroups.values());
  };

  const handleStatusUpdate = async (orderId: string, newStatus: OrderWithItems['status']) => {
    if (pendingOrderActions.has(orderId)) return; // Prevent double-click
    setPendingOrderActions(prev => new Set(prev).add(orderId));
    try {
      await updateStatus.mutateAsync({ orderId, status: newStatus });
      toast.success(`Status diupdate: ${statusConfig[newStatus].label}`, { id: `status-${orderId}-${newStatus}` });
    } catch (error) {
      toast.error('Gagal update status');
    } finally {
      setPendingOrderActions(prev => { const s = new Set(prev); s.delete(orderId); return s; });
    }
  };

  const handleConfirmCashPayment = async (orderId: string) => {
    if (pendingOrderActions.has(orderId)) return;
    setPendingOrderActions(prev => new Set(prev).add(orderId));
    try {
      await confirmPayment.mutateAsync(orderId);
      toast.success('Pembayaran tunai dikonfirmasi!', { id: `payment-${orderId}` });
    } catch (error) {
      toast.error('Gagal konfirmasi pembayaran');
    } finally {
      setPendingOrderActions(prev => { const s = new Set(prev); s.delete(orderId); return s; });
    }
  };

   const handleKitchenCancelOrder = async (orderId: string) => {
     if (pendingOrderActions.has(orderId)) return;
     setPendingOrderActions(prev => new Set(prev).add(orderId));
     try {
       await kitchenCancel.mutateAsync({ 
         orderId, 
         reason: cancelReason || 'Dibatalkan oleh dapur' 
       });
       toast.success('Pesanan berhasil dibatalkan', { id: `cancel-${orderId}` });
       setCancelReason('');
     } catch (error) {
       toast.error('Gagal membatalkan pesanan');
     } finally {
       setPendingOrderActions(prev => { const s = new Set(prev); s.delete(orderId); return s; });
     }
   };
 
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Show unauthorized screen
  if (isAuthorized === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
                <ShieldAlert className="w-8 h-8 text-destructive" />
              </div>
              <h2 className="text-xl font-bold text-destructive">Akses Ditolak</h2>
              <p className="text-muted-foreground">
                Anda tidak memiliki akses ke dashboard dapur. 
                Hanya staff yang terdaftar yang dapat mengakses halaman ini.
              </p>
              <Button onClick={handleLogout} variant="outline" className="w-full">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading while checking authorization
  if (isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const OrderCard = ({ group }: { group: GroupedTableOrder }) => {
    const status = statusConfig[group.displayStatus];
    const StatusIcon = status.icon;

    const hasPendingCash = group.subOrders.some(o => o.payment_method === 'cash' && o.payment_status === 'pending');
    
    const handleGroupStatusUpdate = async (newStatus: OrderWithItems['status']) => {
      for (const sub of group.subOrders) {
        if (sub.status !== newStatus) {
          await handleStatusUpdate(sub.id, newStatus);
        }
      }
    };

    const handleGroupCancel = async () => {
      for (const sub of group.subOrders) {
        await handleKitchenCancelOrder(sub.id);
      }
    };

    const allPaid = group.subOrders.every(o => o.payment_status === 'paid');
    const compositeStatus = group.displayStatus;
    const isAnyPending = group.subOrders.some(o => pendingOrderActions.has(o.id));

    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        <Card className={cn("overflow-hidden", hasPendingCash && "ring-2 ring-amber-400")}>
          <CardHeader className={cn('py-3', status.color)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StatusIcon className="w-4 h-4" />
                <CardTitle className="text-base">
                  Meja {group.tableNumber || '-'}
                </CardTitle>
                {group.subOrders.length > 1 && (
                  <Badge variant="secondary" className="text-xs">
                    {group.subOrders.length} pesanan
                  </Badge>
                )}
              </div>
              <div className="text-sm font-normal">
                {formatTime(group.earliestTime)}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {/* Payment Info Per Sub-Order */}
            <div className="space-y-2">
              {group.subOrders.map((sub) => {
                const pm = sub.payment_method ? paymentMethodConfig[sub.payment_method] : null;
                const PmIcon = pm?.icon || CreditCard;
                const isPendingCash = sub.payment_method === 'cash' && sub.payment_status === 'pending';
                
                return (
                  <div key={sub.id} className="rounded-lg border p-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-medium">
                        #{sub.id.slice(-6).toUpperCase()}
                      </span>
                      <div className="flex gap-1.5">
                        {pm && (
                          <Badge variant="outline" className={paymentMethodConfig[sub.payment_method!].color}>
                            <PmIcon className="w-3 h-3 mr-1" />
                            {pm.label}
                          </Badge>
                        )}
                        {sub.payment_status === 'paid' ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Lunas
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            Belum Bayar
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      {sub.order_items.map((item) => (
                        <div key={item.id} className="flex justify-between items-start text-sm">
                          <span className="font-medium">
                            {item.quantity}x {item.menu_items?.name || 'Item'}
                          </span>
                          {item.notes && (
                            <p className="text-xs text-muted-foreground">{item.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between text-xs pt-1 border-t">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-semibold">{formatPrice(sub.total_amount)}</span>
                    </div>

                    {isPendingCash && (
                      <Button
                        size="sm"
                        className="w-full bg-amber-500 hover:bg-amber-600 text-xs"
                        onClick={() => handleConfirmCashPayment(sub.id)}
                        disabled={pendingOrderActions.has(sub.id)}
                      >
                        {pendingOrderActions.has(sub.id) ? (
                          <Loader2 className="w-3 h-3 animate-spin mr-1" />
                        ) : (
                          <Banknote className="w-3 h-3 mr-1" />
                        )}
                        Terima Tunai
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>

            {group.allNotes.length > 0 && (
              <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                📝 {group.allNotes.join(' | ')}
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm text-muted-foreground">Total Keseluruhan</span>
              <span className="font-bold text-primary">
                {formatPrice(group.totalAmount)}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                {compositeStatus === 'pending' && allPaid && (
                  <Button size="sm" className="flex-1" onClick={() => handleGroupStatusUpdate('confirmed')} disabled={isAnyPending}>
                    {isAnyPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Konfirmasi
                  </Button>
                )}
                {compositeStatus === 'confirmed' && (
                  <Button size="sm" className="flex-1" onClick={() => handleGroupStatusUpdate('preparing')} disabled={isAnyPending}>
                    {isAnyPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Mulai Masak
                  </Button>
                )}
                {compositeStatus === 'preparing' && (
                  <Button size="sm" className="flex-1 bg-sage hover:bg-sage/90" onClick={() => handleGroupStatusUpdate('ready')} disabled={isAnyPending}>
                    {isAnyPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Siap Antar
                  </Button>
                )}
                {compositeStatus === 'ready' && (
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => handleGroupStatusUpdate('delivered')} disabled={isAnyPending}>
                    {isAnyPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Sudah Diantar
                  </Button>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="outline" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-destructive" />
                        Batalkan Pesanan?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="space-y-3">
                        <p>Semua pesanan Meja {group.tableNumber || '-'} ({group.subOrders.length} pesanan) akan dibatalkan.</p>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">Alasan pembatalan (opsional):</label>
                          <Textarea placeholder="Contoh: Stok habis, dll" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} className="resize-none" rows={2} />
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setCancelReason('')}>Batal</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleGroupCancel()} className="bg-destructive hover:bg-destructive/90" disabled={kitchenCancel.isPending}>
                        {kitchenCancel.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Ya, Batalkan
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const pendingOrders = groupOrdersByTable(getFilteredOrders(['pending', 'confirmed']));
  const preparingOrders = groupOrdersByTable(getFilteredOrders(['preparing']));
  const readyOrders = groupOrdersByTable(getFilteredOrders(['ready']));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <ChefHat className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="font-bold text-foreground">Dashboard Dapur</h1>
                <p className="text-xs text-muted-foreground">
                  {staffName && `👋 ${staffName} • `}{allOrders.length} pesanan aktif
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin/analytics')}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Analitik
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/admin/menu')}>
                <UtensilsCrossed className="w-4 h-4 mr-2" />
                Menu
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/admin/tables')}>
                <Bell className="w-4 h-4 mr-2" />
                Meja
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="container py-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="w-4 h-4" />
              Baru
              {pendingOrders.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {pendingOrders.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="preparing" className="gap-2">
              <Coffee className="w-4 h-4" />
              Dimasak
              {preparingOrders.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {preparingOrders.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="ready" className="gap-2">
              <Bell className="w-4 h-4" />
              Siap
              {readyOrders.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {readyOrders.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : pendingOrders.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">😴</div>
                <p className="text-muted-foreground">Tidak ada pesanan baru</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                  {pendingOrders.map((group) => (
                    <OrderCard key={group.tableKey} group={group} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          <TabsContent value="preparing">
            {preparingOrders.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">👨‍🍳</div>
                <p className="text-muted-foreground">Tidak ada yang sedang dimasak</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                  {preparingOrders.map((group) => (
                    <OrderCard key={group.tableKey} group={group} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          <TabsContent value="ready">
            {readyOrders.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">✅</div>
                <p className="text-muted-foreground">Tidak ada pesanan siap antar</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                  {readyOrders.map((group) => (
                    <OrderCard key={group.tableKey} group={group} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
