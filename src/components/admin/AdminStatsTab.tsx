import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMenuItemRatings } from '@/hooks/useRatings';
import { useMenuItems } from '@/hooks/useMenu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingBag, DollarSign, Flame, Star, TrendingDown } from 'lucide-react';

export function AdminStatsTab() {
  const { data: menuItems = [] } = useMenuItems();
  const { data: ratings = [] } = useMenuItemRatings();

  const { data: todayStats, isLoading } = useQuery({
    queryKey: ['admin-stats-today'],
    queryFn: async () => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      // Get today's orders (not cancelled)
      const { data: orders, error } = await supabase
        .from('orders')
        .select('id, total_amount, status, created_at, order_items(quantity, menu_item_id)')
        .gte('created_at', todayStart.toISOString())
        .neq('status', 'cancelled');

      if (error) throw error;

      const totalOrders = orders?.length || 0;
      const totalIncome = orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;

      // Count menu items ordered
      const menuCount = new Map<string, number>();
      orders?.forEach((o) => {
        (o.order_items as any[])?.forEach((item: any) => {
          if (item.menu_item_id) {
            menuCount.set(item.menu_item_id, (menuCount.get(item.menu_item_id) || 0) + item.quantity);
          }
        });
      });

      let mostOrderedId = '';
      let mostOrderedCount = 0;
      menuCount.forEach((count, id) => {
        if (count > mostOrderedCount) {
          mostOrderedCount = count;
          mostOrderedId = id;
        }
      });

      return { totalOrders, totalIncome, mostOrderedId, mostOrderedCount };
    },
    refetchInterval: 30000,
  });

  const getMenuName = (id: string) => menuItems.find((m) => m.id === id)?.name || '-';

  const sortedRatings = [...ratings].sort((a, b) => b.avg_rating - a.avg_rating);
  const highestRated = sortedRatings[0];
  const lowestRated = sortedRatings[sortedRatings.length - 1];

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold">Statistik Hari Ini</h2>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-3xl font-bold">{todayStats?.totalOrders || 0}</p>
            <p className="text-xs text-muted-foreground">Total Pesanan</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <DollarSign className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <p className="text-lg font-bold">{formatPrice(todayStats?.totalIncome || 0)}</p>
            <p className="text-xs text-muted-foreground">Total Pendapatan</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <Flame className="w-8 h-8 mx-auto mb-2 text-orange-500" />
            <p className="text-sm font-bold truncate">
              {todayStats?.mostOrderedId ? getMenuName(todayStats.mostOrderedId) : '-'}
            </p>
            <p className="text-xs text-muted-foreground">
              Paling Dipesan {todayStats?.mostOrderedCount ? `(${todayStats.mostOrderedCount}x)` : ''}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <Star className="w-8 h-8 mx-auto mb-2 text-yellow-400 fill-yellow-400" />
            <p className="text-sm font-bold truncate">
              {highestRated ? getMenuName(highestRated.menu_item_id) : '-'}
            </p>
            <p className="text-xs text-muted-foreground">
              Rating Tertinggi {highestRated ? `(${highestRated.avg_rating})` : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {lowestRated && (
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <TrendingDown className="w-6 h-6 text-red-500 shrink-0" />
            <div>
              <p className="text-sm font-bold">{getMenuName(lowestRated.menu_item_id)}</p>
              <p className="text-xs text-muted-foreground">
                Rating Terendah ({lowestRated.avg_rating}) — {lowestRated.total_reviews} ulasan
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
