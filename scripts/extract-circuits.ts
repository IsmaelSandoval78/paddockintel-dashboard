// Run: npx ts-node --project scripts/tsconfig.json scripts/extract-circuits.ts
import * as fs from 'fs';
import * as path from 'path';

// Monaco circuit trazado — bezier approximation of the real layout
// Clockwise from the western end of the start/finish straight:
//   SF straight → Sainte Devote (right) → Beau Rivage climb
//   → Massenet/Casino (top) → Mirabeau (right) → Grand Hotel
//   → Loews hairpin (tight left U-turn) → Portier (right)
//   → Tunnel → post-tunnel chicane → Swimming Pool complex
//   → Rascasse → Anthony Noghes → back to SF
//
// Coordinate space: viewBox 0 0 400 300
//   Top ≈ Casino (y~40), Bottom ≈ harbor/SF (y~235-245)
//   Left ≈ western SF (x~42),  Right ≈ swimming pool (x~365)
const MONACO_PATH =
  'M 42,235' +
  ' L 185,245' +                               // SF straight (harbor front)
  ' C 200,247 204,232 200,215' +               // Sainte Devote (right, uphill)
  ' L 185,172' +                               // Beau Rivage climb
  ' L 154,98' +                                // upper section
  ' C 136,70 116,56 104,56' +                  // Massenet left
  ' C 93,56 98,43 118,41' +                    // Casino Square approach
  ' L 168,39' +                                // across Casino top
  ' C 205,37 234,58 250,83' +                  // Mirabeau right (descent begins)
  ' L 268,114' +                               // down to Grand Hotel
  ' C 284,140 286,162 275,172' +               // Loews hairpin outer arc
  ' C 264,182 248,180 244,192' +               // Loews hairpin inner (direction reversal)
  ' C 248,212 256,218 276,220' +               // Portier right, into tunnel
  ' L 322,222' +                               // tunnel
  ' L 350,216' +                               // tunnel exit
  ' C 362,213 364,226 360,238' +               // post-tunnel chicane (right)
  ' L 352,248' +                               // between chicanes
  ' C 358,260 352,272 342,278' +               // Swimming Pool complex
  ' L 325,283' +                               // Rascasse approach
  ' C 307,287 286,281 263,277' +               // Rascasse + Anthony Noghes (right → left)
  ' L 180,265' +                               // back straight
  ' C 128,257 80,247 42,241' +                 // curve to SF western end
  ' Z';

function buildSVG(d: string): string {
  return [
    '<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">',
    '  <rect width="400" height="300" fill="#F4F4F0"/>',
    `  <path d="${d}" stroke="#050505" stroke-width="3" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`,
    '</svg>',
  ].join('\n');
}

const svg = buildSVG(MONACO_PATH);
const outPath = path.join(__dirname, 'monaco.svg');
fs.writeFileSync(outPath, svg, 'utf-8');
console.log(`[ MONACO SVG ] saved → ${outPath}`);
