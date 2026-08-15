# Panduan Setup — Website ICAL ITPLN

Panduan ini untuk menjalankan website dari nol di akun Supabase **baru** Anda, sampai siap di-deploy.

## 1. Buat Project Supabase Baru

1. Buka https://supabase.com/dashboard -> **New Project**
2. Pilih organisasi, beri nama (mis. "ICAL ITPLN"), pilih region terdekat (Singapore/ap-southeast disarankan untuk Indonesia), buat password database, klik **Create new project**
3. Tunggu sampai status project **Active** (1-2 menit)

## 2. Jalankan Schema Database

1. Di dashboard project baru Anda, buka menu **SQL Editor** (ikon di sidebar kiri) -> **New query**
2. Buka file `supabase/schema.sql` di project ini, salin **seluruh isinya**, tempel ke SQL Editor
3. Klik **Run**. Jika sukses, akan muncul "Success. No rows returned"
4. Cek di menu **Table Editor** — harusnya sudah muncul 18 tabel (jurusan, praktikum, profiles, kelompok, dst) beserta data awal (2 jurusan, 2 praktikum, jenis tugas, 1 kelas+kelompok+2 praktikan contoh per praktikum)

> Data contoh yang ikut ter-seed: praktikan "Ahmad Fauzi" (NIM 2022110001) dan "Bintang Ramadhan" (NIM 2022110002), terdaftar di praktikum DSK & PLC. Pakai NIM ini untuk uji coba login praktikan. Silakan hapus/ganti lewat fitur **Import Praktikan** di Dashboard Asisten untuk data sungguhan.

## 2.1 Migrasi Absensi & Scan QR (wajib, jalankan setelah schema.sql)

1. Masih di **SQL Editor** -> **New query**
2. Buka file `supabase/02_migration_absensi.sql`, salin seluruh isinya, tempel, klik **Run**
3. Ini membuat tabel `absensi` (rekam kehadiran real dari Scan QR / input manual asisten) beserta
   trigger yang otomatis menghitung persentase kehadiran dan menuliskannya ke kolom
   **Kehadiran** pada Kelola Nilai praktikum PLC — jadi tidak perlu diketik manual lagi.

## 3. Ambil Kredensial API

1. Di dashboard project, buka **Project Settings** (ikon gear) -> **API**
2. Salin:
   - **Project URL** -> `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key (klik "Reveal") -> `SUPABASE_SERVICE_ROLE_KEY` — **JANGAN pernah dibagikan/di-commit ke git**, ini kunci penuh ke database Anda

## 4. Setup Cloudflare R2 (penyimpanan file tugas)

1. Login ke https://dash.cloudflare.com -> **R2 Object Storage** -> **Create bucket**, beri nama mis. `ical-pengumpulan-tugas`
2. Buka **Manage R2 API Tokens** -> **Create API Token**, beri izin Read & Write ke bucket tsb
3. Salin **Account ID**, **Access Key ID**, **Secret Access Key** ke env var `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`
4. (Opsional, agar file bisa dibuka lewat link) Di bucket settings, aktifkan **Public Access** / buat custom domain, isi URL-nya ke `R2_PUBLIC_URL`

## 5. Setup Google Drive (arsip tugas)

1. Buka https://console.cloud.google.com -> buat project baru (atau pakai yang ada)
2. Aktifkan **Google Drive API** (menu APIs & Services > Library)
3. Buat **Service Account** (IAM & Admin > Service Accounts > Create), download file JSON kredensialnya
4. Dari file JSON, salin `client_email` -> `GOOGLE_SERVICE_ACCOUNT_EMAIL`, dan `private_key` -> `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
5. Di Google Drive, buat folder tujuan arsip tugas, klik **Share**, tambahkan email service account tsb sebagai **Editor**
6. Salin ID folder tsb (bagian akhir URL folder) ke `GOOGLE_DRIVE_FOLDER_ID`

## 6. Isi File Environment

```bash
cp .env.local.example .env.local
```
Lalu isi semua nilai yang sudah Anda kumpulkan di langkah 1-5 ke dalam `.env.local`.

## 7. Jalankan Secara Lokal

```bash
npm install
npm run dev
```
Buka http://localhost:3000

**Uji coba cepat:**
- Login praktikan dengan NIM `2022110001` (nama bebas, password bebas — masih mock login)
- Buka menu **QR Absensi** -> QR code asli akan muncul (bisa discan)
- Login sebagai asisten -> **Scan QR** -> izinkan akses kamera -> arahkan ke QR praktikan di HP lain -> tekan **TAP TO SCAN**
- **Kelola Nilai** -> pilih Jurusan & Praktikum -> isi nilai -> **Simpan Nilai**
- **Kelola Deadline Tugas** -> atur deadline & keterangan per pertemuan
- **Pengumpulan Tugas** (sisi praktikan) -> upload file (otomatis ke Cloudflare R2)
- Di **Kelola Deadline Tugas**, klik **Simpan ke Google Drive** pada file yang sudah diupload

## 8. Deploy

Termudah lewat **Vercel** (dibuat oleh tim Next.js):
1. Push project ini ke GitHub/GitLab
2. Buka https://vercel.com -> **New Project** -> import repo Anda
3. Di bagian **Environment Variables**, masukkan semua variabel yang sama seperti di `.env.local`
4. Deploy

> Catatan: kamera untuk Scan QR hanya berfungsi di halaman **HTTPS** (atau `localhost`). Vercel otomatis pakai HTTPS, jadi aman untuk production.

## Catatan Keamanan

- `SUPABASE_SERVICE_ROLE_KEY`, R2 secret, dan Google service account key adalah kredensial sensitif — hanya isi di Environment Variables server (Vercel dashboard), **jangan** commit ke git (`.env.local` sudah masuk `.gitignore`)
- Login saat ini masih **mock** (belum terhubung ke Supabase Auth sungguhan) — siapa saja bisa mengetik NIM siapa pun untuk "login" sebagai praktikan tsb. Untuk produksi sungguhan yang aman, tahap berikutnya adalah mengganti LoginPage dengan Supabase Auth (email+password atau magic link) sehingga NIM terverifikasi ke akun yang benar.
