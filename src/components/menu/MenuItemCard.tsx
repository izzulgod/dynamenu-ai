import { useRef } from 'react';
import { MenuItem } from '@/types/restaurant';
import { useCart } from '@/hooks/useCart';
import { useFlyToCart } from '@/components/cart/FlyToCartProvider';
import { motion } from 'framer-motion';
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

// Food placeholder images based on keywords
const getFoodPlaceholder = (name: string): string => {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('nasi goreng') || lowerName.includes('fried rice')) {
    return 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop';
  }
  if (lowerName.includes('nasi') || lowerName.includes('rice')) {
    return 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=400&h=300&fit=crop';
  }
  if (lowerName.includes('mie') || lowerName.includes('noodle') || lowerName.includes('bakmi')) {
    return 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop';
  }
  if (lowerName.includes('ayam') || lowerName.includes('chicken')) {
    return 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400&h=300&fit=crop';
  }
  if (lowerName.includes('sate') || lowerName.includes('satay')) {
    return 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop';
  }
  if (lowerName.includes('soto') || lowerName.includes('soup') || lowerName.includes('sup')) {
    return 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop';
  }
  if (lowerName.includes('rendang') || lowerName.includes('beef') || lowerName.includes('sapi')) {
    return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop';
  }
  if (lowerName.includes('seafood') || lowerName.includes('ikan') || lowerName.includes('fish') || lowerName.includes('udang') || lowerName.includes('shrimp')) {
    return 'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=400&h=300&fit=crop';
  }
  if (lowerName.includes('teh') || lowerName.includes('tea')) {
    return 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop';
  }
  if (lowerName.includes('kopi') || lowerName.includes('coffee')) {
    return 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop';
  }
  if (lowerName.includes('jus') || lowerName.includes('juice') || lowerName.includes('smoothie')) {
    return 'https://images.unsplash.com/photo-1546173159-315724a31696?w=400&h=300&fit=crop';
  }
  if (lowerName.includes('es') || lowerName.includes('ice') || lowerName.includes('minuman')) {
    return 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=300&fit=crop';
  }
  if (lowerName.includes('dessert') || lowerName.includes('kue') || lowerName.includes('cake')) {
    return 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&h=300&fit=crop';
  }
  
  return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop';
};

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
