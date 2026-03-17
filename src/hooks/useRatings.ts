import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MenuItemRating {
  menu_item_id: string;
  avg_rating: number;
  total_reviews: number;
}

export function useMenuItemRatings() {
  return useQuery({
    queryKey: ['menu-item-ratings'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_menu_item_ratings');
      if (error) throw error;
      return (data || []) as MenuItemRating[];
    },
    refetchInterval: 30000,
  });
}

export interface FeedbackWithDetails {
  id: string;
  rating: number | null;
  comment: string | null;
  created_at: string | null;
  session_id: string;
  order_id: string | null;
}

export function useAllFeedback() {
  return useQuery({
    queryKey: ['all-feedback'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as FeedbackWithDetails[];
    },
  });
}

export function useSessionFeedback(sessionId: string) {
  return useQuery({
    queryKey: ['session-feedback', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .eq('session_id', sessionId);
      if (error) throw error;
      return data as FeedbackWithDetails[];
    },
    enabled: !!sessionId,
  });
}

export function getRatingColor(rating: number): string {
  if (rating >= 5.0) return 'text-yellow-500';
  if (rating >= 4.0) return 'text-yellow-400';
  if (rating >= 3.0) return 'text-yellow-300';
  if (rating >= 2.0) return 'text-yellow-200';
  return 'text-muted-foreground';
}

export function getRatingBgColor(rating: number): string {
  if (rating >= 5.0) return 'bg-yellow-500';
  if (rating >= 4.0) return 'bg-yellow-400';
  if (rating >= 3.0) return 'bg-yellow-300';
  if (rating >= 2.0) return 'bg-yellow-200';
  return 'bg-muted';
}
