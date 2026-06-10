import type { RawBitmap } from "./types.js";


export async function parseBmp(
  bytes: Uint8Array,
  filename = "unknown.bmp"
): Promise<RawBitmap> {
  // Tentar primeiro o decoder manual (mais preciso e sem transformação de cor)
  try {
    return parseBmpManual(bytes);
  } catch (manualErr) {
    // Fallback para Canvas API se o BMP tiver formato não suportado pelo decoder manual
    console.warn(
      `[BmpParser] Decoder manual falhou para "${filename}", usando Canvas API como fallback:`,
      manualErr
    );
    return parseBmpViaCanvas(bytes, filename);
  }
}

function parseBmpManual(bytes: Uint8Array): RawBitmap {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  // Verificar magic "BM"
  if (bytes[0] !== 0x42 || bytes[1] !== 0x4d) {
    throw new Error("[BmpParser] Arquivo não é um BMP válido (magic inválido)");
  }

  const pixelDataOffset = view.getUint32(10, true);
  // const dibHeaderSize = view.getUint32(14, true);
  const width = view.getInt32(18, true);
  const rawHeight = view.getInt32(22, true);
  const bitsPerPixel = view.getUint16(28, true);
  const compression = view.getUint32(30, true);

  const isTopDown = rawHeight < 0;
  const height = Math.abs(rawHeight);

  if (bitsPerPixel !== 24) {
    throw new Error(
      `[BmpParser] Somente BMP 24-bit é suportado pelo decoder manual (encontrado: ${bitsPerPixel}-bit). ` +
        `Usando fallback para Canvas API.`
    );
  }

  if (compression !== 0) {
    throw new Error(
      `[BmpParser] Somente BMP sem compressão (BI_RGB) é suportado pelo decoder manual ` +
        `(compressão: ${compression}). Usando fallback para Canvas API.`
    );
  }

  // Bytes por linha do BMP (com padding de 4 bytes)
  const rowSize = Math.floor((bitsPerPixel * width + 31) / 32) * 4;

  const output = new Uint8Array(width * height * 3);

  for (let row = 0; row < height; row++) {
    // Em BMP bottom-up, a primeira linha do arquivo é a linha inferior da imagem
    const srcRow = isTopDown ? row : height - 1 - row;
    const srcOffset = pixelDataOffset + srcRow * rowSize;
    const dstOffset = row * width * 3;

    for (let col = 0; col < width; col++) {
      // BMP 24-bit armazena em BGR
      const bmpBase = srcOffset + col * 3;
      const b = bytes[bmpBase];
      const g = bytes[bmpBase + 1];
      const r = bytes[bmpBase + 2];

      const dstBase = dstOffset + col * 3;
      output[dstBase] = r;
      output[dstBase + 1] = g;
      output[dstBase + 2] = b;
    }
  }

  return { width, height, data: output };
}

async function parseBmpViaCanvas(
  bytes: Uint8Array,
  filename: string
): Promise<RawBitmap> {
  // FIX: Isso
  const blob = new Blob([bytes], { type: "image/bmp" });

  let bitmap: ImageBitmap;
  try {
    // colorSpaceConversion: "none" previne transformações de cor
    bitmap = await createImageBitmap(blob, { colorSpaceConversion: "none" });
  } catch {
    throw new Error(
      `[BmpParser] Falha ao decodificar "${filename}" via Canvas API. ` +
        `Verifique se o arquivo é um BMP válido.`
    );
  }

  const { width, height } = bitmap;

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("[BmpParser] Falha ao criar contexto 2D do OffscreenCanvas");

  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  // getImageData retorna RGBA (4 bytes/pixel)
  const imageData = ctx.getImageData(0, 0, width, height);
  const rgba = imageData.data;

  // Converter RGBA → RGB (descartar alpha)
  const rgb = new Uint8Array(width * height * 3);
  for (let i = 0, j = 0; i < rgba.length; i += 4, j += 3) {
    rgb[j] = rgba[i];       // R
    rgb[j + 1] = rgba[i + 1]; // G
    rgb[j + 2] = rgba[i + 2]; // B
    // rgba[i + 3] = alpha, ignorado
  }

  return { width, height, data: rgb };
}

export function getPixelRgb(
  bitmap: RawBitmap,
  x: number,
  y: number
): [number, number, number] {
  const idx = (y * bitmap.width + x) * 3;
  return [bitmap.data[idx], bitmap.data[idx + 1], bitmap.data[idx + 2]];
}

export function rgbKey(r: number, g: number, b: number): string {
  return `${r},${g},${b}`;
}
