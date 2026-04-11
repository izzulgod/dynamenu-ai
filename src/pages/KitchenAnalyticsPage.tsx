import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Star, ShoppingBag, MessageSquare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface FeedbackRow {
  id: string;
  rating: number | null;
  comment: string | null;
  created_at: string | null;
  order_id: string | null;
  orders: {
    table_id: string | null;
    tables: { table_number: number } | null;
  } | null;
}

interface MenuStat {
  menu_item_id: string;
  avg_rating: number;
  total_reviews: number;
  total_sold: number;
}

export default function KitchenAnalyticsPage() {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/admin'); return; }
      const { data: profile } = await supabase
        .from('staff_profiles')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .single();
      setIsAuthorized(!!profile);
    };
    check();
  }, [navigate]);

  // Fetch menu items
  const { data: menuItems = [] } = useQuery({
    queryKey: ['analytics-menu-items'],
    queryFn: async () => {
      const { data, error } = await supabase.from('menu_items').select('id, name, image_url, price').order('name');
      if (error) throw error;
      return data;
    },
    enabled: isAuthorized === true,
  });

  // Fetch stats
  const { data: stats = [] } = useQuery({
    queryKey: ['analytics-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_menu_item_stats');
      if (error) throw error;
      return (data ?? []) as MenuStat[];
    },
    enabled: isAuthorized === true,
  });

  // Fetch feedback with table info
  const { data: feedbacks = [] } = useQuery({
    queryKey: ['analytics-feedback'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feedback')
        .select('id, rating, comment, created_at, order_id, orders(table_id, tables(table_number))')
        .not('rating', 'is', null)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as unknown as FeedbackRow[];
    },
    enabled: isAuthorized === true,
  });

  // Fetch order_items to map feedback->order->items->menu
  const { data: orderItemsMap = new Map() } = useQuery({
    queryKey: ['analytics-order-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_items')
        .select('order_id, menu_item_id');
      if (error) throw error;
      const map = new Map<string, string[]>();
      (data ?? []).forEach((oi: any) => {
        if (!oi.order_id || !oi.menu_item_id) return;
        const arr = map.get(oi.order_id) || [];
        arr.push(oi.menu_item_id);
        map.set(oi.order_id, arr);
      });
      return map;
    },
    enabled: isAuthorized === true,
  });

  if (isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isAuthorized === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <p className="text-destructive font-semibold">Akses ditolak</p>
      </div>
    );
  }

  const statsMap = new Map<string, MenuStat>();
  stats.forEach((s) => statsMap.set(s.menu_item_id, s));

  // Build feedback per menu item
  const feedbackPerMenu = new Map<string, FeedbackRow[]>();
  feedbacks.forEach((fb) => {
    if (!fb.order_id) return;
    const menuIds = orderItemsMap.get(fb.order_id) || [];
    menuIds.forEach((mid) => {
      const arr = feedbackPerMenu.get(mid) || [];
      arr.push(fb);
      feedbackPerMenu.set(mid, arr);
    });
  });

  // Sort menu items by total_sold desc
  const sortedItems = [...menuItems].sort((a, b) => {
    const sa = statsMap.get(a.id)?.total_sold ?? 0;
    const sb = statsMap.get(b.id)?.total_sold ?? 0;
    return sb - sa;
  });

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  function RatingStars({ rating }: { rating: number }) {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const fill = Math.min(1, Math.max(0, rating - (star - 1)));
          return (
            <div key={star} className="relative w-4 h-4">
              <Star className="w-4 h-4 text-muted-foreground/20 absolute inset-0" />
              <div className="overflow-hidden absolute inset-0" style={{ width: `${fill * 100}%` }}>
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="container py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/kitchen')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-bold text-foreground text-lg">Analitik & Ulasan</h1>
            <p className="text-xs text-muted-foreground">{menuItems.length} menu • {feedbacks.length} ulasan</p>
          </div>
        </div>
      </header>

      <div className="container py-4 space-y-4">
        {sortedItems.map((item) => {
          const st = statsMap.get(item.id);
          const avgRating = st?.avg_rating ?? 0;
          const totalSold = st?.total_sold ?? 0;
          const totalReviews = st?.total_reviews ?? 0;
          const itemFeedbacks = feedbackPerMenu.get(item.id) || [];

          return (
            <Card key={item.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  {item.image_url && (
                    <img src={item.image_url} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                  )}
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{item.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{formatPrice(item.price)}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Stats row */}
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <RatingStars rating={avgRating} />
                    <span className="text-sm font-semibold">{avgRating > 0 ? avgRating : '-'}</span>
                    <span className="text-xs text-muted-foreground">({totalReviews})</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>{totalSold} terjual</span>
                  </div>
                </div>

                {/* Feedback list */}
                {itemFeedbacks.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        Ulasan ({itemFeedbacks.length})
                      </p>
                      {itemFeedbacks.slice(0, 5).map((fb) => {
                        const tableNum = fb.orders?.tables?.table_number;
                        return (
                          <div key={fb.id} className="bg-muted/50 rounded-lg p-2.5 space-y-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px] px-1.5">
                                  {tableNum ? `Meja ${tableNum}` : 'Anonim'}
                                </Badge>
                                <div className="flex items-center gap-0.5">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <Star
                                      key={s}
                                      className={`w-3 h-3 ${
                                        s <= (fb.rating ?? 0) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/20'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <span className="text-[10px] text-muted-foreground">
                                {fb.created_at ? new Date(fb.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : ''}
                              </span>
                            </div>
                            {fb.comment && (
                              <p className="text-xs text-foreground">"{fb.comment}"</p>
                            )}
                          </div>
                        );
                      })}
                      {itemFeedbacks.length > 5 && (
                        <p className="text-xs text-muted-foreground text-center">
                          +{itemFeedbacks.length - 5} ulasan lainnya
                        </p>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}

        {sortedItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Belum ada data menu</p>
          </div>
        )}
      </div>
    </div>
  );
}
