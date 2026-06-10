import type { RawBitmap, ColorToProvince, ProvinceId } from "./types.js";

export interface IdBufferResult {
  idBuffer: Uint16Array;
  maxProvinceId: number;
  orphanPixelCount: number;
  foundIds: Set<ProvinceId>;
}

export interface ProvinceStats {
  id: ProvinceId;
  pixelCount: number;
  sumX: number;
  sumY: number;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface IdBufferWithStats extends IdBufferResult {
  stats: Map<ProvinceId, ProvinceStats>;
}

export function buildIdBuffer(
  bitmap: RawBitmap,
  colorMap: ColorToProvince
): IdBufferWithStats {
  const { width, height, data } = bitmap;
  const totalPixels = width * height;

  const idBuffer = new Uint16Array(totalPixels);
  const stats = new Map<ProvinceId, ProvinceStats>();
  const foundIds = new Set<ProvinceId>();

  let orphanPixelCount = 0;
  let maxProvinceId = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixelBase = (y * width + x) * 3;
      const r = data[pixelBase];
      const g = data[pixelBase + 1];
      const b = data[pixelBase + 2];

      const key = `${r},${g},${b}`;
      const def = colorMap.get(key);

      if (!def) {
        orphanPixelCount++;
        // idBuffer já é 0 por padrão (Uint16Array inicializa com zeros)
        continue;
      }

      const id = def.id;
      idBuffer[y * width + x] = id;

      foundIds.add(id);
      if (id > maxProvinceId) maxProvinceId = id;

      // Acumular estatísticas
      let stat = stats.get(id);
      if (!stat) {
        stat = {
          id,
          pixelCount: 0,
          sumX: 0,
          sumY: 0,
          minX: x,
          minY: y,
          maxX: x,
          maxY: y,
        };
        stats.set(id, stat);
      }

      stat.pixelCount++;
      stat.sumX += x;
      stat.sumY += y;
      if (x < stat.minX) stat.minX = x;
      if (y < stat.minY) stat.minY = y;
      if (x > stat.maxX) stat.maxX = x;
      if (y > stat.maxY) stat.maxY = y;
    }
  }

  if (orphanPixelCount > 0) {
    console.warn(
      `[IdBuffer] ${orphanPixelCount} pixels órfãos (${(
        (orphanPixelCount / totalPixels) *
        100
      ).toFixed(2)}% do mapa) — cores sem correspondência no definition.csv`
    );
  }

  console.info(
    `[IdBuffer] ${foundIds.size} províncias encontradas no bitmap, maxId=${maxProvinceId}`
  );

  return { idBuffer, maxProvinceId, orphanPixelCount, foundIds, stats };
}

export function getCentroid(stat: ProvinceStats): { x: number; y: number } {
  return {
    x: Math.round(stat.sumX / stat.pixelCount),
    y: Math.round(stat.sumY / stat.pixelCount),
  };
}
