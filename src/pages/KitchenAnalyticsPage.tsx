import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Star, ShoppingBag, MessageSquare, Loader2, TrendingUp, DollarSign, Package, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from 'recharts';
import { useDailyRevenue, useSalesByCategory, useTodaySummary } from '@/hooks/useAnalytics';

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

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(24, 80%, 55%)',
  'hsl(142, 60%, 45%)',
  'hsl(280, 60%, 55%)',
  'hsl(0, 70%, 55%)',
];

export default function KitchenAnalyticsPage() {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [reviewsOpen, setReviewsOpen] = useState(false);

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

  const { data: todaySummary } = useTodaySummary();
  const { data: dailyRevenue = [] } = useDailyRevenue(7);
  const { data: categoryData = [] } = useSalesByCategory();

  const { data: menuItems = [] } = useQuery({
    queryKey: ['analytics-menu-items'],
    queryFn: async () => {
      const { data, error } = await supabase.from('menu_items').select('id, name, image_url, price').order('name');
      if (error) throw error;
      return data;
    },
    enabled: isAuthorized === true,
  });

  const { data: stats = [] } = useQuery({
    queryKey: ['analytics-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_menu_item_stats');
      if (error) throw error;
      return (data ?? []) as MenuStat[];
    },
    enabled: isAuthorized === true,
  });

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

  const { data: orderItemsMap = new Map() } = useQuery({
    queryKey: ['analytics-order-items'],
    queryFn: async () => {
      const { data, error } = await supabase.from('order_items').select('order_id, menu_item_id');
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
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }
  if (isAuthorized === false) {
    return <div className="min-h-screen flex items-center justify-center bg-background p-6"><p className="text-destructive font-semibold">Akses ditolak</p></div>;
  }

  const statsMap = new Map<string, MenuStat>();
  stats.forEach((s) => statsMap.set(s.menu_item_id, s));

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

  const sortedItems = [...menuItems].sort((a, b) => {
    const sa = statsMap.get(a.id)?.total_sold ?? 0;
    const sb = statsMap.get(b.id)?.total_sold ?? 0;
    return sb - sa;
  });

  const bestItem = sortedItems[0];
  const bestRated = [...menuItems].sort((a, b) => (statsMap.get(b.id)?.avg_rating ?? 0) - (statsMap.get(a.id)?.avg_rating ?? 0))[0];

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  // Chart data
  const revenueChartData = dailyRevenue.map((d) => ({
    day: new Date(d.day).toLocaleDateString('id-ID', { weekday: 'short' }),
    revenue: Number(d.total_revenue),
    orders: Number(d.total_orders),
  }));

  const pieChartData = categoryData.map((c, i) => ({
    name: c.category_name,
    value: Number(c.total_sold),
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const revenueConfig = {
    revenue: { label: 'Pendapatan', color: 'hsl(var(--primary))' },
    orders: { label: 'Pesanan', color: 'hsl(var(--accent))' },
  };

  const categoryConfig = Object.fromEntries(
    categoryData.map((c, i) => [c.category_name, { label: c.category_name, color: CHART_COLORS[i % CHART_COLORS.length] }])
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="container py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/kitchen')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-bold text-foreground text-lg">Analitik & Laporan</h1>
            <p className="text-xs text-muted-foreground">{menuItems.length} menu • {feedbacks.length} ulasan</p>
          </div>
        </div>
      </header>

      <div className="container py-4 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="pt-4 pb-3 space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="w-4 h-4" />
                <span className="text-xs">Pendapatan Hari Ini</span>
              </div>
              <p className="text-lg font-bold text-primary">{formatPrice(todaySummary?.totalRevenue ?? 0)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Package className="w-4 h-4" />
                <span className="text-xs">Pesanan Hari Ini</span>
              </div>
              <p className="text-lg font-bold">{todaySummary?.totalOrders ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs">Menu Terlaris</span>
              </div>
              <p className="text-sm font-bold truncate">{bestItem?.name ?? '-'}</p>
              <p className="text-xs text-muted-foreground">{statsMap.get(bestItem?.id ?? '')?.total_sold ?? 0} terjual</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Star className="w-4 h-4" />
                <span className="text-xs">Rating Tertinggi</span>
              </div>
              <p className="text-sm font-bold truncate">{bestRated?.name ?? '-'}</p>
              <p className="text-xs text-muted-foreground">⭐ {statsMap.get(bestRated?.id ?? '')?.avg_rating ?? 0}/5</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Revenue Bar Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Pendapatan 7 Hari Terakhir</CardTitle>
            </CardHeader>
            <CardContent>
              {revenueChartData.length > 0 ? (
                <ChartContainer config={revenueConfig} className="h-[220px] w-full">
                  <BarChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis dataKey="day" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">Belum ada data</div>
              )}
            </CardContent>
          </Card>

          {/* Category Pie Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Penjualan per Kategori</CardTitle>
            </CardHeader>
            <CardContent>
              {pieChartData.length > 0 ? (
                <ChartContainer config={categoryConfig} className="h-[220px] w-full">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie data={pieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {pieChartData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">Belum ada data</div>
              )}
            </CardContent>
          </Card>

          {/* Orders Line Chart */}
          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Tren Pesanan Harian</CardTitle>
            </CardHeader>
            <CardContent>
              {revenueChartData.length > 0 ? (
                <ChartContainer config={revenueConfig} className="h-[200px] w-full">
                  <LineChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis dataKey="day" className="text-xs" />
                    <YAxis className="text-xs" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="orders" stroke="var(--color-orders)" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ChartContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">Belum ada data</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Reviews Section - Collapsible */}
        <Collapsible open={reviewsOpen} onOpenChange={setReviewsOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Ulasan Pelanggan ({feedbacks.length})
                  </CardTitle>
                  {reviewsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4 pt-0">
                {sortedItems.map((item) => {
                  const st = statsMap.get(item.id);
                  const avgRating = st?.avg_rating ?? 0;
                  const totalSold = st?.total_sold ?? 0;
                  const totalReviews = st?.total_reviews ?? 0;
                  const itemFeedbacks = feedbackPerMenu.get(item.id) || [];
                  if (itemFeedbacks.length === 0 && totalSold === 0) return null;

                  return (
                    <div key={item.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-3">
                        {item.image_url && (
                          <img src={item.image_url} alt={item.name} className="w-10 h-10 rounded-lg object-cover" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{item.name}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-0.5">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              {avgRating > 0 ? avgRating : '-'} ({totalReviews})
                            </span>
                            <span className="flex items-center gap-0.5">
                              <ShoppingBag className="w-3 h-3" />
                              {totalSold} terjual
                            </span>
                          </div>
                        </div>
                      </div>
                      {itemFeedbacks.slice(0, 3).map((fb) => {
                        const tableNum = fb.orders?.tables?.table_number;
                        return (
                          <div key={fb.id} className="bg-muted/50 rounded-lg p-2 space-y-1 ml-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px] px-1.5">
                                  {tableNum ? `Meja ${tableNum}` : 'Anonim'}
                                </Badge>
                                <div className="flex items-center gap-0.5">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <Star key={s} className={`w-3 h-3 ${s <= (fb.rating ?? 0) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/20'}`} />
                                  ))}
                                </div>
                              </div>
                              <span className="text-[10px] text-muted-foreground">
                                {fb.created_at ? new Date(fb.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : ''}
                              </span>
                            </div>
                            {fb.comment && <p className="text-xs text-foreground">"{fb.comment}"</p>}
                          </div>
                        );
                      })}
                      {itemFeedbacks.length > 3 && (
                        <p className="text-xs text-muted-foreground text-center ml-4">+{itemFeedbacks.length - 3} ulasan lainnya</p>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>
    </div>
  );
}
