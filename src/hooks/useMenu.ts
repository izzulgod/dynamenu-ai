import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MenuCategory, MenuItem } from '@/types/restaurant';
import type { MenuFilter } from '@/components/menu/CategoryTabs';

export function useCategories() {
  return useQuery({
    queryKey: ['menu-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      if (error) throw error;
      return data as MenuCategory[];
    },
  });
}

export function useMenuItems(filter: MenuFilter = 'all') {
  const { data: categories = [] } = useCategories();

  return useQuery({
    queryKey: ['menu-items', filter, categories.map(c => c.id)],
    queryFn: async () => {
      let query = supabase
        .from('menu_items')
        .select('*')
        .eq('is_available', true)
        .order('is_recommended', { ascending: false });
      
      if (filter !== 'all' && categories.length > 0) {
        // "minuman" = categories with name containing "minuman" (case-insensitive)
        // "makanan" = everything else
        const minumanIds = categories
          .filter(c => c.name.toLowerCase().includes('minuman'))
          .map(c => c.id);
        const makananIds = categories
          .filter(c => !c.name.toLowerCase().includes('minuman'))
          .map(c => c.id);

        const ids = filter === 'minuman' ? minumanIds : makananIds;
        if (ids.length > 0) {
          query = query.in('category_id', ids);
        } else {
          return [] as MenuItem[];
        }
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as MenuItem[];
    },
    enabled: filter === 'all' || categories.length > 0,
  });
}

export function useRecommendedItems() {
  return useQuery({
    queryKey: ['recommended-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_available', true)
        .eq('is_recommended', true)
        .limit(6);
      
      if (error) throw error;
      return data as MenuItem[];
    },
  });
}
