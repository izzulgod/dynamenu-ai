import { useRef } from 'react';
import { MenuItem } from '@/types/restaurant';
import { useCart } from '@/hooks/useCart';
import { useFlyToCart } from '@/components/cart/FlyToCartProvider';
import { motion } from 'framer-motion';
import { getFoodPlaceholder } from '@/components/menu/menuPlaceholders';
import { Plus, Clock, Star, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { MenuItemStats } from '@/hooks/useMenuStats';

interface MenuItemCardProps {
  item: MenuItem;
  index?: number;
  stats?: MenuItemStats;
}

function formatSoldCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}rb`;
  return `${count}`;
}

// Star fill percentage for partial stars
function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const fill = Math.min(1, Math.max(0, rating - (star - 1)));
        return (
          <div key={star} className="relative w-3 h-3">
            <Star className="w-3 h-3 text-muted-foreground/20 absolute inset-0" />
            <div className="overflow-hidden absolute inset-0" style={{ width: `${fill * 100}%` }}>
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function MenuItemCard({ item, index = 0, stats }: MenuItemCardProps) {
  const { addItem } = useCart();
  const { triggerFly } = useFlyToCart();
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleAddToCart = () => {
    addItem(item);
    toast.success(`${item.name} ditambahkan ke keranjang!`);

    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const imgUrl = item.image_url || getFoodPlaceholder(item.name);
      triggerFly(imgUrl, rect);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const avgRating = stats?.avg_rating ?? 0;
  const totalSold = stats?.total_sold ?? 0;
  const isBestSeller = totalSold >= 10;
  const isFavorite = avgRating >= 4.0 && (stats?.total_reviews ?? 0) >= 2;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="menu-card group"
    >
      {/* Image Container */}
      <div className="relative h-40 overflow-hidden bg-cream-dark">
        <img
          src={item.image_url || getFoodPlaceholder(item.name)}
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = getFoodPlaceholder(item.name);
          }}
        />
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {isFavorite && (
            <Badge className="bg-yellow-500 text-white text-[10px] gap-0.5 px-1.5 py-0.5">
              <Star className="w-2.5 h-2.5 fill-white" />
              Favorit
            </Badge>
          )}
          {isBestSeller && !isFavorite && (
            <Badge className="bg-orange-500 text-white text-[10px] gap-0.5 px-1.5 py-0.5">
              <Flame className="w-2.5 h-2.5" />
              Laris
            </Badge>
          )}
        </div>

        {/* Quick Add Button */}
        <Button
          ref={btnRef}
          size="icon"
          onClick={handleAddToCart}
          className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-primary text-primary-foreground opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 shadow-strong hover:scale-110"
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="p-3 space-y-1.5">
        <h3 className="font-semibold text-foreground line-clamp-1 text-sm">
          {item.name}
        </h3>

        {item.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {item.description}
          </p>
        )}

        {/* Rating & Sold */}
        {(avgRating > 0 || totalSold > 0) && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {avgRating > 0 && (
              <div className="flex items-center gap-1">
                <RatingStars rating={avgRating} />
                <span className="text-xs font-medium text-foreground">{avgRating}</span>
              </div>
            )}
            {avgRating > 0 && totalSold > 0 && (
              <span className="text-muted-foreground text-[10px]">•</span>
            )}
            {totalSold > 0 && (
              <span className="text-xs text-muted-foreground">{formatSoldCount(totalSold)} terjual</span>
            )}
          </div>
        )}

        {/* Price and Time */}
        <div className="flex items-center justify-between pt-1">
          <span className="font-bold text-primary text-base">
            {formatPrice(item.price)}
          </span>
          <div className="flex items-center gap-1 text-muted-foreground text-xs">
            <Clock className="w-3 h-3" />
            <span>{item.preparation_time} min</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
