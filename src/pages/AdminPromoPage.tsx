import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Percent, LogOut, Plus, Pencil, Trash2, Upload, X,
  Loader2, ShieldAlert, ArrowLeft, Save, Calendar, Image as ImageIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMenuItems } from '@/hooks/useMenu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface Promotion {
  id: string;
  name: string;
  description: string | null;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  banner_image_url: string | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
}

interface PromotionItem {
  id: string;
  promotion_id: string;
  menu_item_id: string;
  promo_price: number | null;
}

export default function AdminPromoPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [staffName, setStaffName] = useState('');

  const { data: menuItems = [] } = useMenuItems();

  const { data: promotions = [], refetch: refetchPromos } = useQuery({
    queryKey: ['admin-promotions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Promotion[];
    },
    enabled: isAuthorized === true,
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedMenuItems, setSelectedMenuItems] = useState<string[]>([]);
  const [promoItemPrices, setPromoItemPrices] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discount_type: 'percent' as 'percent' | 'fixed',
    discount_value: '',
    banner_image_url: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    is_active: true,
  });

  useEffect(() => {
    const checkAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/admin'); return; }

      const { data: profile, error } = await supabase
        .from('staff_profiles')
        .select('id, name, role, is_active')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .single();

      if (error || !profile || profile.role !== 'admin') {
        setIsAuthorized(false);
        toast.error('Akses ditolak: Hanya admin yang dapat mengelola promo');
        return;
      }

      setIsAuthorized(true);
      setStaffName(profile.name);
    };

    checkAccess();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin');
  };

  const resetForm = () => {
    setFormData({
      name: '', description: '', discount_type: 'percent', discount_value: '',
      banner_image_url: '', start_date: new Date().toISOString().split('T')[0],
      end_date: '', is_active: true,
    });
    setEditingPromo(null);
    setSelectedMenuItems([]);
    setPromoItemPrices({});
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = async (promo: Promotion) => {
    setEditingPromo(promo);
    setFormData({
      name: promo.name,
      description: promo.description || '',
      discount_type: promo.discount_type,
      discount_value: promo.discount_value.toString(),
      banner_image_url: promo.banner_image_url || '',
      start_date: promo.start_date ? new Date(promo.start_date).toISOString().split('T')[0] : '',
      end_date: promo.end_date ? new Date(promo.end_date).toISOString().split('T')[0] : '',
      is_active: promo.is_active,
    });

    // Fetch existing promotion items
    const { data: items } = await supabase
      .from('promotion_items')
      .select('*')
      .eq('promotion_id', promo.id);

    if (items) {
      setSelectedMenuItems(items.map(i => i.menu_item_id));
      const prices: Record<string, string> = {};
      items.forEach(i => {
        if (i.promo_price != null) prices[i.menu_item_id] = i.promo_price.toString();
      });
      setPromoItemPrices(prices);
    }

    setIsDialogOpen(true);
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('File harus berupa gambar'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Ukuran file maksimal 5MB'); return; }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `promo-${Date.now()}.${fileExt}`;
      const filePath = `promo-banners/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('aimenu').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('aimenu').getPublicUrl(filePath);
      setFormData(prev => ({ ...prev, banner_image_url: publicUrl }));
      toast.success('Banner berhasil diupload');
    } catch {
      toast.error('Gagal upload banner');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.discount_value) {
      toast.error('Nama dan nilai diskon wajib diisi');
      return;
    }
    if (selectedMenuItems.length === 0) {
      toast.error('Pilih minimal 1 menu item untuk promo');
      return;
    }

    setIsSaving(true);
    try {
      const promoData = {
        name: formData.name,
        description: formData.description || null,
        discount_type: formData.discount_type as 'percent' | 'fixed',
        discount_value: parseFloat(formData.discount_value),
        banner_image_url: formData.banner_image_url || null,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
        is_active: formData.is_active,
      };

      let promoId: string;

      if (editingPromo) {
        const { error } = await supabase
          .from('promotions')
          .update(promoData)
          .eq('id', editingPromo.id);
        if (error) throw error;
        promoId = editingPromo.id;

        // Delete old items and re-insert
        await supabase.from('promotion_items').delete().eq('promotion_id', promoId);
      } else {
        const { data, error } = await supabase
          .from('promotions')
          .insert(promoData)
          .select('id')
          .single();
        if (error) throw error;
        promoId = data.id;
      }

      // Insert promotion items
      const promoItems = selectedMenuItems.map(menuItemId => ({
        promotion_id: promoId,
        menu_item_id: menuItemId,
        promo_price: promoItemPrices[menuItemId] ? parseFloat(promoItemPrices[menuItemId]) : null,
      }));

      const { error: itemsError } = await supabase.from('promotion_items').insert(promoItems);
      if (itemsError) throw itemsError;

      toast.success(editingPromo ? 'Promo berhasil diupdate' : 'Promo berhasil dibuat');
      setIsDialogOpen(false);
      resetForm();
      refetchPromos();
      queryClient.invalidateQueries({ queryKey: ['active-promotions'] });
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Gagal menyimpan promo');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (promo: Promotion) => {
    if (!confirm(`Hapus promo "${promo.name}"?`)) return;
    try {
      const { error } = await supabase.from('promotions').delete().eq('id', promo.id);
      if (error) throw error;
      toast.success('Promo berhasil dihapus');
      refetchPromos();
    } catch {
      toast.error('Gagal menghapus promo');
    }
  };

  const toggleMenuItem = (menuItemId: string) => {
    setSelectedMenuItems(prev =>
      prev.includes(menuItemId)
        ? prev.filter(id => id !== menuItemId)
        : [...prev, menuItemId]
    );
  };

  if (isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isAuthorized === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <ShieldAlert className="w-16 h-16 mx-auto text-destructive" />
            <h2 className="text-xl font-bold text-destructive">Akses Ditolak</h2>
            <Button onClick={handleLogout} variant="outline" className="w-full">
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/kitchen')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Percent className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-foreground">Kelola Promo</h1>
              <p className="text-xs text-muted-foreground">👋 {staffName} • {promotions.length} promo</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" /> Tambah Promo
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Promo List */}
      <div className="container py-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {promotions.map((promo) => (
              <motion.div
                key={promo.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <Card className="overflow-hidden group">
                  <div className="relative h-32 bg-gradient-to-br from-primary/15 to-primary/5">
                    {promo.banner_image_url ? (
                      <img src={promo.banner_image_url} alt={promo.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Percent className="w-12 h-12 text-primary/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button size="icon" variant="secondary" onClick={() => openEditDialog(promo)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="destructive" onClick={() => handleDelete(promo)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    {!promo.is_active && (
                      <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground">
                        Nonaktif
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold truncate">{promo.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {promo.discount_type === 'percent'
                        ? `Diskon ${promo.discount_value}%`
                        : `Diskon Rp${promo.discount_value.toLocaleString('id-ID')}`}
                    </p>
                    {promo.end_date && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        s/d {new Date(promo.end_date).toLocaleDateString('id-ID')}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {promotions.length === 0 && (
          <div className="text-center py-12">
            <Percent className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">Belum ada promo. Klik "Tambah Promo" untuk mulai.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPromo ? 'Edit Promo' : 'Tambah Promo Baru'}</DialogTitle>
            <DialogDescription>
              {editingPromo ? 'Perbarui informasi promo' : 'Buat promo baru dengan menu diskon'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Banner Upload */}
            <div className="space-y-2">
              <Label>Banner Promo</Label>
              {formData.banner_image_url ? (
                <div className="relative w-full h-32 rounded-lg overflow-hidden border">
                  <img src={formData.banner_image_url} alt="Preview" className="w-full h-full object-cover" />
                  <Button
                    size="icon" variant="destructive" className="absolute top-2 right-2"
                    onClick={() => setFormData(prev => ({ ...prev, banner_image_url: '' }))}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  {isUploading ? (
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Upload banner (opsional)</p>
                    </>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={handleBannerUpload} disabled={isUploading} />
                </label>
              )}
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label>Nama Promo *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Promo Ramadhan 2026"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Deskripsi promo..."
                rows={2}
              />
            </div>

            {/* Discount Type & Value */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipe Diskon</Label>
                <Select
                  value={formData.discount_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, discount_type: value as 'percent' | 'fixed' }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Persen (%)</SelectItem>
                    <SelectItem value="fixed">Nominal (Rp)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nilai Diskon *</Label>
                <Input
                  type="number"
                  value={formData.discount_value}
                  onChange={(e) => setFormData(prev => ({ ...prev, discount_value: e.target.value }))}
                  placeholder={formData.discount_type === 'percent' ? '20' : '10000'}
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tanggal Mulai</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Tanggal Selesai</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                />
              </div>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between">
              <Label>Aktif</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
            </div>

            {/* Menu Items Selection */}
            <div className="space-y-2">
              <Label>Pilih Menu yang Masuk Promo *</Label>
              <div className="max-h-48 overflow-y-auto border rounded-lg p-2 space-y-1">
                {menuItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                    <Checkbox
                      checked={selectedMenuItems.includes(item.id)}
                      onCheckedChange={() => toggleMenuItem(item.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Rp{item.price.toLocaleString('id-ID')}
                      </p>
                    </div>
                    {selectedMenuItems.includes(item.id) && (
                      <Input
                        type="number"
                        className="w-28 h-8 text-xs"
                        placeholder="Harga promo"
                        value={promoItemPrices[item.id] || ''}
                        onChange={(e) => setPromoItemPrices(prev => ({
                          ...prev,
                          [item.id]: e.target.value,
                        }))}
                      />
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedMenuItems.length} item dipilih. Kosongkan harga promo untuk menggunakan diskon umum.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
