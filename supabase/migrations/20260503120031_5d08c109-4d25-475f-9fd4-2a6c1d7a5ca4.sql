
-- 1) Remove orders/order_items from realtime publication to prevent cross-session broadcast
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='orders') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.orders';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='order_items') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.order_items';
  END IF;
END $$;

-- 2) Drop overly broad guest UPDATE policy on orders
DROP POLICY IF EXISTS "Session users can update their own orders" ON public.orders;

-- 3) Secure RPC: cancel own pending order
CREATE OR REPLACE FUNCTION public.cancel_my_order(_order_id uuid)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sid text;
  result public.orders;
BEGIN
  sid := COALESCE(current_setting('request.headers', true)::json ->> 'x-session-id', '');
  IF sid = '' THEN
    RAISE EXCEPTION 'Missing session';
  END IF;

  UPDATE public.orders
  SET status = 'cancelled', updated_at = now()
  WHERE id = _order_id
    AND session_id = sid
    AND status IN ('pending')
  RETURNING * INTO result;

  IF result.id IS NULL THEN
    RAISE EXCEPTION 'Order not found or not cancellable';
  END IF;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_my_order(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_my_order(uuid) TO anon, authenticated;

-- 4) Secure RPC: set payment method for own order (does not mark as paid)
CREATE OR REPLACE FUNCTION public.set_my_order_payment(_order_id uuid, _payment_method payment_method)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sid text;
  result public.orders;
BEGIN
  sid := COALESCE(current_setting('request.headers', true)::json ->> 'x-session-id', '');
  IF sid = '' THEN
    RAISE EXCEPTION 'Missing session';
  END IF;

  UPDATE public.orders
  SET payment_method = _payment_method, updated_at = now()
  WHERE id = _order_id
    AND session_id = sid
    AND payment_status = 'pending'
  RETURNING * INTO result;

  IF result.id IS NULL THEN
    RAISE EXCEPTION 'Order not found or already paid';
  END IF;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.set_my_order_payment(uuid, payment_method) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_my_order_payment(uuid, payment_method) TO anon, authenticated;
