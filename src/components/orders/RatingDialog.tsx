import { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useSubmitFeedback } from '@/hooks/useFeedback';
import { toast } from 'sonner';

interface RatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
}

export function RatingDialog({ open, onOpenChange, orderId }: RatingDialogProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const submitFeedback = useSubmitFeedback();

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Pilih rating bintang terlebih dahulu');
      return;
    }

    try {
      await submitFeedback.mutateAsync({ orderId, rating, comment });
      toast.success('Terima kasih atas penilaian Anda! 🙏');
      setRating(0);
      setComment('');
      onOpenChange(false);
    } catch (error) {
      toast.error('Gagal mengirim penilaian');
    }
  };

  const displayRating = hoveredRating || rating;

  const ratingLabels: Record<number, string> = {
    1: 'Buruk 😞',
    2: 'Kurang 😕',
    3: 'Cukup 😐',
    4: 'Baik 😊',
    5: 'Luar Biasa! 🤩',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">Beri Penilaian ⭐</DialogTitle>
          <DialogDescription className="text-center">
            Bagaimana pengalaman makan Anda?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Star Rating */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 transition-transform hover:scale-125"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= displayRating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground/30'
                    }`}
                  />
                </button>
              ))}
            </div>
            {displayRating > 0 && (
              <span className="text-sm font-medium text-muted-foreground">
                {ratingLabels[displayRating]}
              </span>
            )}
          </div>

          {/* Comment */}
          <Textarea
            placeholder="Tulis komentar atau saran Anda (opsional)..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            maxLength={500}
          />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Lewati
          </Button>
          <Button onClick={handleSubmit} disabled={submitFeedback.isPending || rating === 0}>
            Kirim Penilaian
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
