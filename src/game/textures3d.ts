import * as THREE from 'three';

export function createDamaskWallpaperTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Charcoal-plum & desaturated forest green Victorian base
  ctx.fillStyle = '#141218';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle vertical stripes
  for (let x = 0; x < 512; x += 32) {
    ctx.fillStyle = x % 64 === 0 ? 'rgba(34, 42, 38, 0.28)' : 'rgba(24, 20, 28, 0.22)';
    ctx.fillRect(x, 0, 16, 512);
  }

  // Damask diamond motifs
  ctx.strokeStyle = 'rgba(72, 86, 76, 0.22)';
  ctx.lineWidth = 2;
  for (let y = 32; y < 512; y += 64) {
    for (let x = 32; x < 512; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, y - 20);
      ctx.quadraticCurveTo(x + 16, y, x, y + 20);
      ctx.quadraticCurveTo(x - 16, y, x, y - 20);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Aged water-stain vignette at bottom wainscoting
  const grad = ctx.createLinearGradient(0, 360, 0, 512);
  grad.addColorStop(0, 'rgba(10, 9, 12, 0)');
  grad.addColorStop(1, 'rgba(8, 7, 10, 0.72)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 360, 512, 152);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 2);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createOakPlankTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#2d211b';
  ctx.fillRect(0, 0, 512, 256);

  const plankCount = 4;
  const plankH = 256 / plankCount;
  for (let i = 0; i < plankCount; i++) {
    const y = i * plankH;
    ctx.fillStyle = i % 2 === 0 ? '#33251e' : '#291d17';
    ctx.fillRect(0, y + 2, 512, plankH - 4);

    // Wood grain streaks
    ctx.strokeStyle = 'rgba(18, 12, 9, 0.38)';
    ctx.lineWidth = 1.5;
    for (let g = 0; g < 8; g++) {
      ctx.beginPath();
      const gy = y + 8 + g * 7;
      ctx.moveTo(0, gy);
      ctx.bezierCurveTo(170, gy + (g % 2 === 0 ? 3 : -3), 340, gy - 2, 512, gy);
      ctx.stroke();
    }

    // Plank seam
    ctx.fillStyle = '#140e0b';
    ctx.fillRect(0, y, 512, 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createStoneBlockTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1d1b22';
  ctx.fillRect(0, 0, 512, 512);

  const rows = 8;
  const rowH = 512 / rows;
  for (let r = 0; r < rows; r++) {
    const y = r * rowH;
    const offset = (r % 2) * 64;
    for (let x = -64; x < 512; x += 128) {
      const shade = 28 + ((r * 7 + x) % 10);
      ctx.fillStyle = `rgb(${shade}, ${shade - 2}, ${shade + 4})`;
      ctx.fillRect(x + offset + 2, y + 2, 124, rowH - 4);

      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.strokeRect(x + offset + 3, y + 3, 122, rowH - 6);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createSignPlaqueTexture(
  text: string,
  accentHex = '#ebe6dc',
  bgHex = '#1e1714',
  maxAnisotropy = 4
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 192;
  const ctx = canvas.getContext('2d')!;

  // Aged timber / brass plaque board
  ctx.fillStyle = bgHex;
  ctx.fillRect(0, 0, 512, 192);

  ctx.strokeStyle = '#6e5539';
  ctx.lineWidth = 6;
  ctx.strokeRect(8, 8, 496, 176);

  ctx.strokeStyle = 'rgba(235, 230, 220, 0.18)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(16, 16, 480, 160);

  // Corner rivets
  const rivets = [
    [24, 24],
    [488, 24],
    [24, 168],
    [488, 168],
  ];
  ctx.fillStyle = '#8f724d';
  for (const [rx, ry] of rivets) {
    ctx.beginPath();
    ctx.arc(rx, ry, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Wrap text cleanly into up to 3 balanced lines
  ctx.fillStyle = accentHex;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const w of words) {
    const candidate = current ? `${current} ${w}` : w;
    if (candidate.length <= 28 || lines.length >= 2) {
      current = candidate;
    } else {
      lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);

  if (lines.length === 1) {
    ctx.font = '700 28px "Cinzel", Georgia, serif';
    ctx.fillText(lines[0], 256, 96, 464);
  } else if (lines.length === 2) {
    ctx.font = '700 24px "Cinzel", Georgia, serif';
    ctx.fillText(lines[0], 256, 74, 464);
    ctx.fillText(lines[1], 256, 118, 464);
  } else {
    ctx.font = '700 21px "Cinzel", Georgia, serif';
    ctx.fillText(lines[0], 256, 56, 464);
    ctx.fillText(lines[1], 256, 96, 464);
    ctx.fillText(lines[2], 256, 136, 464);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createRadialContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 60);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
  grad.addColorStop(0.6, 'rgba(0, 0, 0, 0.25)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
