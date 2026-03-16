import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useCategories } from '@/hooks/useMenu';
import { MenuCategory } from '@/types/restaurant';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function CategoryManagement() {
  const queryClient = useQueryClient();
  const { data: categories = [], isLoading } = useCategories();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<MenuCategory | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '🍽️',
    sort_order: '0',
    is_active: true,
  });

  const resetForm = () => {
    setFormData({ name: '', description: '', icon: '🍽️', sort_order: '0', is_active: true });
    setEditingCat(null);
  };

  const openCreate = () => { resetForm(); setIsDialogOpen(true); };

  const openEdit = (c: MenuCategory) => {
    setEditingCat(c);
    setFormData({
      name: c.name,
      description: c.description || '',
      icon: c.icon || '🍽️',
      sort_order: c.sort_order.toString(),
      is_active: true,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) { toast.error('Nama kategori wajib diisi'); return; }
    setIsSaving(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description || null,
        icon: formData.icon || null,
        sort_order: parseInt(formData.sort_order) || 0,
        is_active: formData.is_active,
      };
      if (editingCat) {
        const { error } = await supabase.from('menu_categories').update(payload).eq('id', editingCat.id);
        if (error) throw error;
        toast.success('Kategori berhasil diupdate');
      } else {
        const { error } = await supabase.from('menu_categories').insert(payload);
        if (error) throw error;
        toast.success('Kategori berhasil ditambahkan');
      }
      setIsDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
    } catch (error: any) {
      toast.error(error?.message || 'Gagal menyimpan kategori');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (c: MenuCategory) => {
    if (!confirm(`Hapus kategori "${c.name}"?`)) return;
    try {
      const { error } = await supabase.from('menu_categories').delete().eq('id', c.id);
      if (error) throw error;
      toast.success('Kategori berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
    } catch (error) {
      toast.error('Gagal menghapus kategori');
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold">Kelola Kategori ({categories.length})</h2>
        <Button onClick={openCreate} size="sm"><Plus className="w-4 h-4 mr-2" />Tambah Kategori</Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((c) => (
          <Card key={c.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{c.icon || '🍽️'}</span>
                  <span className="font-semibold">{c.name}</span>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(c)}><Pencil className="w-4 h-4" /></Button>
                  <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(c)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
              {c.description && <p className="text-sm text-muted-foreground">{c.description}</p>}
              <p className="text-xs text-muted-foreground mt-1">Urutan: {c.sort_order}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">Belum ada kategori.</div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingCat ? 'Edit Kategori' : 'Tambah Kategori Baru'}</DialogTitle>
            <DialogDescription>{editingCat ? 'Perbarui informasi kategori' : 'Isi detail kategori baru'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nama Kategori *</Label>
              <Input value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="Makanan Utama" />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Input value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="Hidangan utama restoran" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Icon (emoji)</Label>
                <Input value={formData.icon} onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))} placeholder="🍽️" />
              </div>
              <div className="space-y-2">
                <Label>Urutan</Label>
                <Input type="number" value={formData.sort_order} onChange={(e) => setFormData(prev => ({ ...prev, sort_order: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Aktif</Label>
              <Switch checked={formData.is_active} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))} />
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
