import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageCircle, Grid, AlertTriangle, MapPin, ClipboardList, Percent } from 'lucide-react';
import { useTable } from '@/hooks/useTable';
import { useCategories, useMenuItems } from '@/hooks/useMenu';
import { useCart } from '@/hooks/useCart';
import { useChat } from '@/hooks/useChat';
import { useCreateOrder } from '@/hooks/useOrders';
import { useActivePromotions, getPromoPrice, getDiscountBadge } from '@/hooks/usePromotions';
import { getSessionId } from '@/lib/session';
import { MenuItemCard } from '@/components/menu/MenuItemCard';
import { CategoryTabs } from '@/components/menu/CategoryTabs';
import { PromoTab } from '@/components/menu/PromoTab';
import { CartSheet } from '@/components/cart/CartSheet';
import { AIChat } from '@/components/chat/AIChat';
import { OrderHistory } from '@/components/orders/OrderHistory';
import { VoiceAssistantBubble } from '@/components/voice/VoiceAssistantBubble';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function MenuPage() {
  const [searchParams] = useSearchParams();
  const tableNumber = searchParams.get('table') ? parseInt(searchParams.get('table')!) : null;

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'menu' | 'chat' | 'orders' | 'promo'>('menu');
  const { data: promotions } = useActivePromotions();

  const sessionId = getSessionId();

  const { data: table, isLoading: tableLoading, error: tableError } = useTable(tableNumber);
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: menuItems = [], isLoading: menuLoading } = useMenuItems(selectedCategory ?? undefined);

  const { setTable, tableId } = useCart();
  const { messages, sendMessage, isLoading: chatLoading } = useChat(sessionId, table?.id ?? null, {
    menuItems
  });

  const handleNavigateToOrders = useCallback(() => {
    setActiveTab('orders');
  }, []);

  // Set table when loaded
  useEffect(() => {
    if (table && (!tableId || tableId !== table.id)) {
      setTable(table.id, table.table_number);
    }
  }, [table, tableId, setTable]);

  // Send initial greeting
  // NOTE: In React 18 dev StrictMode, effects can run twice due to mount->unmount->mount.
  // Use localStorage (per session+table) so the greeting is only sent once across remounts.
  const greetingSentRef = useRef(false);
  useEffect(() => {
    if (!table || chatLoading || messages.length !== 0) return;
    if (greetingSentRef.current) return;

    const storageKey = `restoai:greeting_sent:${sessionId}:${table.id}`;

    try {
      if (localStorage.getItem(storageKey) === '1') {
        greetingSentRef.current = true;
        return;
      }
      localStorage.setItem(storageKey, '1');
    } catch {

      // If storage is blocked, we still rely on the ref (best-effort)
    }
    greetingSentRef.current = true;
    sendMessage(`Halo! Aku baru sampai di meja ${table.table_number}`).catch(console.error);
  }, [table, messages.length, sendMessage, chatLoading, sessionId]);

  // Error state - invalid table
  if (tableNumber && !tableLoading && !table) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md">
          
          <div className="w-20 h-20 mx-auto bg-destructive/10 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-10 h-10 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Meja Tidak Ditemukan</h1>
          <p className="text-muted-foreground mb-6">
            Meja {tableNumber} tidak aktif atau tidak terdaftar. Silakan scan ulang QR code atau hubungi waiter.
          </p>
          <Button onClick={() => window.location.href = '/menu'} variant="outline">
            Coba Lagi
          </Button>
        </motion.div>
      </div>);

  }

  // No table specified - show welcome
  if (!tableNumber) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md">
          
          <div className="text-7xl mb-6">🍽️</div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Selamat Datang!</h1>
          <p className="text-muted-foreground mb-6">
            Scan QR code di meja Anda untuk mulai memesan
          </p>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>Cari QR code di meja Anda</span>
          </div>
        </motion.div>
      </div>);

  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header - simplified without tabs */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden">
                <img

                  alt="Restaurant Logo"
                  className="w-full h-full object-cover" src="/lovable-uploads/2d8b9b22-d300-4b8f-8528-06aafbe9f5e1.png" />
                
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">DynamenuAI</h1>
                {table &&
                <p className="text-sm text-muted-foreground">Meja {table.table_number}</p>
                }
              </div>
            </div>
            <CartSheet onNavigateToOrders={handleNavigateToOrders} inline />
          </div>

          {/* Category Tabs - only show on menu tab */}
          {activeTab === 'menu' && !categoriesLoading &&
          <div className="mt-3">
              <CategoryTabs
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory} />
            
            </div>
          }
        </div>
      </header>

      {/* Content */}
      <main className="container flex-1 py-4 pb-24">
        {activeTab === 'menu' ?
        <>
            {/* Loading state */}
            {menuLoading ?
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) =>
            <div key={i} className="rounded-xl overflow-hidden">
                    <Skeleton className="h-40 w-full" />
                    <div className="p-4 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-6 w-1/2" />
                    </div>
                  </div>
            )}
              </div> :

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            
                {menuItems.map((item, index) => {
                  const promoPrice = getPromoPrice(item.id, item.price, promotions);
                  const discountBadge = getDiscountBadge(item.id, item.price, promotions);
                  return (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      index={index}
                      promoPrice={promoPrice}
                      discountBadge={discountBadge}
                    />
                  );
                })}
          }

            {menuItems.length === 0 && !menuLoading &&
          <div className="text-center py-12">
                <div className="text-5xl mb-4">🍽️</div>
                <p className="text-muted-foreground">Tidak ada menu di kategori ini</p>
              </div>
          }
          </> :
        activeTab === 'orders' ?
        <OrderHistory /> :

        <div className="h-[calc(100vh-160px)]">
            <AIChat
            messages={messages}
            onSendMessage={sendMessage}
            isLoading={chatLoading}
            tableNumber={table?.table_number ?? null} />
          
          </div>
        }
      </main>

      {/* Bottom Navigation Bar - Instagram style */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border safe-area-bottom">
        <div className="container flex items-center justify-around py-2">
          {[
          { key: 'menu' as const, icon: Grid, label: 'Menu' },
          { key: 'orders' as const, icon: ClipboardList, label: 'Pesanan' },
          { key: 'chat' as const, icon: MessageCircle, label: 'Chat AI' }].
          map(({ key, icon: Icon, label }) =>
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex flex-col items-center gap-1 px-6 py-1.5 rounded-xl transition-all duration-200 ${
            activeTab === key ?
            'text-primary' :
            'text-muted-foreground hover:text-foreground'}`
            }>
            
              <Icon className={`w-5 h-5 transition-transform duration-200 ${activeTab === key ? 'scale-110' : ''}`} />
              <span className={`text-[10px] font-medium ${activeTab === key ? 'font-semibold' : ''}`}>{label}</span>
              {activeTab === key &&
            <motion.div
              layoutId="bottomNavIndicator"
              className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />

            }
            </button>
          )}
        </div>
      </nav>

      {/* Voice Assistant Floating Bubble */}
      <VoiceAssistantBubble />
    </div>);

}