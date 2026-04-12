

## Plan: Overhaul Halaman Analitik & Tambah Manajemen Restoran Lengkap

Ini adalah perombakan besar yang mencakup dua area utama: (1) memperkaya halaman Analitik dengan grafik dan laporan keuangan, dan (2) menambahkan fitur manajemen restoran lengkap (stok, meja, menu) di dashboard admin.

### Arsitektur Baru Dashboard Admin

Dashboard admin akan ditata ulang menjadi **tab-based layout** di KitchenDashboard dengan 4 tab:
- **Orders** (sudah ada) — antrean pesanan
- **Menu** (gabung AdminMenuPage ke sini) — kelola menu, stok, harga, foto
- **Meja** (baru) — kelola kapasitas, tambah/hapus meja
- **Analitik** (revamp) — grafik pendapatan, penjualan, dan ulasan ringkas

### Detail Perubahan

**1. Revamp Halaman Analitik (`KitchenAnalyticsPage.tsx`)**

Bagian atas — Summary Cards:
- Total Pendapatan Hari Ini
- Total Pesanan Hari Ini  
- Menu Terlaris
- Rating Tertinggi/Terendah

Bagian tengah — Charts (menggunakan Recharts yang sudah ter-install):
- **Bar Chart**: Pendapatan per hari (7 hari terakhir)
- **Pie Chart**: Distribusi penjualan per kategori menu
- **Line Chart**: Tren jumlah pesanan harian

Bagian bawah — Ulasan:
- Dipersingkat, hanya tampil 3 ulasan terbaru per menu
- Tombol "Lihat Semua Ulasan" yang expand/collapse (Collapsible/Accordion)
- Tetap anonim (Meja X)

Data diambil dari tabel `orders`, `order_items`, `feedback` via query yang sudah ada + query baru untuk agregasi harian.

**2. Manajemen Menu yang Lebih Lengkap (di `AdminMenuPage.tsx`)**

Fitur yang sudah ada: tambah, edit nama/deskripsi/harga/foto, hapus menu. Ini sudah cukup lengkap.

Yang ditambahkan:
- **Stok Menu**: Tambah kolom `stock` (integer, nullable) di tabel `menu_items`. Jika null = unlimited. Admin bisa set/edit stok. Stok otomatis berkurang saat pesanan dikonfirmasi.
- UI: Tampilkan badge stok di kartu menu admin. Tombol +/- quick-adjust stok.

**3. Manajemen Meja (Baru — section di AdminMenuPage atau tab terpisah)**

- List semua meja dengan nomor dan kapasitas
- Edit kapasitas meja
- Tambah meja baru (auto-increment nomor)
- Hapus/nonaktifkan meja
- UI: Grid sederhana dengan card per meja

**4. Database Migration**

```sql
-- Tambah kolom stock ke menu_items
ALTER TABLE menu_items ADD COLUMN stock integer DEFAULT NULL;

-- Function untuk agregasi pendapatan harian
CREATE OR REPLACE FUNCTION get_daily_revenue(days_back integer DEFAULT 7)
RETURNS TABLE(day date, total_revenue numeric, total_orders bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT 
    DATE(o.created_at) as day,
    COALESCE(SUM(o.total_amount), 0) as total_revenue,
    COUNT(DISTINCT o.id) as total_orders
  FROM orders o
  WHERE o.status NOT IN ('cancelled')
    AND o.created_at >= CURRENT_DATE - days_back
  GROUP BY DATE(o.created_at)
  ORDER BY day
$$;

-- Function untuk penjualan per kategori
CREATE OR REPLACE FUNCTION get_sales_by_category()
RETURNS TABLE(category_name text, total_sold bigint, total_revenue numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT 
    COALESCE(mc.name, 'Lainnya') as category_name,
    COALESCE(SUM(oi.quantity), 0)::bigint as total_sold,
    COALESCE(SUM(oi.quantity * oi.unit_price), 0) as total_revenue
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id AND o.status NOT IN ('cancelled')
  LEFT JOIN menu_items mi ON mi.id = oi.menu_item_id
  LEFT JOIN menu_categories mc ON mc.id = mi.category_id
  GROUP BY mc.name
  ORDER BY total_sold DESC
$$;
```

**5. File yang Diubah/Dibuat**

| File | Aksi |
|------|------|
| `KitchenAnalyticsPage.tsx` | Revamp total — tambah charts, summary cards, collapsible ulasan |
| `AdminMenuPage.tsx` | Tambah quick-stock adjustment UI |
| `KitchenDashboard.tsx` | Tambah navigasi ke manajemen meja |
| `src/pages/AdminTablePage.tsx` | **Baru** — halaman kelola meja |
| `src/App.tsx` | Tambah route `/admin/tables` |
| `src/hooks/useAnalytics.ts` | **Baru** — hooks untuk data chart |
| Database migration | Tambah kolom `stock`, 2 RPC functions |

### Catatan
- Semua fitur manajemen (menu, meja) tetap restricted ke role `admin` via RLS
- Charts menggunakan Recharts (sudah ada di project via `chart.tsx`)
- Stok bersifat opsional (null = unlimited) agar tidak breaking existing flow

