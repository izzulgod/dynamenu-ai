import { motion } from 'framer-motion';
import { Percent, Clock, Flame, PartyPopper } from 'lucide-react';
import { useActivePromotions, getPromoPrice, getDiscountBadge } from '@/hooks/usePromotions';
import { MenuItemCard } from '@/components/menu/MenuItemCard';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';

function CountdownTimer({ endDate }: { endDate: string }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date().getTime();
      const end = new Date(endDate).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft('Berakhir');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeLeft(`${days}h ${hours}j ${mins}m`);
      } else {
        setTimeLeft(`${hours}j ${mins}m`);
      }
    };

    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [endDate]);

  return (
    <div className="flex items-center gap-1.5 text-sm text-primary font-medium">
      <Clock className="w-3.5 h-3.5" />
      <span>{timeLeft}</span>
    </div>
  );
}

export function PromoTab() {
  const { data: promotions, isLoading } = useActivePromotions();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl overflow-hidden">
              <Skeleton className="h-40 w-full" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-6 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!promotions || promotions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16 px-6"
      >
        <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <PartyPopper className="w-10 h-10 text-primary" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">
          Belum Ada Promo Saat Ini
        </h3>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Stay tuned! Promo spesial akan segera hadir. Pantau terus ya! 🎉
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {promotions.map((promo, promoIndex) => (
        <motion.div
          key={promo.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: promoIndex * 0.1 }}
          className="space-y-4"
        >
          {/* Promo Banner */}
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20">
            {promo.banner_image_url ? (
              <img
                src={promo.banner_image_url}
                alt={promo.name}
                className="w-full h-40 object-cover"
              />
            ) : (
              <div className="h-40 flex flex-col items-center justify-center p-6 text-center">
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="w-6 h-6 text-primary" />
                  <h3 className="text-xl font-bold text-foreground">{promo.name}</h3>
                </div>
                {promo.description && (
                  <p className="text-sm text-muted-foreground max-w-md">{promo.description}</p>
                )}
                <Badge className="mt-3 bg-primary text-primary-foreground gap-1">
                  <Percent className="w-3 h-3" />
                  {promo.discount_type === 'percent'
                    ? `Diskon ${promo.discount_value}%`
                    : `Diskon Rp${promo.discount_value.toLocaleString('id-ID')}`}
                </Badge>
              </div>
            )}

            {/* Overlay info on banner image */}
            {promo.banner_image_url && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-4">
                <h3 className="text-lg font-bold text-white">{promo.name}</h3>
                {promo.description && (
                  <p className="text-sm text-white/80 line-clamp-1">{promo.description}</p>
                )}
                <Badge className="mt-2 w-fit bg-primary text-primary-foreground gap-1">
                  <Percent className="w-3 h-3" />
                  {promo.discount_type === 'percent'
                    ? `Diskon ${promo.discount_value}%`
                    : `Diskon Rp${promo.discount_value.toLocaleString('id-ID')}`}
                </Badge>
              </div>
            )}

            {/* Countdown */}
            {promo.end_date && (
              <div className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm rounded-full px-3 py-1.5">
                <CountdownTimer endDate={promo.end_date} />
              </div>
            )}
          </div>

          {/* Promo Menu Items Grid */}
          {promo.promotion_items && promo.promotion_items.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {promo.promotion_items.map((promoItem, index) => {
                if (!promoItem.menu_items) return null;
                const menuItem = promoItem.menu_items;
                const promoPrice = getPromoPrice(menuItem.id, menuItem.price, [promo]);
                const discountBadge = getDiscountBadge(menuItem.id, menuItem.price, [promo]);

                return (
                  <MenuItemCard
                    key={promoItem.id}
                    item={menuItem}
                    index={index}
                    promoPrice={promoPrice}
                    discountBadge={discountBadge}
                  />
                );
              })}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
