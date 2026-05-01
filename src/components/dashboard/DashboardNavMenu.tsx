import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, X, BarChart3, MessageSquare, UtensilsCrossed,
  TableProperties, LogOut, LucideIcon
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

interface NavItem {
  label: string;
  icon: LucideIcon;
  path: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Analitik', icon: BarChart3, path: '/admin/analytics' },
  { label: 'Ulasan', icon: MessageSquare, path: '/admin/reviews' },
  { label: 'Edit Meja', icon: TableProperties, path: '/admin/tables' },
  { label: 'Edit Menu', icon: UtensilsCrossed, path: '/admin/menu' },
];

interface DashboardNavMenuProps {
  onLogout: () => void | Promise<void>;
}

export function DashboardNavMenu({ onLogout }: DashboardNavMenuProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);

  const handleNavigate = (path: string) => {
    setOpen(false);
    // small delay so the close animation feels natural
    setTimeout(() => navigate(path), 150);
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
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1.5 rounded-full bg-muted-foreground/30" />
          </div>

          <SheetHeader className="px-6 pt-2 pb-3 text-left">
            <SheetTitle className="text-base">Menu Dashboard</SheetTitle>
          </SheetHeader>

          <div className="px-3 pb-3">
            <nav className="grid gap-1">
              {NAV_ITEMS.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.path}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.04 * idx, duration: 0.2, ease: 'easeOut' }}
                    onClick={() => handleNavigate(item.path)}
                    className={cn(
                      'flex items-center gap-3 w-full px-4 py-3 rounded-xl',
                      'text-sm font-medium text-foreground',
                      'hover:bg-muted active:bg-muted/80 transition-colors',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary'
                    )}
                  >
                    <span className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </span>
                    <span>{item.label}</span>
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
