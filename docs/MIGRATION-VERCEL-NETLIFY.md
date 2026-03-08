# 🚀 Panduan Migrasi Deploy ke Vercel / Netlify

## Gambaran Umum

Aplikasi RestoAI ini terdiri dari **2 bagian**:
1. **Frontend** (React/Vite) → Ini yang akan dipindah ke Vercel/Netlify
2. **Backend** (Lovable Cloud/Supabase: Database, Auth, Edge Functions, Storage) → **Tetap di Lovable Cloud**, tidak perlu dipindah

> ✅ Yang dipindah: **Hanya hosting frontend-nya saja**
> ✅ Backend tetap jalan di Lovable Cloud, tidak ada yang berubah

---

## Prasyarat

1. **Akun GitHub** — Pastikan project sudah terhubung ke GitHub
   - Di Lovable Editor → Klik nama project → Settings → GitHub → Connect
   - Setelah connect, semua kode otomatis ada di repository GitHub kamu

2. **Akun Vercel** atau **Netlify** (gratis)

3. **Environment Variables** yang dibutuhkan:
   ```
   VITE_SUPABASE_URL=https://dewkymjoublfacoaudft.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRld2t5bWpvdWJsZmFjb2F1ZGZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MjgxOTUsImV4cCI6MjA4NTIwNDE5NX0.PsTsY4iYucdTpuAob6AJzMVI_s-W-mO46Elf793w7h0
   VITE_SUPABASE_PROJECT_ID=dewkymjoublfacoaudft
   ```

---

## Opsi A: Deploy ke Vercel

### Langkah 1: Buat Akun & Import Project
1. Buka [vercel.com](https://vercel.com) → Sign Up (pakai akun GitHub)
2. Klik **"Add New..."** → **"Project"**
3. Pilih repository GitHub project RestoAI kamu
4. Klik **"Import"**

### Langkah 2: Konfigurasi Build
Di halaman konfigurasi project, isi:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Vite |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |
| **Node.js Version** | 18.x atau 20.x |

### Langkah 3: Tambahkan Environment Variables
1. Di halaman yang sama, scroll ke bagian **"Environment Variables"**
2. Tambahkan satu per satu:

   | Name | Value |
   |------|-------|
   | `VITE_SUPABASE_URL` | `https://dewkymjoublfacoaudft.supabase.co` |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | *(anon key di atas)* |
   | `VITE_SUPABASE_PROJECT_ID` | `dewkymjoublfacoaudft` |

3. Pastikan environment-nya dicentang untuk **Production**, **Preview**, dan **Development**

### Langkah 4: Deploy
1. Klik **"Deploy"**
2. Tunggu proses build selesai (biasanya 1-2 menit)
3. Setelah selesai, kamu dapat URL seperti `https://restoai-xxxx.vercel.app`

### Langkah 5: Konfigurasi SPA Routing
Buat file `vercel.json` di root project:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```
> Ini penting agar routing React (seperti `/menu?table=1`, `/admin`, `/kitchen`) bisa diakses langsung.

### Langkah 6: Custom Domain (Opsional)
1. Di Vercel Dashboard → Project → **Settings** → **Domains**
2. Klik **"Add"** → Masukkan domain kamu (misal `restoai.com`)
3. Ikuti instruksi DNS yang diberikan Vercel
4. Tunggu propagasi DNS (biasanya 5-30 menit)

---

## Opsi B: Deploy ke Netlify

### Langkah 1: Buat Akun & Import Project
1. Buka [netlify.com](https://www.netlify.com) → Sign Up (pakai akun GitHub)
2. Klik **"Add new site"** → **"Import an existing project"**
3. Pilih **GitHub** → Authorize → Pilih repository RestoAI

### Langkah 2: Konfigurasi Build
Di halaman konfigurasi:

| Setting | Value |
|---------|-------|
| **Branch to deploy** | `main` (atau branch default kamu) |
| **Build command** | `npm run build` |
| **Publish directory** | `dist` |

### Langkah 3: Tambahkan Environment Variables
1. Klik **"Show advanced"** → **"New variable"**
2. Tambahkan:

   | Key | Value |
   |-----|-------|
   | `VITE_SUPABASE_URL` | `https://dewkymjoublfacoaudft.supabase.co` |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | *(anon key di atas)* |
   | `VITE_SUPABASE_PROJECT_ID` | `dewkymjoublfacoaudft` |

### Langkah 4: Deploy
1. Klik **"Deploy site"**
2. Tunggu proses build selesai
3. Kamu dapat URL seperti `https://restoai-xxxx.netlify.app`

### Langkah 5: Konfigurasi SPA Routing
Buat file `public/_redirects` di project:
```
/*    /index.html   200
```
> Sama seperti Vercel, ini agar semua route React bisa diakses langsung.

### Langkah 6: Custom Domain (Opsional)
1. Di Netlify Dashboard → Site → **Domain management** → **Add custom domain**
2. Masukkan domain kamu
3. Ikuti instruksi DNS
4. Netlify juga otomatis menyediakan SSL gratis

---

## Hal Penting yang Perlu Diketahui

### ✅ Yang TIDAK Perlu Dipindah
- **Database** → Tetap di Lovable Cloud, diakses via API
- **Edge Functions** (AI Chat, TTS) → Tetap jalan di Lovable Cloud
- **Authentication** → Tetap pakai Lovable Cloud Auth
- **Storage** (gambar menu) → Tetap di Lovable Cloud Storage
- **API Keys & Secrets** → Tetap aman di Lovable Cloud, tidak perlu dipindah

### ⚠️ Yang Perlu Diperhatikan
1. **Environment variables bersifat publik (anon key)** — Ini memang aman karena hanya anon key yang di-expose ke frontend. Semua private key tetap aman di backend.

2. **Auto-deploy** — Setiap kali kamu push ke GitHub (termasuk dari Lovable), Vercel/Netlify akan otomatis rebuild dan deploy ulang.

3. **Dua URL aktif** — Setelah deploy ke Vercel/Netlify, URL Lovable (`dynamenu-ai.lovable.app`) tetap aktif. Kamu bisa matikan publish di Lovable jika tidak mau.

4. **CORS** — Backend sudah dikonfigurasi untuk menerima request dari mana saja, jadi tidak perlu setting CORS tambahan.

---

## Checklist Sebelum Go Live

- [ ] Project sudah terhubung ke GitHub
- [ ] Repository GitHub sudah berisi kode terbaru
- [ ] Environment variables sudah diisi di Vercel/Netlify
- [ ] File routing sudah dibuat (`vercel.json` atau `public/_redirects`)
- [ ] Build berhasil tanpa error
- [ ] Test: Buka halaman menu (`/menu?table=1`)
- [ ] Test: AI Chat berfungsi
- [ ] Test: Bisa buat pesanan
- [ ] Test: Kitchen Dashboard (`/kitchen`) bisa diakses
- [ ] Test: Login admin (`/admin`) berfungsi

---

## Troubleshooting

### Build Error: "Cannot find module..."
→ Jalankan `npm install` lokal dulu, pastikan semua dependency terinstall, lalu push ke GitHub.

### Halaman Blank / 404 di Route Selain Home
→ Pastikan file routing sudah dibuat (`vercel.json` atau `public/_redirects`).

### AI Chat / Fitur Tidak Berfungsi
→ Cek environment variables sudah benar di dashboard hosting. Pastikan semua 3 variable (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`) sudah diisi.

### Error CORS
→ Seharusnya tidak terjadi karena Edge Functions sudah mengizinkan semua origin. Jika terjadi, cek apakah URL Supabase benar.
