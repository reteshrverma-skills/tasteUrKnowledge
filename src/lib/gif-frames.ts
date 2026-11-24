/**
 * A small GIF decoder: turns a GIF into its frames, each one fully composited
 * (as the browser would show it at that moment). Used to step through an
 * answer walk-through one frame at a time instead of letting it animate.
 *
 * Handles global/local palettes, transparency, interlacing and the disposal
 * methods; ignores timing, since the caller decides when to move on.
 */

export interface GifFrames {
  width: number;
  height: number;
  frames: ImageData[];
}

export function decodeGif(buffer: ArrayBuffer): GifFrames {
  const b = new Uint8Array(buffer);
  const sig = String.fromCharCode(...b.subarray(0, 6));
  if (sig !== "GIF87a" && sig !== "GIF89a") throw new Error("Not a GIF");

  const u16 = (i: number) => b[i] | (b[i + 1] << 8);
  const width = u16(6);
  const height = u16(8);
  const packed = b[10];
  let pos = 13;

  let globalPalette: Uint8Array | null = null;
  if (packed & 0x80) {
    const size = 3 * (1 << ((packed & 7) + 1));
    globalPalette = b.subarray(pos, pos + size);
    pos += size;
  }

  const canvas = new Uint8ClampedArray(width * height * 4);
  const frames: ImageData[] = [];
  let transparent = -1;
  let disposal = 0;

  // Joins the data sub-blocks that follow pos; returns them and the next pos.
  const readBlocks = (start: number): [Uint8Array, number] => {
    let p = start;
    let len = 0;
    while (b[p] !== 0) {
      len += b[p];
      p += b[p] + 1;
    }
    const out = new Uint8Array(len);
    let o = 0;
    p = start;
    while (b[p] !== 0) {
      out.set(b.subarray(p + 1, p + 1 + b[p]), o);
      o += b[p];
      p += b[p] + 1;
    }
    return [out, p + 1];
  };

  while (pos < b.length) {
    const block = b[pos];
    if (block === 0x3b) break; // trailer

    if (block === 0x21) {
      const label = b[pos + 1];
      if (label === 0xf9) {
        // Graphic control: disposal and transparency for the next image.
        const flags = b[pos + 3];
        disposal = (flags >> 2) & 7;
        transparent = flags & 1 ? b[pos + 6] : -1;
      }
      pos = readBlocks(pos + 2)[1];
      continue;
    }

    if (block !== 0x2c) throw new Error("Corrupt GIF");

    const fx = u16(pos + 1);
    const fy = u16(pos + 3);
    const fw = u16(pos + 5);
    const fh = u16(pos + 7);
    const fpacked = b[pos + 9];
    pos += 10;

    let palette = globalPalette;
    if (fpacked & 0x80) {
      const size = 3 * (1 << ((fpacked & 7) + 1));
      palette = b.subarray(pos, pos + size);
      pos += size;
    }
    const interlaced = Boolean(fpacked & 0x40);
    const minCodeSize = b[pos++];
    const [data, next] = readBlocks(pos);
    pos = next;
    if (!palette) throw new Error("GIF has no palette");

    const indices = lzw(minCodeSize, data, fw * fh);
    const saved = disposal === 3 ? canvas.slice() : null;

    // Interlaced rows arrive in four passes; map each to its real row.
    const rowOf = interlaced ? interlaceRows(fh) : null;
    for (let r = 0; r < fh; r++) {
      const y = fy + (rowOf ? rowOf[r] : r);
      if (y >= height) continue;
      for (let c = 0; c < fw; c++) {
        const x = fx + c;
        if (x >= width) continue;
        const idx = indices[r * fw + c];
        if (idx === transparent) continue;
        const o = (y * width + x) * 4;
        canvas[o] = palette[idx * 3];
        canvas[o + 1] = palette[idx * 3 + 1];
        canvas[o + 2] = palette[idx * 3 + 2];
        canvas[o + 3] = 255;
      }
    }

    frames.push(new ImageData(canvas.slice(), width, height));

    if (disposal === 2) {
      for (let y = fy; y < Math.min(fy + fh, height); y++) {
        canvas.fill(0, (y * width + fx) * 4, (y * width + Math.min(fx + fw, width)) * 4);
      }
    } else if (saved) {
      canvas.set(saved);
    }
    transparent = -1;
    disposal = 0;
  }

  if (!frames.length) throw new Error("GIF has no frames");
  return { width, height, frames };
}

function interlaceRows(h: number): number[] {
  const rows: number[] = [];
  for (const [start, step] of [[0, 8], [4, 8], [2, 4], [1, 2]]) {
    for (let y = start; y < h; y += step) rows.push(y);
  }
  return rows;
}

/** GIF's variable-width LZW: data bytes in, palette indices out. */
function lzw(minCodeSize: number, data: Uint8Array, count: number): Uint8Array {
  const out = new Uint8Array(count);
  const clear = 1 << minCodeSize;
  const eoi = clear + 1;
  const prefix = new Int16Array(4096);
  const suffix = new Uint8Array(4096);
  const stack = new Uint8Array(4097);
  for (let c = 0; c < clear; c++) suffix[c] = c;

  let codeSize = minCodeSize + 1;
  let codeMask = (1 << codeSize) - 1;
  let avail = clear + 2;
  let old = -1;
  let first = 0;
  let datum = 0;
  let bits = 0;
  let top = 0;
  let pi = 0;
  let bi = 0;

  while (pi < count) {
    if (top === 0) {
      if (bits < codeSize) {
        if (bi >= data.length) break;
        datum |= data[bi++] << bits;
        bits += 8;
        continue;
      }
      let code = datum & codeMask;
      datum >>= codeSize;
      bits -= codeSize;

      if (code === clear) {
        codeSize = minCodeSize + 1;
        codeMask = (1 << codeSize) - 1;
        avail = clear + 2;
        old = -1;
        continue;
      }
      if (code === eoi) break;
      if (old === -1) {
        stack[top++] = suffix[code];
        old = code;
        first = code;
        continue;
      }

      const inCode = code;
      if (code >= avail) {
        stack[top++] = first;
        code = old;
      }
      while (code >= clear) {
        stack[top++] = suffix[code];
        code = prefix[code];
      }
      first = suffix[code];
      stack[top++] = first;

      if (avail < 4096) {
        prefix[avail] = old;
        suffix[avail] = first;
        avail++;
        if ((avail & codeMask) === 0 && avail < 4096) {
          codeSize++;
          codeMask += avail;
        }
      }
      old = inCode;
    }
    out[pi++] = stack[--top];
  }
  return out;
}
