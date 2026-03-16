
-- Function to get average ratings per menu item via feedback -> orders -> order_items
CREATE OR REPLACE FUNCTION public.get_menu_item_ratings()
RETURNS TABLE(menu_item_id uuid, avg_rating numeric, total_reviews bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    oi.menu_item_id,
    ROUND(AVG(f.rating)::numeric, 1) as avg_rating,
    COUNT(DISTINCT f.id) as total_reviews
  FROM feedback f
  JOIN orders o ON f.order_id = o.id
  JOIN order_items oi ON oi.order_id = o.id
  WHERE f.rating IS NOT NULL AND oi.menu_item_id IS NOT NULL
  GROUP BY oi.menu_item_id
$$;
