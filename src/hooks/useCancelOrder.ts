import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Order } from '@/types/restaurant';

/**
 * Hook for users to cancel their pending orders via secure RPC
 */
export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data, error } = await supabase.rpc('cancel_my_order', { _order_id: orderId });
      if (error) throw error;
      return data as unknown as Order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['all-orders'] });
    },
  });
}
