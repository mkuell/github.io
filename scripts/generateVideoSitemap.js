const fs = require('fs');

function escapeXml(str) {
  return str.replace(/[<>&'"]/g, ch => {
    switch (ch) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '"': return '&quot;';
      case "'": return '&apos;';
      default: return ch;
    }
  });
}

const videos = JSON.parse(fs.readFileSync('videos.json', 'utf8'));

let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
xml += `        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n`;

videos.forEach(video => {
  xml += `  <url>\n`;
  xml += `    <loc>${escapeXml(video.pageUrl)}</loc>\n`;
  xml += `    <video:video>\n`;
  xml += `      <video:player_loc>${escapeXml(video.playerUrl)}</video:player_loc>\n`;
  xml += `      <video:thumbnail_loc>${escapeXml(video.thumbnailUrl)}</video:thumbnail_loc>\n`;
  xml += `      <video:title>${escapeXml(video.title)}</video:title>\n`;
  if (video.description) {
    xml += `      <video:description>${escapeXml(video.description)}</video:description>\n`;
  }
  if (video.duration != null) {
    xml += `      <video:duration>${video.duration}</video:duration>\n`;
  }
  if (video.uploadDate) {
    xml += `      <video:publication_date>${escapeXml(video.uploadDate)}</video:publication_date>\n`;
  }
  xml += `    </video:video>\n`;
  xml += `  </url>\n`;
});

xml += `</urlset>\n`;

fs.writeFileSync('video-sitemap.xml', xml, 'utf8');
console.log(`Generated video-sitemap.xml with ${videos.length} entries.`);

