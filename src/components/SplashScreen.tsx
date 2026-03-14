import { motion, AnimatePresence } from 'framer-motion';
import logoImg from '@/assets/logo.png';

interface SplashScreenProps {
  show: boolean;
}

const SplashScreen = ({ show }: SplashScreenProps) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="splash"
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          {/* Animated background circles */}
          <motion.div
            className="absolute w-72 h-72 rounded-full bg-primary/10 blur-3xl"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.2, 1], opacity: [0, 0.6, 0.3] }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
          <motion.div
            className="absolute w-56 h-56 rounded-full bg-sage/15 blur-2xl translate-x-20 translate-y-10"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.3, 1], opacity: [0, 0.5, 0.2] }}
            transition={{ duration: 1.5, delay: 0.2, ease: 'easeOut' }}
          />

          {/* Logo */}
          <motion.img
            src={logoImg}
            alt="DynamenuAI"
            className="w-24 h-24 md:w-32 md:h-32 relative z-10 rounded-3xl shadow-lg ring-2 ring-primary/20 p-1 bg-card"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
          />

          {/* Brand name */}
          <motion.h1
            className="text-2xl md:text-3xl font-bold text-foreground mt-4 relative z-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            Dynamenu<span className="text-gradient">AI</span>
          </motion.h1>

          {/* Tagline */}
          <motion.p
            className="text-sm text-muted-foreground mt-2 relative z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            Smart Restaurant Ordering
          </motion.p>

          {/* Loading dots */}
          <div className="flex gap-1.5 mt-8 relative z-10">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-primary"
                initial={{ opacity: 0.3, scale: 0.8 }}
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
