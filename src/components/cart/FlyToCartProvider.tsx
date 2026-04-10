import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FlyingItem {
  id: string;
  imageUrl: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

interface FlyToCartContextType {
  triggerFly: (imageUrl: string, startRect: DOMRect) => void;
  cartIconRef: React.RefObject<HTMLElement | null>;
}

const FlyToCartContext = createContext<FlyToCartContextType | null>(null);

export function useFlyToCart() {
  const ctx = useContext(FlyToCartContext);
  if (!ctx) throw new Error('useFlyToCart must be used within FlyToCartProvider');
  return ctx;
}

export function FlyToCartProvider({ children }: { children: React.ReactNode }) {
  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([]);
  const cartIconRef = useRef<HTMLElement | null>(null);
  let counter = useRef(0);

  const triggerFly = useCallback((imageUrl: string, startRect: DOMRect) => {
    const cartEl = cartIconRef.current;
    if (!cartEl) return;

    const cartRect = cartEl.getBoundingClientRect();
    const id = `fly-${counter.current++}-${Date.now()}`;

    const item: FlyingItem = {
      id,
      imageUrl,
      startX: startRect.left + startRect.width / 2 - 24,
      startY: startRect.top + startRect.height / 2 - 24,
      endX: cartRect.left + cartRect.width / 2 - 12,
      endY: cartRect.top + cartRect.height / 2 - 12,
    };

    setFlyingItems((prev) => [...prev, item]);

    // Remove after animation
    setTimeout(() => {
      setFlyingItems((prev) => prev.filter((i) => i.id !== id));
    }, 600);
  }, []);

  return (
    <FlyToCartContext.Provider value={{ triggerFly, cartIconRef }}>
      {children}

      {/* Flying items portal */}
      <AnimatePresence>
        {flyingItems.map((item) => (
          <motion.div
            key={item.id}
            initial={{
              position: 'fixed',
              left: item.startX,
              top: item.startY,
              width: 48,
              height: 48,
              opacity: 1,
              scale: 1,
              zIndex: 9999,
              borderRadius: 12,
              overflow: 'hidden',
              pointerEvents: 'none' as const,
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            }}
            animate={{
              left: item.endX,
              top: item.endY,
              width: 24,
              height: 24,
              opacity: 0.4,
              scale: 0.3,
              borderRadius: 24,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.5,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            style={{
              position: 'fixed',
              zIndex: 9999,
              pointerEvents: 'none',
            }}
          >
            <img
              src={item.imageUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </FlyToCartContext.Provider>
  );
}
