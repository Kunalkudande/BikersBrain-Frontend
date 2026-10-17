import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import sharp from "sharp";

const asset = name => readFile(new URL(`../public/${name}`, import.meta.url));

test("search and touch icons match the dark header; organization logo keeps its white background", async () => {
  for (const [name, size] of [["favicon.png", 96], ["favicon-192.png", 192], ["favicon-512.png", 512], ["apple-touch-icon.png", 180], ["brand-logo.png", 512]]) {
    const buffer = await asset(name);
    const meta = await sharp(buffer).metadata();
    assert.equal(meta.width, size);
    assert.equal(meta.height, size);
    const { data } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    assert.deepEqual([...data.subarray(0, 4)], name === "brand-logo.png" ? [255, 255, 255, 255] : [18, 18, 18, 255]);
    for (let i = 3; i < data.length; i += 4) assert.equal(data[i], 255);
  }
});

test("favicon.ico is a valid multi-size ICO container", async () => {
  const ico = await asset("favicon.ico");
  assert.equal(ico.readUInt16LE(0), 0);
  assert.equal(ico.readUInt16LE(2), 1);
  assert.equal(ico.readUInt16LE(4), 3);
  for (let i = 0; i < 3; i++) {
    const entry = 6 + i * 16;
    const size = ico[entry];
    assert.equal(size, [16, 32, 48][i]);
    const offset = ico.readUInt32LE(entry + 12);
    const length = ico.readUInt32LE(entry + 8);
    const meta = await sharp(ico.subarray(offset, offset + length)).metadata();
    assert.equal(meta.format, "png");
    assert.equal(meta.width, size);
    assert.equal(meta.height, size);
  }
});

test("default sharing image has the declared landscape dimensions", async () => {
  const meta = await sharp(await asset("og-image.png")).metadata();
  assert.equal(meta.width, 1200);
  assert.equal(meta.height, 630);
});
