import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, X, BarChart3, MessageSquare, UtensilsCrossed,
  TableProperties, LogOut, Lock, LucideIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
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

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className={cn(
            'rounded-t-2xl border-t p-0',
            'max-h-[85vh] sm:max-w-md sm:mx-auto sm:left-0 sm:right-0'
          )}
        >
          <SwipeDownHandle onClose={() => setOpen(false)} />

          <SheetHeader className="px-6 pt-2 pb-3 text-left">
            <SheetTitle className="text-base">Menu Dashboard</SheetTitle>
            {!isAdmin && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Lock className="w-3 h-3" />
                Beberapa fitur hanya untuk admin
              </p>
            )}
          </SheetHeader>

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
        </SheetContent>
      </Sheet>

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
