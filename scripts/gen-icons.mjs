// サイトのアイコン一式(public/logo.png 512 / public/apple-touch-icon.png 180)を
// 決定的に生成する。デザインは public/favicon.svg と同一(青の角丸 + 白の成長バー3本)。
// 依存: canvaskit-wasm(astro-og-canvas の推移的依存。純WASMでネイティブ不要)。
// 実行: node scripts/gen-icons.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const CanvasKitInit = require('canvaskit-wasm');
const ckDir = path.dirname(require.resolve('canvaskit-wasm'));
const CanvasKit = await CanvasKitInit({ locateFile: (f) => path.join(ckDir, f) });

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function drawIcon(size) {
  const surface = CanvasKit.MakeSurface(size, size);
  const canvas = surface.getCanvas();
  canvas.clear(CanvasKit.TRANSPARENT);

  // 角丸の背景(アクセント #1f6feb → #1551b5 の斜めグラデーション)
  const bg = new CanvasKit.Paint();
  bg.setShader(
    CanvasKit.Shader.MakeLinearGradient(
      [0, 0],
      [size, size],
      [CanvasKit.Color(31, 111, 235, 1), CanvasKit.Color(21, 81, 181, 1)],
      null,
      CanvasKit.TileMode.Clamp
    )
  );
  const radius = size * 0.2;
  canvas.drawRRect(CanvasKit.RRectXY(CanvasKit.LTRBRect(0, 0, size, size), radius, radius), bg);

  // 白の成長バー3本(favicon.svg と同じ比率)
  const white = new CanvasKit.Paint();
  white.setColor(CanvasKit.Color(255, 255, 255, 1));
  const bars = [
    { x: 0.24, y: 0.52, w: 0.14, h: 0.24 },
    { x: 0.43, y: 0.4, w: 0.14, h: 0.36 },
    { x: 0.62, y: 0.26, w: 0.14, h: 0.5 },
  ];
  const r = size * 0.03;
  for (const b of bars) {
    canvas.drawRRect(
      CanvasKit.RRectXY(
        CanvasKit.LTRBRect(b.x * size, b.y * size, (b.x + b.w) * size, (b.y + b.h) * size),
        r,
        r
      ),
      white
    );
  }

  const img = surface.makeImageSnapshot();
  const png = img.encodeToBytes();
  img.delete();
  surface.delete();
  return Buffer.from(png);
}

fs.mkdirSync(path.join(root, 'public'), { recursive: true });
fs.writeFileSync(path.join(root, 'public', 'logo.png'), drawIcon(512));
fs.writeFileSync(path.join(root, 'public', 'apple-touch-icon.png'), drawIcon(180));
console.log('generated: public/logo.png (512), public/apple-touch-icon.png (180)');
