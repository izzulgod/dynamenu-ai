import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useDailyRevenue(daysBack = 7) {
  return useQuery({
    queryKey: ['daily-revenue', daysBack],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_daily_revenue', { days_back: daysBack });
      if (error) throw error;
      return (data ?? []) as { day: string; total_revenue: number; total_orders: number }[];
    },
  });
}

export function useSalesByCategory() {
  return useQuery({
    queryKey: ['sales-by-category'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_sales_by_category');
      if (error) throw error;
      return (data ?? []) as { category_name: string; total_sold: number; total_revenue: number }[];
    },
  });
}

export function useTodaySummary() {
  return useQuery({
    queryKey: ['today-summary'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      // Today's orders
      const { data: orders, error: ordersErr } = await supabase
        .from('orders')
        .select('id, total_amount, status')
        .gte('created_at', todayISO)
        .neq('status', 'cancelled');
      if (ordersErr) throw ordersErr;

      const totalOrders = orders?.length ?? 0;
      const totalRevenue = orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) ?? 0;

      return { totalOrders, totalRevenue };
    },
  });
}
