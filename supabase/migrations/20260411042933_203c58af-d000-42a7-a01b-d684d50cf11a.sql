
CREATE OR REPLACE FUNCTION public.get_menu_item_stats()
RETURNS TABLE(menu_item_id uuid, avg_rating numeric, total_reviews bigint, total_sold bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    mi.id as menu_item_id,
    COALESCE(ROUND(AVG(f.rating)::numeric, 1), 0) as avg_rating,
    COUNT(DISTINCT f.id) as total_reviews,
    COALESCE(SUM(oi.quantity), 0)::bigint as total_sold
  FROM menu_items mi
  LEFT JOIN order_items oi ON oi.menu_item_id = mi.id
  LEFT JOIN orders o ON o.id = oi.order_id AND o.status NOT IN ('cancelled')
  LEFT JOIN feedback f ON f.order_id = o.id AND f.rating IS NOT NULL
  GROUP BY mi.id
$$;
