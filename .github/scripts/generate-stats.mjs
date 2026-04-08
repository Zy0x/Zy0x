// .github/scripts/generate-stats.mjs
import { writeFileSync, readFileSync } from 'fs';

const USERNAME = 'Zy0x';

// Theme modern yang vibrant & clean (bisa diganti: radical, dracula, tokyonight, gruvbox, etc.)
const THEME = 'radical';

async function main() {
  console.log('🚀 Generating modern animated GitHub stats...');

  const statsSection = `<!-- STATS:START -->
<div align="center">
  <h2>📊 GitHub Stats</h2>

  <!-- Main Stats Card (modern card dengan icons + metrics) -->
  <img 
    src="https://github-readme-stats.vercel.app/api?username=${USERNAME}&show_icons=true&theme=${THEME}&hide_title=true&include_all_commits=true&count_private=true&border_radius=20" 
    alt="GitHub Stats" 
    height="180" />

  <!-- Streak Card (dengan current streak + longest streak + fire animation feel) -->
  <img 
    src="https://github-readme-streak-stats.herokuapp.com/?user=${USERNAME}&theme=${THEME}&hide_border=true&border_radius=20&date_format=YYYY-MM-DD" 
    alt="GitHub Streak" 
    height="180" />

  <!-- Top Languages Card (100% dinamis sesuai tech stack repo kamu - berdasarkan ukuran kode) -->
  <img 
    src="https://github-readme-stats.vercel.app/api/top-langs/?username=${USERNAME}&layout=compact&theme=${THEME}&hide_title=true&card_width=320&border_radius=20&langs_count=8" 
    alt="Top Languages" 
    height="180" />

  <br><br>
  <p>
    <strong>Tech stack kamu dideteksi otomatis</strong> dari semua repository di GitHub.<br>
    <em>Semua card di atas update live setiap kali kamu push kode atau commit.</em>
  </p>
</div>

> _Modern & animated stats • Auto-generated via GitHub Actions • ${new Date().toISOString().split('T')[0]}_
<!-- STATS:END -->`;

  // Baca README dan replace section
  let readme = readFileSync('README.md', 'utf-8');

  if (readme.includes('<!-- STATS:START -->')) {
    readme = readme.replace(
      /<!-- STATS:START -->[\s\S]*?<!-- STATS:END -->/,
      statsSection
    );
  } else {
    readme += '\n\n' + statsSection;
  }

  writeFileSync('README.md', readme, 'utf-8');
  console.log(`✅ Modern animated stats berhasil di-update! (Theme: ${THEME})`);
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
