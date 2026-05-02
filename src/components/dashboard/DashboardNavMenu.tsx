import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, X, BarChart3, MessageSquare, UtensilsCrossed,
  TableProperties, LogOut, Lock, LucideIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface NavItem {
  label: string;
  icon: LucideIcon;
  path: string;
  adminOnly: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Analitik', icon: BarChart3, path: '/admin/analytics', adminOnly: true },
  { label: 'Ulasan', icon: MessageSquare, path: '/admin/reviews', adminOnly: true },
  { label: 'Edit Meja', icon: TableProperties, path: '/admin/tables', adminOnly: true },
  { label: 'Edit Menu', icon: UtensilsCrossed, path: '/admin/menu', adminOnly: true },
];

interface DashboardNavMenuProps {
  onLogout: () => void | Promise<void>;
  /** Role of the current staff member (defaults to 'waiter' if unknown) */
  role?: string;
}

export function DashboardNavMenu({ onLogout, role }: DashboardNavMenuProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);

  const isAdmin = role === 'admin';

  const handleNavigate = (item: NavItem) => {
    if (item.adminOnly && !isAdmin) {
      toast.error('Hanya admin yang dapat mengakses fitur ini', {
        id: `lock-${item.path}`,
      });
      return;
    }
    setOpen(false);
    setTimeout(() => navigate(item.path), 150);
  };

  const handleLogoutClick = () => {
    setOpen(false);
    setTimeout(() => setConfirmLogoutOpen(true), 150);
  };

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        aria-label={open ? 'Tutup menu' : 'Buka menu'}
        onClick={() => setOpen((v) => !v)}
        className="relative overflow-hidden"
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </motion.span>
          ) : (
            <motion.span
              key="menu"
              initial={{ rotate: 90, opacity: 0, scale: 0.6 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: -90, opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Menu className="w-4 h-4" />
            </motion.span>
          )}
        </AnimatePresence>
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center"
            initial={false}
            exit={{ opacity: 1 }}
          >
            <motion.button
              type="button"
              aria-label="Tutup menu"
              className="absolute inset-0 bg-foreground/70 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              onClick={() => setOpen(false)}
            />

            <motion.section
              role="dialog"
              aria-modal="true"
              aria-labelledby="dashboard-menu-title"
              className={cn(
                'relative w-full max-h-[85vh] rounded-t-2xl border-t bg-background shadow-lg',
                'sm:max-w-md sm:mx-auto'
              )}
              initial={{ y: '100%', opacity: 0.98 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0.98 }}
              transition={{ type: 'spring', damping: 34, stiffness: 420, mass: 0.9 }}
              drag="y"
              dragDirectionLock
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.18 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 80 || info.velocity.y > 550) {
                  setOpen(false);
                }
              }}
            >
              <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none" aria-label="Geser ke bawah untuk menutup">
                <div className="w-12 h-1.5 rounded-full bg-muted-foreground/40" />
              </div>

              <div className="px-6 pt-2 pb-3 text-left">
                <h2 id="dashboard-menu-title" className="text-base font-semibold text-foreground">Menu Dashboard</h2>
                {!isAdmin && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-2">
                    <Lock className="w-3 h-3" />
                    Beberapa fitur hanya untuk admin
                  </p>
                )}
              </div>

              <div className="px-3 pb-3">
                <nav className="grid gap-1">
                  {NAV_ITEMS.map((item, idx) => {
                    const Icon = item.icon;
                    const locked = item.adminOnly && !isAdmin;
                    return (
                      <motion.button
                        key={item.path}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.04 * idx, duration: 0.2, ease: 'easeOut' }}
                        onClick={() => handleNavigate(item)}
                        aria-disabled={locked}
                        className={cn(
                          'flex items-center gap-3 w-full px-4 py-3 rounded-xl',
                          'text-sm font-medium transition-colors text-left',
                          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                          locked
                            ? 'text-muted-foreground/70 hover:bg-muted/40 cursor-not-allowed'
                            : 'text-foreground hover:bg-muted active:bg-muted/80'
                        )}
                      >
                        <span
                          className={cn(
                            'relative w-9 h-9 rounded-lg flex items-center justify-center',
                            locked ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'
                          )}
                        >
                          <Icon className="w-4 h-4" />
                          {locked && (
                            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-background border border-border flex items-center justify-center">
                              <Lock className="w-2.5 h-2.5 text-muted-foreground" />
                            </span>
                          )}
                        </span>
                        <span className="flex-1">{item.label}</span>
                        {locked && (
                          <span className="text-[10px] uppercase tracking-wide text-muted-foreground/80 px-1.5 py-0.5 rounded bg-muted">
                            Admin
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </nav>

                <div className="h-px bg-border my-2" />

                <motion.button
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 * NAV_ITEMS.length, duration: 0.2, ease: 'easeOut' }}
                  onClick={handleLogoutClick}
                  className={cn(
                    'flex items-center gap-3 w-full px-4 py-3 rounded-xl',
                    'text-sm font-medium text-destructive',
                    'hover:bg-destructive/10 active:bg-destructive/15 transition-colors',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-destructive'
                  )}
                >
                  <span className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <LogOut className="w-4 h-4" />
                  </span>
                  <span>Logout</span>
                </motion.button>
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>

      <AlertDialog open={confirmLogoutOpen} onOpenChange={setConfirmLogoutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Yakin mau logout?</AlertDialogTitle>
            <AlertDialogDescription>
              Kamu akan keluar dari dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => onLogout()}>Logout</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/** Drag handle area at top of bottom sheet — swipe down to close. */
function SwipeDownHandle({ onClose }: { onClose: () => void }) {
  const startY = useRef<number | null>(null);
  const deltaY = useRef(0);
  const handleRef = useRef<HTMLDivElement | null>(null);

  const getSheet = () =>
    (handleRef.current?.parentElement as HTMLElement | null) ?? null;

  const setTranslate = (y: number) => {
    const sheet = getSheet();
    if (!sheet) return;
    sheet.style.transition = 'none';
    sheet.style.transform = y > 0 ? `translate3d(0, ${y}px, 0)` : '';
  };

  const springBack = () => {
    const sheet = getSheet();
    if (!sheet) return;
    sheet.style.transition = 'transform 220ms cubic-bezier(0.32, 0.72, 0, 1)';
    sheet.style.transform = '';
    const cleanup = () => {
      sheet.style.transition = '';
      sheet.removeEventListener('transitionend', cleanup);
    };
    sheet.addEventListener('transitionend', cleanup);
  };

  const animateOutAndClose = () => {
    const sheet = getSheet();
    if (!sheet) {
      onClose();
      return;
    }
    const distance = Math.max(sheet.getBoundingClientRect().height, 400);
    sheet.style.transition = 'transform 200ms cubic-bezier(0.32, 0.72, 0, 1)';
    sheet.style.transform = `translate3d(0, ${distance}px, 0)`;
    const done = () => {
      sheet.removeEventListener('transitionend', done);
      // Clear inline styles BEFORE close so Radix exit animation has a clean slate.
      sheet.style.transition = '';
      sheet.style.transform = '';
      onClose();
    };
    sheet.addEventListener('transitionend', done);
    // Safety fallback in case transitionend doesn't fire.
    window.setTimeout(done, 260);
  };

  return (
    <div
      ref={handleRef}
      onTouchStart={(e) => {
        startY.current = e.touches[0].clientY;
        deltaY.current = 0;
      }}
      onTouchMove={(e) => {
        if (startY.current === null) return;
        const dy = e.touches[0].clientY - startY.current;
        if (dy > 0) {
          deltaY.current = dy;
          setTranslate(dy);
        }
      }}
      onTouchEnd={() => {
        const shouldClose = deltaY.current > 90;
        startY.current = null;
        deltaY.current = 0;
        if (shouldClose) animateOutAndClose();
        else springBack();
      }}
      onTouchCancel={() => {
        startY.current = null;
        deltaY.current = 0;
        springBack();
      }}
      className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none"
      aria-label="Geser ke bawah untuk menutup"
    >
      <div className="w-12 h-1.5 rounded-full bg-muted-foreground/40" />
    </div>
  );
}
