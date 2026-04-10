import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { UtensilsCrossed, Coffee } from 'lucide-react';

export type MenuFilter = 'all' | 'makanan' | 'minuman';

interface CategoryTabsProps {
  selected: MenuFilter;
  onSelect: (filter: MenuFilter) => void;
}

const filters: { key: MenuFilter; label: string; icon?: React.ReactNode }[] = [
  { key: 'all', label: 'Semua' },
  { key: 'makanan', label: 'Makanan', icon: <UtensilsCrossed className="w-4 h-4" /> },
  { key: 'minuman', label: 'Minuman', icon: <Coffee className="w-4 h-4" /> },
];

export function CategoryTabs({ selected, onSelect }: CategoryTabsProps) {
  return (
    <div className="flex gap-2">
      {filters.map((f) => (
        <motion.button
          key={f.key}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(f.key)}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-full transition-all duration-300 text-sm',
            selected === f.key
              ? 'bg-primary text-primary-foreground shadow-glow'
              : 'bg-card border border-border text-foreground hover:bg-secondary'
          )}
        >
          {f.icon}
          <span className="font-medium">{f.label}</span>
        </motion.button>
      ))}
    </div>
  );
}
