

## Fitur Promo / Event Diskon — Saran & Rencana

### Analisis Situasi

Bottom nav sekarang punya 3 tab: **Menu**, **Pesanan**, **Chat AI**. Halaman menu memang sudah padat dengan category tabs + grid menu items. Menaruh promo di dalam tab Menu akan bikin crowded.

### Rekomendasi: Tambah Tab "Promo" di Bottom Nav

Opsi terbaik adalah **menambahkan tab ke-4 "Promo"** (ikon 🏷️/Percent) di bottom navigation bar. Alasan:

- **Tidak mengganggu** layout Menu yang sudah padat
- **Discoverable** — user langsung lihat ada promo dari nav bar
- **Dedicated space** untuk banner event, countdown, dan daftar menu diskon
- Bottom nav dengan 4 item masih nyaman di mobile (standar industri: Grab, Gojek, Shopee semua 4-5 tab)

### Arsitektur Data

**Tabel baru `promotions`:**
- `id`, `name`, `description`, `discount_type` (percent/fixed), `discount_value`, `banner_image_url`
- `start_date`, `end_date`, `is_active`

**Tabel baru `promotion_items`** (many-to-many):
- `promotion_id` → `promotions`, `menu_item_id` → `menu_items`
- `promo_price` (override, nullable — kalau null pakai kalkulasi dari discount)

### UI di Tab Promo

1. **Banner carousel** di atas — gambar event (Ramadan, Anniversary, dll) dengan countdown timer kalau ada end_date
2. **Grid menu items yang sedang promo** — sama seperti MenuItemCard tapi dengan badge "🔥 -20%" dan harga coret
3. Tap item → bisa add to cart dengan **harga promo otomatis**
4. Kalau tidak ada promo aktif → tampilan kosong yang friendly "Belum ada promo saat ini, stay tuned!"

### Integrasi AI Chat

- Edge function `restaurant-ai` ditambah context promo aktif saat ini
- AI bisa jawab "ada promo apa?" dan merekomendasikan menu yang lagi diskon
- Action `add_to_cart` tetap pakai `menuItemId`, harga promo dikalkulasi di frontend/backend

### Integrasi Checkout

- Di cart, item promo tampil dengan harga asli dicoret + harga promo
- Total dihitung pakai harga promo
- Di order, `unit_price` disimpan sebagai harga final (sudah diskon)

### Admin Management

- Tambah section di `AdminMenuPage` untuk CRUD promo
- Admin bisa pilih menu items mana yang masuk promo, set diskon, upload banner, set tanggal

### Langkah Implementasi

1. Buat migration: tabel `promotions` + `promotion_items` dengan RLS
2. Buat hooks `usePromotions`, `usePromoItems`  
3. Buat komponen `PromoTab` dengan banner + grid menu diskon
4. Tambah tab "Promo" ke bottom nav (ikon `Percent`)
5. Update `MenuItemCard` untuk support tampilan harga promo (badge + harga coret)
6. Update cart logic untuk apply harga promo
7. Update edge function `restaurant-ai` dengan context promo
8. Tambah admin CRUD promo di dashboard

