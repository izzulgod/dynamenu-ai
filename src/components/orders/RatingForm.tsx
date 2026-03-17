import { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface RatingFormProps {
  orderId: string;
  sessionId: string;
  alreadyRated?: boolean;
}

export function RatingForm({ orderId, sessionId, alreadyRated }: RatingFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(alreadyRated || false);
  const queryClient = useQueryClient();

  if (submitted) {
    return (
      <div className="text-center py-3 text-sm text-muted-foreground">
        ⭐ Terima kasih atas ulasan Anda!
      </div>
    );
  }

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Pilih rating terlebih dahulu');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('feedback').insert({
        order_id: orderId,
        session_id: sessionId,
        rating,
        comment: comment.trim() || null,
      });

      if (error) throw error;

      toast.success('Ulasan berhasil dikirim!');
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ['menu-item-ratings'] });
      queryClient.invalidateQueries({ queryKey: ['session-feedback'] });
    } catch (error) {
      console.error('Rating error:', error);
      toast.error('Gagal mengirim ulasan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border-t pt-3 mt-3 space-y-3">
      <p className="text-sm font-medium">Beri Rating Pesanan</p>
      
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`w-7 h-7 transition-colors ${
                star <= (hoveredRating || rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-muted-foreground/30'
              }`}
            />
          </button>
        ))}
      </div>

      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Tulis ulasan (opsional)..."
        rows={2}
        className="resize-none text-sm"
      />

      <Button
        size="sm"
        onClick={handleSubmit}
        disabled={isSubmitting || rating === 0}
        className="w-full"
      >
        {isSubmitting ? 'Mengirim...' : 'Kirim Ulasan'}
      </Button>
    </div>
  );
}
