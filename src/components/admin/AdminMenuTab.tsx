import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Pencil, Trash2, Upload, X,
  Loader2, Image as ImageIcon, Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCategories, useMenuItems } from '@/hooks/useMenu';
import { MenuItem, MenuCategory, Table as TableType } from '@/types/restaurant';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export function AdminMenuTab() {
  const { data: categories = [], refetch: refetchCategories } = useCategories();
  const { data: menuItems = [], refetch: refetchItems } = useMenuItems();
  const queryClient = useQueryClient();

  const { data: tables = [], refetch: refetchTables } = useQuery({
    queryKey: ['admin-tables'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tables').select('*').order('table_number');
      if (error) throw error;
      return data as TableType[];
    },
  });

  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [subTab, setSubTab] = useState<'menu' | 'tables'>('menu');

  // Table form
  const [tableForm, setTableForm] = useState({ table_number: '', capacity: '4' });
  const [editingTable, setEditingTable] = useState<TableType | null>(null);
  const [isTableDialogOpen, setIsTableDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '', description: '', price: '', category_id: '',
    preparation_time: '15', is_available: true, is_recommended: false,
    tags: '', image_url: '',
  });

  const resetForm = () => {
    setFormData({
      name: '', description: '', price: '', category_id: '',
      preparation_time: '15', is_available: true, is_recommended: false,
      tags: '', image_url: '',
    });
    setEditingItem(null);
  };

  const openCreateDialog = () => { resetForm(); setIsDialogOpen(true); };

  const openEditDialog = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name, description: item.description || '', price: item.price.toString(),
      category_id: item.category_id || '', preparation_time: item.preparation_time.toString(),
      is_available: item.is_available, is_recommended: item.is_recommended,
      tags: item.tags?.join(', ') || '', image_url: item.image_url || '',
    });
    setIsDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('File harus berupa gambar'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Ukuran file maksimal 5MB'); return; }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `menu-${Date.now()}.${fileExt}`;
      const filePath = `menu-images/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('aimenu').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('aimenu').getPublicUrl(filePath);
      setFormData((prev) => ({ ...prev, image_url: publicUrl }));
      toast.success('Gambar berhasil diupload');
    } catch (error) {
      toast.error('Gagal upload gambar');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price) { toast.error('Nama dan harga wajib diisi'); return; }
    setIsSaving(true);
    try {
      const itemData = {
        name: formData.name, description: formData.description || null,
        price: parseFloat(formData.price), category_id: formData.category_id || null,
        preparation_time: parseInt(formData.preparation_time) || 15,
        is_available: formData.is_available, is_recommended: formData.is_recommended,
        tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        image_url: formData.image_url || null,
      };

      if (editingItem) {
        const { error } = await supabase.from('menu_items').update(itemData).eq('id', editingItem.id);
        if (error) throw error;
        toast.success('Menu berhasil diupdate');
      } else {
        const { error } = await supabase.from('menu_items').insert(itemData);
        if (error) throw error;
        toast.success('Menu berhasil ditambahkan');
      }
      setIsDialogOpen(false);
      resetForm();
      refetchItems();
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
    } catch (error) {
      toast.error('Gagal menyimpan menu');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (item: MenuItem) => {
    if (!confirm(`Hapus "${item.name}" dari menu?`)) return;
    try {
      const { error } = await supabase.from('menu_items').delete().eq('id', item.id);
      if (error) throw error;
      toast.success('Menu berhasil dihapus');
      refetchItems();
    } catch (error) {
      toast.error('Gagal menghapus menu');
    }
  };

  // Table CRUD
  const handleSaveTable = async () => {
    if (!tableForm.table_number) { toast.error('Nomor meja wajib diisi'); return; }
    setIsSaving(true);
    try {
      const data = {
        table_number: parseInt(tableForm.table_number),
        capacity: parseInt(tableForm.capacity) || 4,
        is_active: true,
      };
      if (editingTable) {
        const { error } = await supabase.from('tables').update(data).eq('id', editingTable.id);
        if (error) throw error;
        toast.success('Meja berhasil diupdate');
      } else {
        const { error } = await supabase.from('tables').insert(data);
        if (error) throw error;
        toast.success('Meja berhasil ditambahkan');
      }
      setIsTableDialogOpen(false);
      setEditingTable(null);
      setTableForm({ table_number: '', capacity: '4' });
      refetchTables();
    } catch (error) {
      toast.error('Gagal menyimpan meja');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTable = async (table: TableType) => {
    if (!confirm(`Hapus Meja ${table.table_number}?`)) return;
    try {
      const { error } = await supabase.from('tables').delete().eq('id', table.id);
      if (error) throw error;
      toast.success('Meja berhasil dihapus');
      refetchTables();
    } catch (error) {
      toast.error('Gagal menghapus meja');
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  return (
    <div className="space-y-4">
      <Tabs value={subTab} onValueChange={(v) => setSubTab(v as typeof subTab)}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="menu">Menu</TabsTrigger>
            <TabsTrigger value="tables">Meja</TabsTrigger>
          </TabsList>
          {subTab === 'menu' ? (
            <Button size="sm" onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-1" /> Tambah Menu
            </Button>
          ) : (
            <Button size="sm" onClick={() => { setEditingTable(null); setTableForm({ table_number: '', capacity: '4' }); setIsTableDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-1" /> Tambah Meja
            </Button>
          )}
        </div>

        <TabsContent value="menu">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {menuItems.map((item) => (
                <motion.div key={item.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                  <Card className="overflow-hidden group">
                    <div className="relative h-36 bg-muted">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-10 h-10 text-muted-foreground/40" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button size="icon" variant="secondary" onClick={() => openEditDialog(item)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="destructive" onClick={() => handleDelete(item)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      {!item.is_available && (
                        <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded">
                          Habis
                        </div>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-semibold text-sm truncate">{item.name}</h3>
                      <p className="font-bold text-primary text-sm mt-1">{formatPrice(item.price)}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          {menuItems.length === 0 && (
            <div className="text-center py-12">
              <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground text-sm">Belum ada menu</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="tables">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {tables.map((table) => (
              <Card key={table.id} className="group">
                <CardContent className="p-4 text-center relative">
                  <p className="text-3xl font-bold text-primary">{table.table_number}</p>
                  <p className="text-xs text-muted-foreground mt-1">Kapasitas: {table.capacity}</p>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => {
                      setEditingTable(table);
                      setTableForm({ table_number: table.table_number.toString(), capacity: (table.capacity || 4).toString() });
                      setIsTableDialogOpen(true);
                    }}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="w-7 h-7 text-destructive" onClick={() => handleDeleteTable(table)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Menu Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Menu' : 'Tambah Menu Baru'}</DialogTitle>
            <DialogDescription>{editingItem ? 'Perbarui informasi menu' : 'Isi detail menu baru'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Gambar Menu</Label>
              {formData.image_url ? (
                <div className="relative w-full h-40 rounded-lg overflow-hidden border">
                  <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                  <Button size="icon" variant="destructive" className="absolute top-2 right-2"
                    onClick={() => setFormData((prev) => ({ ...prev, image_url: '' }))}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                  {isUploading ? <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /> : (
                    <>
                      <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Upload gambar (max 5MB)</p>
                    </>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                </label>
              )}
            </div>
            <div className="space-y-2">
              <Label>Nama Menu *</Label>
              <Input value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} placeholder="Nasi Goreng Spesial" />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))} placeholder="Deskripsi singkat..." rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Harga (Rp) *</Label>
                <Input type="number" value={formData.price} onChange={(e) => setFormData((p) => ({ ...p, price: e.target.value }))} placeholder="50000" />
              </div>
              <div className="space-y-2">
                <Label>Waktu (menit)</Label>
                <Input type="number" value={formData.preparation_time} onChange={(e) => setFormData((p) => ({ ...p, preparation_time: e.target.value }))} placeholder="15" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Kategori</Label>
              <Select value={formData.category_id} onValueChange={(v) => setFormData((p) => ({ ...p, category_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.icon} {cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tags (pisahkan koma)</Label>
              <Input value={formData.tags} onChange={(e) => setFormData((p) => ({ ...p, tags: e.target.value }))} placeholder="pedas, favorit" />
            </div>
            <div className="flex items-center justify-between">
              <Label>Tersedia</Label>
              <Switch checked={formData.is_available} onCheckedChange={(c) => setFormData((p) => ({ ...p, is_available: c }))} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Rekomendasi</Label>
              <Switch checked={formData.is_recommended} onCheckedChange={(c) => setFormData((p) => ({ ...p, is_recommended: c }))} />
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

      {/* Table Dialog */}
      <Dialog open={isTableDialogOpen} onOpenChange={setIsTableDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingTable ? 'Edit Meja' : 'Tambah Meja'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nomor Meja *</Label>
              <Input type="number" value={tableForm.table_number} onChange={(e) => setTableForm((p) => ({ ...p, table_number: e.target.value }))} placeholder="1" />
            </div>
            <div className="space-y-2">
              <Label>Kapasitas</Label>
              <Input type="number" value={tableForm.capacity} onChange={(e) => setTableForm((p) => ({ ...p, capacity: e.target.value }))} placeholder="4" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTableDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSaveTable} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
