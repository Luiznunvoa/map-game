import {
  DataTexture,
  NearestFilter,
  RGBAFormat,
  UnsignedByteType,
} from "three";
import type { ProvinceId, ParsedMapData } from "../parser/index.js";
import { buildIdBuffer } from "../parser/index.js";
import type { IdBufferWithStats } from "../parser/index.js";

export type NormalizedColor = [number, number, number];

export type MapColorMode = "political" | "province" | "terrain" | "continent";

export type GlobeMapInput = Pick<
  ParsedMapData,
  | "provincesBitmap"
  | "provinces"
  | "provinceById"
  | "defaultMap"
  | "terrain"
  | "continents"
>;

export interface ProvinceTextures {
  idTexture: DataTexture;
  paletteTexture: DataTexture;
  maxProvinceId: number;
  mapWidth: number;
  mapHeight: number;
  idBuffer: Uint16Array;
  stats: IdBufferWithStats["stats"];
  updatePalette(mode: MapColorMode, customColors?: Map<ProvinceId, NormalizedColor>): void;
  dispose(): void;
}


export function buildProvinceTextures(
  data: GlobeMapInput,
  initialMode: MapColorMode = "province"
): ProvinceTextures {
  const { provincesBitmap, provinces, provinceById, defaultMap, terrain, continents } = data;
  const { width, height } = provincesBitmap;

  console.time("[ProvinceTextures] buildIdBuffer");
  const idResult = buildIdBuffer(provincesBitmap, provinces);
  console.timeEnd("[ProvinceTextures] buildIdBuffer");

  const { idBuffer, maxProvinceId, stats } = idResult;
  const rgbaIds = new Uint8Array(width * height * 4);
  for (let i = 0; i < idBuffer.length; i++) {
    const id = idBuffer[i];
    rgbaIds[i * 4 + 0] = id & 0xFF;         // R = low byte
    rgbaIds[i * 4 + 1] = (id >> 8) & 0xFF;  // G = high byte
    rgbaIds[i * 4 + 2] = 0;
    rgbaIds[i * 4 + 3] = 255;
  }

  const idTexture = new DataTexture(rgbaIds, width, height, RGBAFormat, UnsignedByteType);
  idTexture.minFilter = NearestFilter;
  idTexture.magFilter = NearestFilter;
  idTexture.flipY = false; // flip feito no shader com (1 - vUv.y)
  idTexture.needsUpdate = true;
  const paletteSize = maxProvinceId + 1;
  const paletteFloat = new Float32Array(paletteSize * 3);

  // Cor do oceano / wasteland (ID 0)
  paletteFloat[0] = 0.08;
  paletteFloat[1] = 0.18;
  paletteFloat[2] = 0.40;

  // Preencher no modo inicial
  fillPalette(paletteFloat, paletteSize, initialMode, provinceById, defaultMap.seaStarts, terrain, continents);

  // Buffer Uint8 RGBA para GPU (stride 4)
  const paletteBytes = floatRgbToRgbaBytes(paletteFloat, paletteSize);

  const paletteTexture = new DataTexture(paletteBytes, paletteSize, 1, RGBAFormat, UnsignedByteType);
  paletteTexture.minFilter = NearestFilter;
  paletteTexture.magFilter = NearestFilter;
  paletteTexture.needsUpdate = true;

  function updatePalette(
    mode: MapColorMode,
    customColors?: Map<ProvinceId, NormalizedColor>
  ): void {
    // Resetar float buffer
    paletteFloat.fill(0);
    paletteFloat[0] = 0.08;
    paletteFloat[1] = 0.18;
    paletteFloat[2] = 0.40;

    fillPalette(paletteFloat, paletteSize, mode, provinceById, defaultMap.seaStarts, terrain, continents, customColors);

    // Converter e copiar para o Uint8Array que a textura usa
    const newBytes = floatRgbToRgbaBytes(paletteFloat, paletteSize);
    paletteBytes.set(newBytes);
    paletteTexture.needsUpdate = true;
  }

  return {
    idTexture,
    paletteTexture,
    maxProvinceId,
    mapWidth: width,
    mapHeight: height,
    idBuffer,
    stats,
    updatePalette,
    dispose() {
      idTexture.dispose();
      paletteTexture.dispose();
    },
  };
}

function fillPalette(
  paletteData: Float32Array,
  paletteSize: number,
  mode: MapColorMode,
  provinceById: GlobeMapInput["provinceById"],
  seaStarts: Set<ProvinceId>,
  terrain: GlobeMapInput["terrain"],
  continents: GlobeMapInput["continents"],
  customColors?: Map<ProvinceId, NormalizedColor>
): void {
  switch (mode) {
    case "province":
      fillByProvinceColor(paletteData, paletteSize, provinceById, seaStarts);
      break;
    case "political":
      fillPolitical(paletteData, paletteSize, provinceById, seaStarts, customColors);
      break;
    case "terrain":
      fillByTerrain(paletteData, paletteSize, provinceById, terrain, seaStarts);
      break;
    case "continent":
      fillByContinent(paletteData, paletteSize, continents, seaStarts, provinceById);
      break;
  }
}

function fillByProvinceColor(
  paletteData: Float32Array,
  paletteSize: number,
  provinceById: GlobeMapInput["provinceById"],
  seaStarts: Set<ProvinceId>
): void {
  const SEA_R = 0.08, SEA_G = 0.18, SEA_B = 0.40;

  for (const [id, def] of provinceById) {
    if (id >= paletteSize) continue;
    const base = id * 3;

    if (seaStarts.has(id)) {
      paletteData[base] = SEA_R;
      paletteData[base + 1] = SEA_G;
      paletteData[base + 2] = SEA_B;
    } else {
      paletteData[base] = def.r / 255;
      paletteData[base + 1] = def.g / 255;
      paletteData[base + 2] = def.b / 255;
    }
  }
}

function fillPolitical(
  paletteData: Float32Array,
  paletteSize: number,
  provinceById: GlobeMapInput["provinceById"],
  seaStarts: Set<ProvinceId>,
  customColors?: Map<ProvinceId, NormalizedColor>
): void {
  const SEA_R = 0.08, SEA_G = 0.18, SEA_B = 0.40;

  for (const [id, def] of provinceById) {
    if (id >= paletteSize) continue;
    const base = id * 3;

    if (seaStarts.has(id)) {
      paletteData[base] = SEA_R;
      paletteData[base + 1] = SEA_G;
      paletteData[base + 2] = SEA_B;
      continue;
    }

    if (customColors?.has(id)) {
      const [r, g, b] = customColors.get(id)!;
      paletteData[base] = r;
      paletteData[base + 1] = g;
      paletteData[base + 2] = b;
    } else {
      // Fallback: usar a cor original menos saturada
      paletteData[base] = mix(def.r / 255, 0.5, 0.35);
      paletteData[base + 1] = mix(def.g / 255, 0.5, 0.35);
      paletteData[base + 2] = mix(def.b / 255, 0.5, 0.35);
    }
  }
}

const TERRAIN_PALETTE: Record<string, NormalizedColor> = {
  ocean:      [0.08, 0.18, 0.40],
  arctic:     [0.92, 0.92, 0.95],
  farmlands:  [0.54, 0.41, 0.65],
  forest:     [0.36, 0.48, 0.18],
  hills:      [0.53, 0.27, 0.00],
  woods:      [0.65, 0.80, 0.42],
  mountain:   [0.46, 0.42, 0.47],
  plains:     [0.87, 0.83, 0.60],
  desert:     [0.95, 0.83, 0.53],
  jungle:     [0.17, 0.47, 0.17],
  marsh:      [0.42, 0.60, 0.50],
  steppe:     [0.76, 0.80, 0.45],
};

const TERRAIN_DEFAULT: NormalizedColor = [0.50, 0.50, 0.50];
const TERRAIN_SEA: NormalizedColor = [0.08, 0.18, 0.40];

function fillByTerrain(
  paletteData: Float32Array,
  paletteSize: number,
  provinceById: GlobeMapInput["provinceById"],
  terrain: GlobeMapInput["terrain"],
  seaStarts: Set<ProvinceId>
): void {
  for (const [id] of provinceById) {
    if (id >= paletteSize) continue;
    const base = id * 3;

    if (seaStarts.has(id)) {
      const [r, g, b] = TERRAIN_SEA;
      paletteData[base] = r;
      paletteData[base + 1] = g;
      paletteData[base + 2] = b;
      continue;
    }

    // Verificar override manual do terrain.txt
    const overrideName = terrain.overrides.get(id);
    const colorName = overrideName ?? "plains";
    const color = TERRAIN_PALETTE[colorName] ?? TERRAIN_DEFAULT;

    paletteData[base] = color[0];
    paletteData[base + 1] = color[1];
    paletteData[base + 2] = color[2];
  }
}

const CONTINENT_COLORS: NormalizedColor[] = [
  [0.78, 0.31, 0.31], // Europe        — vermelho suave
  [0.31, 0.60, 0.78], // Asia          — azul
  [0.78, 0.60, 0.31], // Africa        — âmbar
  [0.47, 0.78, 0.31], // North America — verde
  [0.60, 0.31, 0.78], // South America — roxo
  [0.31, 0.78, 0.60], // Oceania       — turquesa
  [0.78, 0.78, 0.31], // Antarctica    — amarelo
];

function fillByContinent(
  paletteData: Float32Array,
  paletteSize: number,
  continents: GlobeMapInput["continents"],
  seaStarts: Set<ProvinceId>,
  provinceById: GlobeMapInput["provinceById"]
): void {
  const SEA: NormalizedColor = [0.08, 0.18, 0.40];
  const UNCLAIMED: NormalizedColor = [0.35, 0.35, 0.35];

  // Mapear ID → cor do continente
  const idToColor = new Map<ProvinceId, NormalizedColor>();
  let colorIdx = 0;
  for (const [, ids] of continents) {
    const color = CONTINENT_COLORS[colorIdx % CONTINENT_COLORS.length];
    for (const id of ids) {
      idToColor.set(id, color);
    }
    colorIdx++;
  }

  for (const [id] of provinceById) {
    if (id >= paletteSize) continue;
    const base = id * 3;

    const color = seaStarts.has(id)
      ? SEA
      : (idToColor.get(id) ?? UNCLAIMED);

    paletteData[base] = color[0];
    paletteData[base + 1] = color[1];
    paletteData[base + 2] = color[2];
  }
}

function floatRgbToRgbaBytes(rgb: Float32Array, count: number): Uint8Array {
  const out = new Uint8Array(count * 4);
  for (let i = 0; i < count; i++) {
    out[i * 4 + 0] = Math.min(255, Math.round(rgb[i * 3 + 0] * 255));
    out[i * 4 + 1] = Math.min(255, Math.round(rgb[i * 3 + 1] * 255));
    out[i * 4 + 2] = Math.min(255, Math.round(rgb[i * 3 + 2] * 255));
    out[i * 4 + 3] = 255;
  }
  return out;
}

function mix(a: number, b: number, t: number): number {
  return a * (1 - t) + b * t;
}
