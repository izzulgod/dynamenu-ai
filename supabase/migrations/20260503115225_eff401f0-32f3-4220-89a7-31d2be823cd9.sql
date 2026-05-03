
-- 1. Restrict customer order updates: only allow notes/payment_method changes
DROP POLICY IF EXISTS "Session users can update their own orders" ON public.orders;

CREATE OR REPLACE FUNCTION public.protect_order_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Staff can change anything
  IF auth.uid() IS NOT NULL AND public.is_active_staff(auth.uid()) THEN
    RETURN NEW;
  END IF;
  -- Non-staff (session users): force protected fields to OLD values
  NEW.status := OLD.status;
  NEW.payment_status := OLD.payment_status;
  NEW.total_amount := OLD.total_amount;
  NEW.session_id := OLD.session_id;
  NEW.table_id := OLD.table_id;
  NEW.id := OLD.id;
  NEW.created_at := OLD.created_at;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_order_columns_trg ON public.orders;
CREATE TRIGGER protect_order_columns_trg
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.protect_order_columns();

CREATE POLICY "Session users can update their own orders"
ON public.orders
FOR UPDATE
TO public
USING (session_id = COALESCE(((current_setting('request.headers'::text, true))::json ->> 'x-session-id'::text), ''::text))
WITH CHECK (session_id = COALESCE(((current_setting('request.headers'::text, true))::json ->> 'x-session-id'::text), ''::text));

-- 2. Force unit_price from menu_items.price on insert (non-staff only)
CREATE OR REPLACE FUNCTION public.enforce_order_item_price()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  authoritative_price numeric;
BEGIN
  IF auth.uid() IS NOT NULL AND public.is_active_staff(auth.uid()) THEN
    RETURN NEW;
  END IF;
  IF NEW.menu_item_id IS NOT NULL THEN
    SELECT price INTO authoritative_price FROM public.menu_items WHERE id = NEW.menu_item_id;
    IF authoritative_price IS NOT NULL THEN
      NEW.unit_price := authoritative_price;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_order_item_price_trg ON public.order_items;
CREATE TRIGGER enforce_order_item_price_trg
BEFORE INSERT ON public.order_items
FOR EACH ROW EXECUTE FUNCTION public.enforce_order_item_price();

-- 3. Recompute orders.total_amount whenever order_items change
CREATE OR REPLACE FUNCTION public.recompute_order_total()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  oid uuid;
BEGIN
  oid := COALESCE(NEW.order_id, OLD.order_id);
  UPDATE public.orders o
  SET total_amount = COALESCE((
    SELECT SUM(oi.quantity * oi.unit_price)
    FROM public.order_items oi
    WHERE oi.order_id = oid
  ), 0)
  WHERE o.id = oid;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS recompute_order_total_trg ON public.order_items;
CREATE TRIGGER recompute_order_total_trg
AFTER INSERT OR DELETE ON public.order_items
FOR EACH ROW EXECUTE FUNCTION public.recompute_order_total();

-- 4. Lock down analytics RPCs to staff only
CREATE OR REPLACE FUNCTION public.get_daily_revenue(days_back integer DEFAULT 7)
RETURNS TABLE(day date, total_revenue numeric, total_orders bigint)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_active_staff(auth.uid()) THEN
    RAISE EXCEPTION 'Staff access required';
  END IF;
  RETURN QUERY
  SELECT
    DATE(o.created_at) AS day,
    COALESCE(SUM(o.total_amount), 0) AS total_revenue,
    COUNT(DISTINCT o.id) AS total_orders
  FROM orders o
  WHERE o.status NOT IN ('cancelled')
    AND o.created_at >= CURRENT_DATE - days_back
  GROUP BY DATE(o.created_at)
  ORDER BY DATE(o.created_at);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_sales_by_category()
RETURNS TABLE(category_name text, total_sold bigint, total_revenue numeric)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_active_staff(auth.uid()) THEN
    RAISE EXCEPTION 'Staff access required';
  END IF;
  RETURN QUERY
  SELECT
    COALESCE(mc.name, 'Lainnya') AS category_name,
    COALESCE(SUM(oi.quantity), 0)::bigint AS total_sold,
    COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS total_revenue
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id AND o.status NOT IN ('cancelled')
  LEFT JOIN menu_items mi ON mi.id = oi.menu_item_id
  LEFT JOIN menu_categories mc ON mc.id = mi.category_id
  GROUP BY mc.name
  ORDER BY COALESCE(SUM(oi.quantity), 0) DESC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_daily_revenue(integer) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.get_daily_revenue(integer) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_sales_by_category() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_sales_by_category() TO authenticated;
