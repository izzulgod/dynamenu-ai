-- Drop existing chat_messages RLS policies
DROP POLICY IF EXISTS "Session users can view their own table chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Session users can create their own table chat messages" ON public.chat_messages;

-- Recreate with 24-hour session expiration
CREATE POLICY "Session users can view their own table chat messages"
ON public.chat_messages
FOR SELECT
USING (
  session_id = COALESCE(
    ((current_setting('request.headers'::text, true))::json ->> 'x-session-id'::text),
    ''::text
  )
  AND created_at >= (now() - interval '24 hours')
  AND (
    table_id IS NULL
    OR table_id IN (SELECT t.id FROM tables t WHERE t.is_active = true)
  )
);

CREATE POLICY "Session users can create their own table chat messages"
ON public.chat_messages
FOR INSERT
WITH CHECK (
  session_id = COALESCE(
    ((current_setting('request.headers'::text, true))::json ->> 'x-session-id'::text),
    ''::text
  )
  AND session_id <> ''::text
  AND (
    table_id IS NULL
    OR table_id IN (SELECT t.id FROM tables t WHERE t.is_active = true)
  )
);

-- Also add staff SELECT policy so kitchen/admin can still see all messages
CREATE POLICY "Staff can view all chat messages"
ON public.chat_messages
FOR SELECT
USING (is_active_staff(auth.uid()));