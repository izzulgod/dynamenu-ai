import { useState } from 'react';
import { Star, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useSubmitFeedback } from '@/hooks/useFeedback';
import { motion } from 'framer-motion';

interface OrderRatingProps {
  orderId: string;
  sessionId: string;
  alreadyRated?: boolean;
}

export function OrderRating({ orderId, sessionId, alreadyRated }: OrderRatingProps) {
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(alreadyRated ?? false);
  const { submitFeedback, isSubmitting } = useSubmitFeedback();

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-3"
      >
        <p className="text-sm text-muted-foreground">✅ Ulasan terkirim. Terima kasih!</p>
      </motion.div>
    );
  }

  const handleSubmit = async () => {
    if (rating === 0) return;
    const success = await submitFeedback(orderId, sessionId, rating, comment);
    if (success) setSubmitted(true);
  };

  const displayRating = hoveredStar || rating;

  return (
    <div className="pt-4 mt-3 border-t space-y-3">
      <p className="text-sm font-medium text-foreground">Bagaimana pesanan Anda?</p>
      
      {/* Stars */}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredStar(star)}
            onMouseLeave={() => setHoveredStar(0)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star
              className={`w-7 h-7 transition-colors ${
                star <= displayRating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-muted-foreground/30'
              }`}
            />
          </button>
        ))}
        {displayRating > 0 && (
          <span className="text-sm text-muted-foreground ml-2">
            {displayRating === 1 ? 'Buruk' : displayRating === 2 ? 'Kurang' : displayRating === 3 ? 'Cukup' : displayRating === 4 ? 'Bagus' : 'Sempurna!'}
          </span>
        )}
      </div>

      {/* Comment */}
      {rating > 0 && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
          <Textarea
            placeholder="Kritik & saran (opsional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[60px] text-sm resize-none"
            rows={2}
          />
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full"
          >
            <Send className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Mengirim...' : 'Kirim Ulasan'}
          </Button>
        </motion.div>
      )}
    </div>
  );
}
