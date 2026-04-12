
-- Add stock column to menu_items (nullable = unlimited)
ALTER TABLE menu_items ADD COLUMN stock integer DEFAULT NULL;

-- Function for daily revenue aggregation
CREATE OR REPLACE FUNCTION get_daily_revenue(days_back integer DEFAULT 7)
RETURNS TABLE(day date, total_revenue numeric, total_orders bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT 
    DATE(o.created_at) as day,
    COALESCE(SUM(o.total_amount), 0) as total_revenue,
    COUNT(DISTINCT o.id) as total_orders
  FROM orders o
  WHERE o.status NOT IN ('cancelled')
    AND o.created_at >= CURRENT_DATE - days_back
  GROUP BY DATE(o.created_at)
  ORDER BY day
$$;

-- Function for sales by category
CREATE OR REPLACE FUNCTION get_sales_by_category()
RETURNS TABLE(category_name text, total_sold bigint, total_revenue numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT 
    COALESCE(mc.name, 'Lainnya') as category_name,
    COALESCE(SUM(oi.quantity), 0)::bigint as total_sold,
    COALESCE(SUM(oi.quantity * oi.unit_price), 0) as total_revenue
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id AND o.status NOT IN ('cancelled')
  LEFT JOIN menu_items mi ON mi.id = oi.menu_item_id
  LEFT JOIN menu_categories mc ON mc.id = mi.category_id
  GROUP BY mc.name
  ORDER BY total_sold DESC
$$;
