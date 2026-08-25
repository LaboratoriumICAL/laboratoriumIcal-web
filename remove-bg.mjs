import { removeBackground } from '@imgly/background-removal-node';
import fs from 'fs';
import path from 'path';

const avatarsDir = path.join(process.cwd(), 'public', 'avatars');

async function processImages() {
  const files = fs.readdirSync(avatarsDir).filter(f => f.endsWith('.jpg') || f.endsWith('.jpeg'));

  console.log(`Ditemukan ${files.length} foto untuk dihapus backgroundnya...`);

  for (const file of files) {
    const inputPath = path.join(avatarsDir, file);
    const outputPath = path.join(avatarsDir, file.replace(/\.jpe?g$/, '.png'));

    // Lewati jika sudah ada
    if (fs.existsSync(outputPath)) {
      console.log(`Melewati ${file} - versi PNG sudah ada.`);
      continue;
    }

    console.log(`Memproses ${file}... ini mungkin memakan waktu beberapa detik.`);
    try {
      const blob = await removeBackground(inputPath);
      const buffer = Buffer.from(await blob.arrayBuffer());
      fs.writeFileSync(outputPath, buffer);
      console.log(`✅ Selesai memproses ${file} -> disimpan sebagai .png`);
    } catch (err) {
      console.error(`❌ Gagal memproses ${file}:`, err);
    }
  }
  console.log('✨ Semua foto berhasil diproses!');
}

processImages();
