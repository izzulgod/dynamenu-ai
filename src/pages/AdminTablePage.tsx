import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Users, Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

export default function AdminTablePage() {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/admin'); return; }
      const { data: profile } = await supabase
        .from('staff_profiles')
        .select('id, role, is_active')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .single();
      if (!profile || profile.role !== 'admin') {
        setIsAuthorized(false);
        return;
      }
      setIsAuthorized(true);
    };
    check();
  }, [navigate]);

  const { data: tables = [], refetch } = useQuery({
    queryKey: ['admin-tables'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tables').select('*').order('table_number');
      if (error) throw error;
      return data;
    },
    enabled: isAuthorized === true,
  });

  const [newCapacity, setNewCapacity] = useState('4');

  const handleAddTable = async () => {
    const maxNum = tables.reduce((max, t) => Math.max(max, t.table_number), 0);
    const { error } = await supabase.from('tables').insert({
      table_number: maxNum + 1,
      capacity: parseInt(newCapacity) || 4,
    });
    if (error) { toast.error('Gagal menambah meja'); return; }
    toast.success(`Meja ${maxNum + 1} ditambahkan`);
    refetch();
  };

  const handleUpdateCapacity = async (id: string, capacity: number) => {
    const { error } = await supabase.from('tables').update({ capacity }).eq('id', id);
    if (error) { toast.error('Gagal update kapasitas'); return; }
    refetch();
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    const { error } = await supabase.from('tables').update({ is_active: !isActive }).eq('id', id);
    if (error) { toast.error('Gagal update status meja'); return; }
    toast.success(isActive ? 'Meja dinonaktifkan' : 'Meja diaktifkan');
    refetch();
  };

  const handleDelete = async (id: string, tableNum: number) => {
    if (!confirm(`Hapus Meja ${tableNum}?`)) return;
    const { error } = await supabase.from('tables').delete().eq('id', id);
    if (error) { toast.error('Gagal menghapus meja'); return; }
    toast.success(`Meja ${tableNum} dihapus`);
    refetch();
  };

  if (isAuthorized === null) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }
  if (isAuthorized === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="max-w-md w-full"><CardContent className="pt-6 text-center space-y-4">
          <ShieldAlert className="w-12 h-12 mx-auto text-destructive" />
          <p className="text-destructive font-semibold">Akses ditolak: Hanya admin</p>
          <Button variant="outline" onClick={() => navigate('/admin/kitchen')}><ArrowLeft className="w-4 h-4 mr-2" />Kembali ke Dashboard</Button>
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="container py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/kitchen')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-bold text-foreground text-lg">Kelola Meja</h1>
            <p className="text-xs text-muted-foreground">{tables.length} meja</p>
          </div>
        </div>
      </header>

      <div className="container py-6 space-y-6">
        {/* Add table */}
        <Card>
          <CardContent className="pt-4 flex items-end gap-3">
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium">Kapasitas meja baru</label>
              <Input type="number" value={newCapacity} onChange={(e) => setNewCapacity(e.target.value)} min="1" max="20" />
            </div>
            <Button onClick={handleAddTable}>
              <Plus className="w-4 h-4 mr-2" />Tambah Meja
            </Button>
          </CardContent>
        </Card>

        {/* Table grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {tables.map((table) => (
            <Card key={table.id} className={!table.is_active ? 'opacity-50' : ''}>
              <CardContent className="pt-4 space-y-3 text-center">
                <div className="text-2xl font-bold text-primary">#{table.table_number}</div>
                <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <Input
                    type="number"
                    className="w-16 h-8 text-center text-sm"
                    value={table.capacity ?? 4}
                    onChange={(e) => handleUpdateCapacity(table.id, parseInt(e.target.value) || 4)}
                    min="1"
                    max="20"
                  />
                </div>
                <Badge variant={table.is_active ? 'default' : 'secondary'} className="cursor-pointer" onClick={() => handleToggleActive(table.id, table.is_active ?? true)}>
                  {table.is_active ? 'Aktif' : 'Nonaktif'}
                </Badge>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(table.id, table.table_number)}>
                  <Trash2 className="w-3 h-3 mr-1" />Hapus
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
