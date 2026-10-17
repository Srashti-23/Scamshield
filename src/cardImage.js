// Client-side PNG export using the Canvas API. No libraries, no network.
// The card never includes the original message.
const COLORS = { High: '#ff6b6b', Medium: '#fbbf24', Low: '#4ade80' };

export function canExportImage() {
  try { return !!document.createElement('canvas').getContext('2d') && typeof HTMLCanvasElement.prototype.toBlob === 'function'; } catch { return false; }
}

function wrap(ctx, text, x, y, maxW, lh) {
  let line = '';
  for (const word of text.split(' ')) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line, x, y); y += lh; line = word; } else line = test;
  }
  ctx.fillText(line, x, y);
  return y + lh;
}

export function exportCardImage(r) {
  return new Promise((resolve, reject) => {
    if (!canExportImage()) return reject(new Error('unsupported'));
    const c = document.createElement('canvas'); c.width = 1080; c.height = 620;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#070b16'; ctx.fillRect(0, 0, 1080, 620);
    ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 4; ctx.strokeRect(20, 20, 1040, 580);
    ctx.fillStyle = '#22d3ee'; ctx.font = 'bold 34px system-ui, sans-serif'; ctx.fillText('ScamShield Campus', 60, 80);
    ctx.fillStyle = COLORS[r.level] || '#fff'; ctx.font = 'bold 84px system-ui, sans-serif'; ctx.fillText(`${r.total}/100`, 60, 190);
    ctx.font = 'bold 40px system-ui, sans-serif'; ctx.fillText(`${r.level} Risk`, 400, 185);
    ctx.fillStyle = '#e6ecf8'; ctx.font = '28px system-ui, sans-serif';
    const cats = r.findings.length ? r.findings.map((f) => `${f.name} (+${f.points})`).join(', ') : 'No warning signs detected by current rules';
    let y = wrap(ctx, `Warning signs: ${cats}`, 60, 260, 960, 38);
    y = wrap(ctx, `Advice: ${r.steps[0]}`, 60, y + 16, 960, 38);
    ctx.fillStyle = '#9aa8c7'; ctx.font = '22px system-ui, sans-serif';
    wrap(ctx, 'Rule-based guidance, not a guarantee of safety. Original message not included.', 60, 560, 960, 30);
    c.toBlob((blob) => {
      if (!blob) return reject(new Error('failed'));
      const url = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = url; a.download = 'scamshield-card.png'; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000); resolve();
    }, 'image/png');
  });
}
