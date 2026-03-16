import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Table } from '@/types/restaurant';

export function TableManagement() {
  const queryClient = useQueryClient();
  const { data: tables = [], isLoading } = useQuery({
    queryKey: ['admin-tables'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .order('table_number');
      if (error) throw error;
      return data as (Table & { created_at: string; updated_at: string })[];
    },
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    table_number: '',
    capacity: '4',
    is_active: true,
  });

  const resetForm = () => {
    setFormData({ table_number: '', capacity: '4', is_active: true });
    setEditingTable(null);
  };

  const openCreate = () => { resetForm(); setIsDialogOpen(true); };

  const openEdit = (t: Table) => {
    setEditingTable(t);
    setFormData({
      table_number: t.table_number.toString(),
      capacity: t.capacity.toString(),
      is_active: t.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.table_number) { toast.error('Nomor meja wajib diisi'); return; }
    setIsSaving(true);
    try {
      const payload = {
        table_number: parseInt(formData.table_number),
        capacity: parseInt(formData.capacity) || 4,
        is_active: formData.is_active,
      };
      if (editingTable) {
        const { error } = await supabase.from('tables').update(payload).eq('id', editingTable.id);
        if (error) throw error;
        toast.success('Meja berhasil diupdate');
      } else {
        const { error } = await supabase.from('tables').insert(payload);
        if (error) throw error;
        toast.success('Meja berhasil ditambahkan');
      }
      setIsDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['admin-tables'] });
    } catch (error: any) {
      toast.error(error?.message || 'Gagal menyimpan meja');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (t: Table) => {
    if (!confirm(`Hapus Meja ${t.table_number}?`)) return;
    try {
      const { error } = await supabase.from('tables').delete().eq('id', t.id);
      if (error) throw error;
      toast.success('Meja berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['admin-tables'] });
    } catch (error) {
      toast.error('Gagal menghapus meja');
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold">Kelola Meja ({tables.length})</h2>
        <Button onClick={openCreate} size="sm"><Plus className="w-4 h-4 mr-2" />Tambah Meja</Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tables.map((t) => (
          <Card key={t.id} className={!t.is_active ? 'opacity-60' : ''}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold text-primary">#{t.table_number}</span>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(t)}><Pencil className="w-4 h-4" /></Button>
                  <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(t)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Kapasitas: {t.capacity} orang</p>
              <p className={`text-xs mt-1 ${t.is_active ? 'text-green-600' : 'text-red-500'}`}>
                {t.is_active ? '✅ Aktif' : '❌ Tidak Aktif'}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {tables.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">Belum ada meja. Klik "Tambah Meja" untuk mulai.</div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingTable ? 'Edit Meja' : 'Tambah Meja Baru'}</DialogTitle>
            <DialogDescription>{editingTable ? 'Perbarui informasi meja' : 'Isi detail meja baru'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nomor Meja *</Label>
              <Input type="number" value={formData.table_number} onChange={(e) => setFormData(prev => ({ ...prev, table_number: e.target.value }))} placeholder="1" />
            </div>
            <div className="space-y-2">
              <Label>Kapasitas (orang)</Label>
              <Input type="number" value={formData.capacity} onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))} placeholder="4" />
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
