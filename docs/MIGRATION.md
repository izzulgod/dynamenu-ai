# 🚀 Panduan Migrasi RestoAI ke Vercel / Netlify

Panduan lengkap untuk memindahkan deployment dari Lovable ke hosting sendiri (Vercel/Netlify) dengan seluruh backend (database, edge functions, auth, storage).

---

## Daftar Isi

1. [Persiapan Awal](#1-persiapan-awal)
2. [Setup Supabase Project Sendiri](#2-setup-supabase-project-sendiri)
3. [Export & Import Database](#3-export--import-database)
4. [Deploy Edge Functions](#4-deploy-edge-functions)
5. [Setup Environment Variables](#5-setup-environment-variables)
6. [Deploy ke Vercel](#6-deploy-ke-vercel)
7. [Deploy ke Netlify](#7-deploy-ke-netlify)
8. [Konfigurasi Domain & CORS](#8-konfigurasi-domain--cors)
9. [Verifikasi & Testing](#9-verifikasi--testing)
10. [Checklist Migrasi](#10-checklist-migrasi)

---

## 1. Persiapan Awal

### Yang Dibutuhkan
- Akun [GitHub](https://github.com) (untuk connect repo)
- Akun [Supabase](https://supabase.com) (gratis)
- Akun [Vercel](https://vercel.com) atau [Netlify](https://netlify.com) (gratis)
- Node.js v18+ & npm terinstall
- Supabase CLI terinstall

### Install Supabase CLI
```bash
npm install -g supabase
supabase login
```

### Clone Repository dari GitHub
Pastikan project sudah di-connect ke GitHub dari Lovable (Settings → GitHub → Connect).

```bash
git clone https://github.com/USERNAME/REPO_NAME.git
cd REPO_NAME
npm install
```

### Test Build Lokal
```bash
npm run build
```
Pastikan build berhasil tanpa error sebelum lanjut.

---

## 2. Setup Supabase Project Sendiri

### Langkah 1: Buat Project Baru
1. Buka [supabase.com/dashboard](https://supabase.com/dashboard)
2. Klik **New Project**
3. Pilih organisasi
4. Isi:
   - **Name**: `restoai-production` (atau nama lain)
   - **Database Password**: buat password kuat (simpan!)
   - **Region**: pilih yang dekat target user (misal: Southeast Asia - Singapore)
5. Klik **Create new project**
6. Tunggu ~2 menit sampai selesai

### Langkah 2: Catat Credentials
Setelah project dibuat, buka **Settings → API** dan catat:

| Key | Lokasi | Contoh |
|-----|--------|--------|
| **Project URL** | Settings → API → Project URL | `https://abcdefghijk.supabase.co` |
| **Project ID** | Settings → General | `abcdefghijk` |
| **anon/public key** | Settings → API → Project API Keys | `eyJhbGci...` |
| **service_role key** | Settings → API → Project API Keys (⚠️ RAHASIA) | `eyJhbGci...` |
| **Database Password** | Yang kamu set saat buat project | - |

> ⚠️ **PENTING**: `service_role` key TIDAK BOLEH diexpose di frontend. Hanya untuk Edge Functions.

---

## 3. Export & Import Database

### Opsi A: Menggunakan Supabase CLI (Recommended)

```bash
# Link ke project Supabase baru
supabase link --project-ref PROJECT_ID_BARU

# Push semua migration yang ada di folder supabase/migrations/
supabase db push
```

Ini akan menjalankan semua file migration secara berurutan ke database baru.

### Opsi B: Manual via SQL Editor

1. Buka Supabase Dashboard → **SQL Editor**
2. Buka folder `supabase/migrations/` di project kamu
3. Urutkan file berdasarkan nama (timestamp)
4. Copy-paste dan jalankan setiap file migration satu per satu secara berurutan

### Import Data Menu (Opsional)

Jika kamu ingin memindahkan data menu yang sudah ada:

```sql
-- Export dari database lama (jalankan di SQL Editor project lama)
-- Copy hasilnya

-- Contoh insert kategori
INSERT INTO menu_categories (name, description, icon, sort_order, is_active) VALUES
  ('Makanan Pembuka', 'Hidangan pembuka', NULL, 1, true),
  ('Hidangan Utama', 'Menu utama', NULL, 2, true),
  ('Minuman', 'Aneka minuman', NULL, 3, true),
  ('Pencuci Mulut', 'Dessert', NULL, 4, true);

-- Contoh insert meja
INSERT INTO tables (table_number, capacity, is_active) VALUES
  (1, 2, true), (2, 2, true), (3, 4, true), (4, 4, true),
  (5, 6, true), (6, 6, true), (7, 8, true), (8, 8, true);
```

### Setup Storage Bucket

1. Buka Supabase Dashboard → **Storage**
2. Klik **New Bucket**
3. Nama: `aimenu`
4. Centang **Public bucket**
5. Klik **Create bucket**
6. Upload ulang gambar menu jika ada

---

## 4. Deploy Edge Functions

Project ini memiliki 3 Edge Functions yang HARUS di-deploy:

### Langkah 1: Setup Secrets di Supabase

Buka **Settings → Edge Functions → Secrets** dan tambahkan:

| Secret Name | Value | Keterangan |
|-------------|-------|------------|
| `LOVABLE_API_KEY` | *(lihat catatan di bawah)* | Untuk AI chat |
| `ELEVENLABS_API_KEY` | API key ElevenLabs kamu | Untuk Text-to-Speech |

> **CATATAN tentang LOVABLE_API_KEY**: 
> Edge function `restaurant-ai` menggunakan Lovable AI Gateway (`ai.gateway.lovable.dev`). 
> Setelah migrasi, kamu perlu mengganti ini dengan API AI sendiri. Lihat [bagian penggantian AI](#mengganti-ai-provider) di bawah.

### Langkah 2: Deploy Functions

```bash
# Pastikan sudah link ke project
supabase link --project-ref PROJECT_ID_BARU

# Deploy semua functions
supabase functions deploy restaurant-ai --no-verify-jwt
supabase functions deploy elevenlabs-tts --no-verify-jwt
supabase functions deploy create-demo-staff --no-verify-jwt
```

> Flag `--no-verify-jwt` dibutuhkan karena functions ini dipanggil tanpa auth token dari customer.

### Mengganti AI Provider

File: `supabase/functions/restaurant-ai/index.ts`

**Saat ini** menggunakan Lovable AI Gateway:
```typescript
// GANTI INI:
const aiResponse = await fetch(
  "https://ai.gateway.lovable.dev/v1/chat/completions",
  {
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      ...
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      ...
    }),
  }
);
```

**Opsi pengganti:**

#### A. Google Gemini (Recommended - ada free tier)
```typescript
const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");

const aiResponse = await fetch(
  "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GOOGLE_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gemini-2.0-flash",
      messages: aiMessages,
      temperature: 0.8,
      max_tokens: 500,
    }),
  }
);
```
- Dapatkan API key di: [aistudio.google.com](https://aistudio.google.com)
- Tambahkan secret: `GOOGLE_API_KEY`

#### B. OpenAI
```typescript
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const aiResponse = await fetch(
  "https://api.openai.com/v1/chat/completions",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: aiMessages,
      temperature: 0.8,
      max_tokens: 500,
    }),
  }
);
```
- Dapatkan API key di: [platform.openai.com](https://platform.openai.com)
- Tambahkan secret: `OPENAI_API_KEY`

---

## 5. Setup Environment Variables

### File yang Perlu Diubah

Buat file `.env` di root project (JANGAN commit ke GitHub!):

```env
VITE_SUPABASE_URL=https://PROJECT_ID_BARU.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=anon_key_baru_kamu
VITE_SUPABASE_PROJECT_ID=PROJECT_ID_BARU
```

### Update `.gitignore`

Pastikan `.env` ada di `.gitignore`:
```
.env
.env.local
.env.production
```

### Update Supabase Client

Edit `src/integrations/supabase/client.ts`:
```typescript
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { getSessionId } from '@/lib/session';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

function createSupabaseClient(): SupabaseClient<Database> {
  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      headers: {
        'x-session-id': getSessionId(),
      },
    },
  });
}

export const supabase = createSupabaseClient();
```

> Tidak perlu hardcode URL/key — cukup pastikan environment variables benar.

---

## 6. Deploy ke Vercel

### Langkah 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Langkah 2: Login & Deploy
```bash
vercel login
vercel
```

Ikuti prompt:
- **Set up and deploy?** → `Y`
- **Which scope?** → Pilih akun kamu
- **Link to existing project?** → `N` (buat baru)
- **Project name?** → `restoai` (atau nama lain)
- **Directory?** → `./` (root)
- **Override settings?** → `N`

### Langkah 3: Set Environment Variables

```bash
# Atau via Vercel Dashboard → Settings → Environment Variables
vercel env add VITE_SUPABASE_URL
# Paste: https://PROJECT_ID_BARU.supabase.co

vercel env add VITE_SUPABASE_PUBLISHABLE_KEY
# Paste: anon_key_baru

vercel env add VITE_SUPABASE_PROJECT_ID
# Paste: PROJECT_ID_BARU
```

Atau buka **Vercel Dashboard → Project → Settings → Environment Variables** dan tambahkan ketiga variabel di atas untuk environment `Production`, `Preview`, dan `Development`.

### Langkah 4: Setup SPA Routing

Buat file `vercel.json` di root project:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

> Ini PENTING karena React Router menggunakan client-side routing. Tanpa ini, refresh di `/menu?table=1` akan 404.

### Langkah 5: Redeploy
```bash
vercel --prod
```

### Langkah 6: Connect GitHub (Auto Deploy)

1. Buka [vercel.com/dashboard](https://vercel.com/dashboard)
2. Pilih project → **Settings → Git**
3. Klik **Connect Git Repository**
4. Pilih repo GitHub kamu
5. Sekarang setiap push ke `main` akan auto-deploy!

---

## 7. Deploy ke Netlify

### Langkah 1: Install Netlify CLI
```bash
npm install -g netlify-cli
netlify login
```

### Langkah 2: Setup SPA Routing

Buat file `public/_redirects`:
```
/*    /index.html   200
```

> Sama seperti Vercel, ini diperlukan untuk React Router.

### Langkah 3: Build & Deploy

```bash
# Build project
npm run build

# Deploy ke Netlify
netlify deploy --prod --dir=dist
```

Atau deploy via **Netlify Dashboard**:
1. Buka [app.netlify.com](https://app.netlify.com)
2. Klik **Add new site → Import an existing project**
3. Connect ke GitHub → Pilih repo
4. Build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Klik **Deploy site**

### Langkah 4: Set Environment Variables

Buka **Netlify Dashboard → Site → Site configuration → Environment variables** dan tambahkan:

| Key | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | `https://PROJECT_ID_BARU.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `anon_key_baru` |
| `VITE_SUPABASE_PROJECT_ID` | `PROJECT_ID_BARU` |

Lalu **redeploy** dari dashboard.

---

## 8. Konfigurasi Domain & CORS

### Custom Domain

**Vercel:**
1. Dashboard → Project → Settings → Domains
2. Add domain → Ikuti instruksi DNS

**Netlify:**
1. Dashboard → Site → Domain management → Add custom domain
2. Ikuti instruksi DNS

### Update CORS di Edge Functions

Setelah deploy, update CORS headers di setiap Edge Function jika perlu membatasi akses:

```typescript
// supabase/functions/restaurant-ai/index.ts
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://yourdomain.com", // Ganti dengan domain kamu
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, ...",
};
```

> Untuk development, bisa tetap pakai `"*"` tapi untuk production sebaiknya spesifik.

### Update Supabase Auth Redirect URLs

1. Buka Supabase Dashboard → **Authentication → URL Configuration**
2. Update **Site URL** ke domain baru: `https://yourdomain.com`
3. Tambahkan **Redirect URLs**:
   - `https://yourdomain.com/**`
   - `http://localhost:5173/**` (untuk dev)

---

## 9. Verifikasi & Testing

Setelah deploy, test semua fitur:

### Checklist Testing

| Fitur | URL/Cara Test | Expected |
|-------|---------------|----------|
| Landing Page | `https://yourdomain.com` | Halaman utama tampil |
| Menu Page | `https://yourdomain.com/menu?table=1` | Menu tampil dengan data |
| AI Chat | Klik bubble chat → kirim pesan | AI merespons |
| Tambah ke Keranjang | Klik tombol + di menu item | Item masuk keranjang |
| Checkout/Pembayaran | Klik keranjang → checkout | Dialog pembayaran muncul |
| Staff Login | `https://yourdomain.com/admin` | Form login tampil |
| Kitchen Dashboard | Login sebagai kitchen → `/admin/kitchen` | Pesanan realtime |
| Voice TTS | Klik icon speaker di chat | Suara terdengar |

### Troubleshooting

**Menu tidak tampil:**
- Cek environment variables sudah benar
- Cek RLS policies di Supabase (menu_items harus bisa SELECT untuk anon)
- Buka browser console → cek error

**AI Chat error:**
- Cek Edge Function logs: Supabase Dashboard → Edge Functions → restaurant-ai → Logs
- Pastikan API key AI sudah di-set di Secrets
- Jika pakai Lovable API key, perlu diganti ke provider sendiri (lihat bagian 4)

**Login staff gagal:**
- Pastikan ada user di Supabase Auth
- Pastikan ada entry di `staff_profiles` table
- Cek apakah `is_active = true`

**Halaman 404 saat refresh:**
- Pastikan sudah setup SPA routing (`vercel.json` atau `_redirects`)

---

## 10. Checklist Migrasi

Gunakan checklist ini untuk memastikan semua langkah sudah dilakukan:

- [ ] Clone repo dari GitHub
- [ ] `npm install` & `npm run build` sukses
- [ ] Buat project Supabase baru
- [ ] Catat semua credentials (URL, anon key, service role key)
- [ ] Link Supabase CLI ke project baru
- [ ] Push database migrations (`supabase db push`)
- [ ] Buat storage bucket `aimenu` (public)
- [ ] Upload gambar menu (jika ada)
- [ ] Setup Supabase Secrets (API keys)
- [ ] Ganti AI provider dari Lovable Gateway ke Gemini/OpenAI
- [ ] Deploy Edge Functions
- [ ] Buat `.env` dengan credentials baru
- [ ] Buat `vercel.json` atau `public/_redirects` untuk SPA routing
- [ ] Deploy ke Vercel/Netlify
- [ ] Set environment variables di hosting
- [ ] Update CORS di Edge Functions (opsional)
- [ ] Update Auth redirect URLs di Supabase
- [ ] Insert data meja (`tables`)
- [ ] Insert data kategori menu & menu items
- [ ] Buat user staff di Supabase Auth
- [ ] Insert staff profile di database
- [ ] Test semua fitur (lihat checklist testing)
- [ ] Setup custom domain (opsional)
- [ ] Generate QR codes untuk meja dengan URL baru

---

## Catatan Penting

### Biaya
- **Supabase Free Tier**: 500MB database, 1GB storage, 500K Edge Function invocations/bulan
- **Vercel Free Tier**: 100GB bandwidth/bulan, unlimited deploys
- **Netlify Free Tier**: 100GB bandwidth/bulan, 300 build minutes/bulan
- **AI API**: Tergantung provider (Gemini ada free tier 15 RPM)

### Keamanan
- JANGAN commit `.env` ke GitHub
- JANGAN expose `service_role` key di frontend
- Update CORS ke domain spesifik untuk production
- Gunakan Supabase RLS policies (sudah ter-setup dari migrations)

### Maintenance
- Monitor Edge Function logs secara berkala
- Update dependencies: `npm update`
- Backup database secara berkala via Supabase Dashboard

---

*Panduan ini dibuat untuk RestoAI - Restaurant AI Ordering System*
*Terakhir diupdate: Maret 2026*
