import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MenuItem } from '@/types/restaurant';

export interface Promotion {
  id: string;
  name: string;
  description: string | null;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  banner_image_url: string | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
}

export interface PromotionItem {
  id: string;
  promotion_id: string;
  menu_item_id: string;
  promo_price: number | null;
  menu_items: MenuItem;
}

export interface PromotionWithItems extends Promotion {
  promotion_items: PromotionItem[];
}

export function useActivePromotions() {
  return useQuery({
    queryKey: ['active-promotions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promotions')
        .select(`
          *,
          promotion_items (
            id,
            promotion_id,
            menu_item_id,
            promo_price,
            menu_items (*)
          )
        `)
        .eq('is_active', true)
        .lte('start_date', new Date().toISOString())
        .or(`end_date.is.null,end_date.gte.${new Date().toISOString()}`);

      if (error) throw error;
      return (data as unknown as PromotionWithItems[]) || [];
    },
  });
}

/**
 * Get the effective promo price for a menu item across all active promotions.
 * Returns null if no promo applies.
 */
export function getPromoPrice(
  menuItemId: string,
  originalPrice: number,
  promotions: PromotionWithItems[] | undefined
): number | null {
  if (!promotions || promotions.length === 0) return null;

  let bestPrice: number | null = null;

  for (const promo of promotions) {
    const promoItem = promo.promotion_items?.find(
      (pi) => pi.menu_item_id === menuItemId
    );
    if (!promoItem) continue;

    let effectivePrice: number;
    if (promoItem.promo_price != null) {
      effectivePrice = promoItem.promo_price;
    } else if (promo.discount_type === 'percent') {
      effectivePrice = originalPrice * (1 - promo.discount_value / 100);
    } else {
      effectivePrice = Math.max(0, originalPrice - promo.discount_value);
    }

    if (bestPrice === null || effectivePrice < bestPrice) {
      bestPrice = effectivePrice;
    }
  }

  return bestPrice;
}

/**
 * Get the discount badge text for a promo item.
 */
export function getDiscountBadge(
  menuItemId: string,
  originalPrice: number,
  promotions: PromotionWithItems[] | undefined
): string | null {
  if (!promotions || promotions.length === 0) return null;

  for (const promo of promotions) {
    const promoItem = promo.promotion_items?.find(
      (pi) => pi.menu_item_id === menuItemId
    );
    if (!promoItem) continue;

    if (promoItem.promo_price != null) {
      const pct = Math.round((1 - promoItem.promo_price / originalPrice) * 100);
      return `-${pct}%`;
    }
    if (promo.discount_type === 'percent') {
      return `-${promo.discount_value}%`;
    }
    return `-Rp${promo.discount_value.toLocaleString('id-ID')}`;
  }

  return null;
}
