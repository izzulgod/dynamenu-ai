import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MenuItemStats {
  menu_item_id: string;
  avg_rating: number;
  total_reviews: number;
  total_sold: number;
}

export function useMenuStats() {
  return useQuery({
    queryKey: ['menu-item-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_menu_item_stats');
      if (error) throw error;
      
      const map = new Map<string, MenuItemStats>();
      (data ?? []).forEach((item: any) => {
        map.set(item.menu_item_id, {
          menu_item_id: item.menu_item_id,
          avg_rating: Number(item.avg_rating) || 0,
          total_reviews: Number(item.total_reviews) || 0,
          total_sold: Number(item.total_sold) || 0,
        });
      });
      return map;
    },
    staleTime: 30_000,
  });
}
