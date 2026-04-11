import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useSubmitFeedback() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const submitFeedback = async (orderId: string, sessionId: string, rating: number, comment?: string) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('feedback').insert({
        order_id: orderId,
        session_id: sessionId,
        rating,
        comment: comment || null,
      });
      if (error) throw error;
      toast.success('Terima kasih atas ulasannya! ⭐');
      queryClient.invalidateQueries({ queryKey: ['menu-item-stats'] });
      return true;
    } catch (err) {
      console.error('Feedback error:', err);
      toast.error('Gagal mengirim ulasan');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { submitFeedback, isSubmitting };
}
