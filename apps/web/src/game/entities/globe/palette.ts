import type { ProvinceId } from '@/lib/parsing-pipeline/index.js'

import type { GlobeMapInput, MapColorMode, NormalizedColor } from './types.js'

const TERRAIN_DEFAULT: NormalizedColor = [0.50, 0.50, 0.50]
const TERRAIN_SEA: NormalizedColor = [0.08, 0.18, 0.40]

const TERRAIN_PALETTE: Record<string, NormalizedColor> = {
  ocean:      [0.08, 0.18, 0.40],
  arctic:     [0.92, 0.92, 0.95],
  farmlands:  [0.54, 0.41, 0.65],

  forest:     [0.33, 0.62, 0.24], // verde médio
  woods:      [0.55, 0.82, 0.42], // verde claro

  hills:      [0.53, 0.27, 0.00],
  mountain:   [0.46, 0.42, 0.47],
  plains:     [0.87, 0.83, 0.60],
  desert:     [0.95, 0.83, 0.53],
  jungle:     [0.17, 0.47, 0.17],
  marsh:      [0.42, 0.60, 0.50],
  steppe:     [0.76, 0.80, 0.45],
}

const CONTINENT_COLORS: NormalizedColor[] = [
  [0.78, 0.31, 0.31], // Europe
  [0.31, 0.60, 0.78], // Asia
  [0.78, 0.60, 0.31], // Africa
  [0.33, 0.62, 0.24], // North America
  [0.60, 0.31, 0.78], // South America
  [0.31, 0.78, 0.60], // Oceania
  [0.78, 0.78, 0.31], // Antarctica
]

function mix(a: number, b: number, t: number): number {
  return a * (1 - t) + b * t
}

export function fillPalette(
  paletteData: Float32Array,
  paletteSize: number,
  mode: MapColorMode,
  provinceById: GlobeMapInput['provinceById'],
  seaStarts: Set<ProvinceId>,
  terrain: GlobeMapInput['terrain'],
  continents: GlobeMapInput['continents'],
  regions: GlobeMapInput['regions'],
  customColors?: Map<ProvinceId, NormalizedColor>,
): void {
  switch (mode) {
    case 'province':
      fillByProvinceColor(paletteData, paletteSize, provinceById, seaStarts)
      break
    case 'political':
      fillPolitical(paletteData, paletteSize, provinceById, seaStarts, customColors)
      break
    case 'terrain':
      fillByTerrain(paletteData, paletteSize, provinceById, terrain, seaStarts)
      break
    case 'continent':
      fillByContinent(paletteData, paletteSize, continents, seaStarts, provinceById)
      break
    case 'region':
      fillByRegion(paletteData, paletteSize, regions, seaStarts, provinceById)
      break
  }
}

function fillByProvinceColor(
  paletteData: Float32Array,
  paletteSize: number,
  provinceById: GlobeMapInput['provinceById'],
  seaStarts: Set<ProvinceId>,
): void {
  const SEA_R = 0.08, SEA_G = 0.18, SEA_B = 0.40

  for (const [id, def] of provinceById) {
    if (id >= paletteSize) continue
    const base = id * 3

    if (seaStarts.has(id)) {
      paletteData[base] = SEA_R
      paletteData[base + 1] = SEA_G
      paletteData[base + 2] = SEA_B
    } else {
      paletteData[base] = def.r / 255
      paletteData[base + 1] = def.g / 255
      paletteData[base + 2] = def.b / 255
    }
  }
}

function fillPolitical(
  paletteData: Float32Array,
  paletteSize: number,
  provinceById: GlobeMapInput['provinceById'],
  seaStarts: Set<ProvinceId>,
  customColors?: Map<ProvinceId, NormalizedColor>,
): void {
  const SEA_R = 0.08, SEA_G = 0.18, SEA_B = 0.40

  for (const [id, def] of provinceById) {
    if (id >= paletteSize) continue
    const base = id * 3

    if (seaStarts.has(id)) {
      paletteData[base] = SEA_R
      paletteData[base + 1] = SEA_G
      paletteData[base + 2] = SEA_B
      continue
    }

    if (customColors?.has(id)) {
      const [r, g, b] = customColors.get(id)!
      paletteData[base] = r
      paletteData[base + 1] = g
      paletteData[base + 2] = b
    } else {
      paletteData[base] = mix(def.r / 255, 0.5, 0.35)
      paletteData[base + 1] = mix(def.g / 255, 0.5, 0.35)
      paletteData[base + 2] = mix(def.b / 255, 0.5, 0.35)
    }
  }
}

function fillByTerrain(
  paletteData: Float32Array,
  paletteSize: number,
  provinceById: GlobeMapInput['provinceById'],
  terrain: GlobeMapInput['terrain'],
  seaStarts: Set<ProvinceId>,
): void {
  for (const [id] of provinceById) {
    if (id >= paletteSize) continue
    const base = id * 3

    if (seaStarts.has(id)) {
      const [r, g, b] = TERRAIN_SEA
      paletteData[base] = r
      paletteData[base + 1] = g
      paletteData[base + 2] = b
      continue
    }

    const overrideName = terrain.overrides.get(id)
    const colorName = overrideName ?? 'plains'

    // Busca a cor dinâmica do terrain.txt, se existir
    const cat = terrain.categories.get(colorName)
    let color: NormalizedColor
    if (cat) {
      color = [cat.color[0] / 255, cat.color[1] / 255, cat.color[2] / 255]
    } else {
      color = TERRAIN_PALETTE[colorName] ?? TERRAIN_DEFAULT
    }

    paletteData[base] = color[0]
    paletteData[base + 1] = color[1]
    paletteData[base + 2] = color[2]
  }
}

function fillByContinent(
  paletteData: Float32Array,
  paletteSize: number,
  continents: GlobeMapInput['continents'],
  seaStarts: Set<ProvinceId>,
  provinceById: GlobeMapInput['provinceById'],
): void {
  const SEA: NormalizedColor = [0.08, 0.18, 0.40]
  const UNCLAIMED: NormalizedColor = [0.35, 0.35, 0.35]

  const idToColor = new Map<ProvinceId, NormalizedColor>()
  let colorIdx = 0
  for (const [, ids] of continents) {
    const color = CONTINENT_COLORS[colorIdx % CONTINENT_COLORS.length]
    for (const id of ids) {
      idToColor.set(id, color)
    }
    colorIdx++
  }

  for (const [id] of provinceById) {
    if (id >= paletteSize) continue
    const base = id * 3

    const color = seaStarts.has(id)
      ? SEA
      : (idToColor.get(id) ?? UNCLAIMED)

    paletteData[base] = color[0]
    paletteData[base + 1] = color[1]
    paletteData[base + 2] = color[2]
  }
}

function fillByRegion(
  paletteData: Float32Array,
  paletteSize: number,
  regions: GlobeMapInput['regions'],
  seaStarts: Set<ProvinceId>,
  provinceById: GlobeMapInput['provinceById'],
): void {
  const SEA: NormalizedColor = [0.08, 0.18, 0.40]
  const UNCLAIMED: NormalizedColor = [0.35, 0.35, 0.35]

  const idToColor = new Map<ProvinceId, NormalizedColor>()
  let colorIdx = 0
  for (const [, ids] of regions) {
    // Reutilizar as cores de continentes (ou podemos gerar dinamicamente)
    const color = CONTINENT_COLORS[colorIdx % CONTINENT_COLORS.length]
    for (const id of ids) {
      idToColor.set(id, color)
    }
    colorIdx++
  }

  for (const [id] of provinceById) {
    if (id >= paletteSize) continue
    const base = id * 3

    const color = seaStarts.has(id)
      ? SEA
      : (idToColor.get(id) ?? UNCLAIMED)

    paletteData[base] = color[0]
    paletteData[base + 1] = color[1]
    paletteData[base + 2] = color[2]
  }
}

export function floatRgbToRgbaBytes(
  rgb: Float32Array,
  count: number,
  seaStarts: Set<number>,
): Uint8Array {
  const out = new Uint8Array(count * 4)
  for (let i = 0; i < count; i++) {
    out[i * 4 + 0] = Math.min(255, Math.round(rgb[i * 3 + 0] * 255))
    out[i * 4 + 1] = Math.min(255, Math.round(rgb[i * 3 + 1] * 255))
    out[i * 4 + 2] = Math.min(255, Math.round(rgb[i * 3 + 2] * 255))
    // Se for ID 0 ou estiver em seaStarts, alpha = 0 (mar). Caso contrário, 255 (terra)
    out[i * 4 + 3] = (i === 0 || seaStarts.has(i)) ? 0 : 255
  }
  return out
}
