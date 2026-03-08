import { MenuCategory } from '@/types/restaurant';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface CategoryTabsProps {
  categories: MenuCategory[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

export function CategoryTabs({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryTabsProps) {
  return (
    <div className="overflow-x-auto scrollbar-hide">
      <div className="flex gap-2 pb-2">
        {/* All items button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelectCategory(null)}
          className={cn(
            'px-4 py-2 rounded-full whitespace-nowrap transition-all duration-300 font-medium',
            selectedCategory === null
              ? 'bg-primary text-primary-foreground shadow-glow'
              : 'bg-card border border-border text-foreground hover:bg-secondary'
          )}
        >
          Semua
        </motion.button>

        {/* Category buttons */}
        {categories.map((category) => (
          <motion.button
            key={category.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelectCategory(category.id)}
            className={cn(
              'px-4 py-2 rounded-full whitespace-nowrap transition-all duration-300 font-medium',
              selectedCategory === category.id
                ? 'bg-primary text-primary-foreground shadow-glow'
                : 'bg-card border border-border text-foreground hover:bg-secondary'
            )}
          >
            {category.name}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
