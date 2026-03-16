import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getSessionId } from '@/lib/session';

export function useAllFeedback() {
  return useQuery({
    queryKey: ['all-feedback'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feedback')
        .select('*, orders(id, table_id, total_amount, created_at, tables(table_number), order_items(menu_item_id, menu_items(name)))')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSubmitFeedback() {
  const queryClient = useQueryClient();
  const sessionId = getSessionId();

  return useMutation({
    mutationFn: async ({ orderId, rating, comment }: { orderId: string; rating: number; comment?: string }) => {
      const { data, error } = await supabase
        .from('feedback')
        .insert({
          order_id: orderId,
          rating,
          comment: comment || null,
          session_id: sessionId,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-item-ratings'] });
      queryClient.invalidateQueries({ queryKey: ['session-feedback'] });
    },
  });
}

export function useSessionFeedback() {
  const sessionId = getSessionId();
  return useQuery({
    queryKey: ['session-feedback', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feedback')
        .select('order_id, rating')
        .eq('session_id', sessionId);
      if (error) throw error;
      return data ?? [];
    },
  });
}
