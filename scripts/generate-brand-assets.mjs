import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";

// Mechanical web-asset packaging: reuse the existing logo, without redrawing it.
const source = await readFile(new URL("../src/assets/bikersbrain_logo_only_brain.png", import.meta.url));
const mark = await sharp(source).trim().png().toBuffer();
const embedded = "data:image/png;base64," + mark.toString("base64");
async function icon(size, background = "#121212") {
  const margin = Math.round(size * 0.08);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="${background}"/><image x="${margin}" y="${margin}" width="${size - margin * 2}" height="${size - margin * 2}" preserveAspectRatio="xMidYMid meet" xlink:href="${embedded}"/></svg>`;
  return sharp(Buffer.from(svg)).flatten({ background }).png().toBuffer();
}
for (const [name, size] of [["favicon.png", 96], ["favicon-192.png", 192], ["favicon-512.png", 512], ["apple-touch-icon.png", 180], ["brand-logo.png", 512]]) {
  await writeFile(new URL("../public/" + name, import.meta.url), await icon(size, name === "brand-logo.png" ? "#ffffff" : "#121212"));
}
// A real ICO container with embedded PNG entries, instead of a PNG renamed to .ico.
const sizes = [16, 32, 48];
const images = await Promise.all(sizes.map(size => icon(size)));
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(1, 2); header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
sizes.forEach((size, i) => {
  const entry = 6 + 16 * i;
  header[entry] = size; header[entry + 1] = size;
  header.writeUInt16LE(1, entry + 4); header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(images[i].length, entry + 8); header.writeUInt32LE(offset, entry + 12);
  offset += images[i].length;
});
await writeFile(new URL("../public/favicon.ico", import.meta.url), Buffer.concat([header, ...images]));

const share = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="630" viewBox="0 0 1200 630">
<rect width="1200" height="630" fill="#ffffff"/>
<rect x="0" y="0" width="1200" height="12" fill="#f97316"/>
<image x="78" y="155" width="310" height="310" preserveAspectRatio="xMidYMid meet" xlink:href="${embedded}"/>
<g font-family="Arial, Helvetica, sans-serif">
<text x="440" y="270" font-size="65" font-weight="900" font-style="italic" letter-spacing="-2" fill="#171717">BIKERS<tspan fill="#f97316">BRAIN</tspan></text>
<text x="444" y="310" font-size="23" letter-spacing="3" fill="#555555">SPARE AND ACCESSORIES</text>
<text x="444" y="375" font-size="25" fill="#333333">Two-wheeler parts, oils, helmets</text>
<text x="444" y="414" font-size="25" fill="#333333">and everyday riding essentials.</text>
<text x="80" y="553" font-size="22" fill="#555555">bikersbrain.in</text>
<text x="1120" y="553" font-size="22" text-anchor="end" fill="#555555">Shree Om Automobiles · Pune</text>
</g></svg>`;
await writeFile(new URL("../public/og-image.png", import.meta.url), await sharp(Buffer.from(share)).png().toBuffer());
console.log("Generated dark-backed favicons matching the header, proper ICO, touch icon, brand logo and sharing card.");
