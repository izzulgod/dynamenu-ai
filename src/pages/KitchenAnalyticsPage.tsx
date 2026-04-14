import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Star, TrendingUp, DollarSign, Package, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { useDailyRevenue, useSalesByCategory, useTodaySummary } from '@/hooks/useAnalytics';
import { useQuery } from '@tanstack/react-query';

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
];

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

  const { data: todaySummary } = useTodaySummary();
  const { data: dailyRevenue = [] } = useDailyRevenue(7);
  const { data: categoryData = [] } = useSalesByCategory();

  const { data: menuItems = [] } = useQuery({
    queryKey: ['analytics-menu-items'],
    queryFn: async () => {
      const { data, error } = await supabase.from('menu_items').select('id, name, price').order('name');
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

  if (isAuthorized === null) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }
  if (isAuthorized === false) {
    return <div className="min-h-screen flex items-center justify-center bg-background p-6"><p className="text-destructive font-semibold">Akses ditolak</p></div>;
  }

  const statsMap = new Map<string, MenuStat>();
  stats.forEach((s) => statsMap.set(s.menu_item_id, s));

  const sortedItems = [...menuItems].sort((a, b) => {
    const sa = statsMap.get(a.id)?.total_sold ?? 0;
    const sb = statsMap.get(b.id)?.total_sold ?? 0;
    return sb - sa;
  });

  const bestItem = sortedItems[0];
  const bestRated = [...menuItems].sort((a, b) => (statsMap.get(b.id)?.avg_rating ?? 0) - (statsMap.get(a.id)?.avg_rating ?? 0))[0];

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  // Simplify categories: group into Makanan & Minuman
  const simplifiedCategories = categoryData.reduce((acc, c) => {
    const isMinuman = c.category_name.toLowerCase().includes('minuman');
    const key = isMinuman ? 'Minuman' : 'Makanan';
    const existing = acc.find(a => a.name === key);
    if (existing) {
      existing.value += Number(c.total_sold);
      existing.revenue += Number(c.total_revenue);
    } else {
      acc.push({ name: key, value: Number(c.total_sold), revenue: Number(c.total_revenue) });
    }
    return acc;
  }, [] as { name: string; value: number; revenue: number }[]);

  const pieChartData = simplifiedCategories.map((c, i) => ({
    ...c,
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const revenueChartData = dailyRevenue.map((d) => ({
    day: new Date(d.day).toLocaleDateString('id-ID', { weekday: 'short' }),
    revenue: Number(d.total_revenue),
    orders: Number(d.total_orders),
  }));

  const revenueConfig = {
    revenue: { label: 'Pendapatan', color: 'hsl(var(--primary))' },
    orders: { label: 'Pesanan', color: 'hsl(var(--accent))' },
  };

  const categoryConfig = Object.fromEntries(
    simplifiedCategories.map((c, i) => [c.name, { label: c.name, color: CHART_COLORS[i % CHART_COLORS.length] }])
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="container py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/kitchen')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-bold text-foreground text-lg">Analitik</h1>
        </div>
      </header>

      <div className="container py-4 space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="pt-4 pb-3 space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="w-4 h-4" />
                <span className="text-xs">Pendapatan Hari Ini</span>
              </div>
              <p className="text-base font-bold text-primary">{formatPrice(todaySummary?.totalRevenue ?? 0)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Package className="w-4 h-4" />
                <span className="text-xs">Pesanan Hari Ini</span>
              </div>
              <p className="text-base font-bold">{todaySummary?.totalOrders ?? 0}</p>
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

        {/* Revenue Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pendapatan 7 Hari Terakhir</CardTitle>
          </CardHeader>
          <CardContent className="px-2">
            {revenueChartData.length > 0 ? (
              <ChartContainer config={revenueConfig} className="h-[200px] w-full">
                <BarChart data={revenueChartData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} width={35} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">Belum ada data</div>
            )}
          </CardContent>
        </Card>

        {/* Category Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Penjualan per Kategori</CardTitle>
          </CardHeader>
          <CardContent className="px-2">
            {pieChartData.length > 0 ? (
              <ChartContainer config={categoryConfig} className="h-[200px] w-full">
                <PieChart margin={{ top: 8, bottom: 8 }}>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie data={pieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {pieChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">Belum ada data</div>
            )}
          </CardContent>
        </Card>

        {/* Orders Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Tren Pesanan Harian</CardTitle>
          </CardHeader>
          <CardContent className="px-2">
            {revenueChartData.length > 0 ? (
              <ChartContainer config={revenueConfig} className="h-[180px] w-full">
                <LineChart data={revenueChartData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} width={30} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="orders" stroke="var(--color-orders)" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ChartContainer>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">Belum ada data</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
