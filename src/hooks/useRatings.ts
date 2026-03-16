import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MenuItemRating {
  menu_item_id: string;
  avg_rating: number;
  total_reviews: number;
}

export function useMenuItemRatings() {
  return useQuery({
    queryKey: ['menu-item-ratings'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_menu_item_ratings');
      if (error) throw error;
      return (data as MenuItemRating[]) ?? [];
    },
    staleTime: 30_000,
  });
}

export function useMenuItemRating(menuItemId: string) {
  const { data: ratings = [] } = useMenuItemRatings();
  return ratings.find((r) => r.menu_item_id === menuItemId) ?? null;
}
