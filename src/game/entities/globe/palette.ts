import type { NormalizedColor, ProvinceId } from '@/types/data'
import type { GlobeMapInput, MapColorMode } from '@/types/globe'

const TERRAIN_DEFAULT: NormalizedColor = [0.5, 0.5, 0.5]
const TERRAIN_SEA: NormalizedColor = [0.08, 0.18, 0.4]

const TERRAIN_PALETTE: Record<string, NormalizedColor> = {
  ocean: [0.08, 0.18, 0.4],
  arctic: [0.92, 0.92, 0.95],
  farmlands: [0.54, 0.41, 0.65],

  forest: [0.33, 0.62, 0.24],
  woods: [0.55, 0.82, 0.42],

  hills: [0.53, 0.27, 0.0],
  mountain: [0.46, 0.42, 0.47],
  plains: [0.87, 0.83, 0.6],
  desert: [0.95, 0.83, 0.53],
  jungle: [0.17, 0.47, 0.17],
  marsh: [0.42, 0.6, 0.5],
  steppe: [0.76, 0.8, 0.45],
}

const CONTINENT_COLORS: NormalizedColor[] = [
  [0.78, 0.31, 0.31],
  [0.31, 0.6, 0.78],
  [0.78, 0.6, 0.31],
  [0.33, 0.62, 0.24],
  [0.6, 0.31, 0.78],
  [0.31, 0.78, 0.6],
  [0.78, 0.78, 0.31],
]


export function fillPalette(
  paletteData: Float32Array,
  paletteSize: number,
  mode: MapColorMode,
  provinceById: GlobeMapInput['provinceById'],
  seaStarts: Set<ProvinceId>,
  terrain: GlobeMapInput['terrain'],
  continents: GlobeMapInput['continents'],
  regions: GlobeMapInput['regions'],
  customColors?: Record<ProvinceId, NormalizedColor>,
): void {
  switch (mode) {
    case 'province':
      fillByProvinceColor(paletteData, paletteSize, provinceById, seaStarts)
      break
    case 'political':
    case 'population':
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
  const SEA_R = 0.08,
    SEA_G = 0.18,
    SEA_B = 0.4

  for (const [idStr, def] of Object.entries(provinceById)) {
    const id = Number(idStr)
    if (id >= paletteSize) continue
    const base = id * 3

    if (seaStarts.has(id)) {
      paletteData[base] = SEA_R
      paletteData[base + 1] = SEA_G
      paletteData[base + 2] = SEA_B
    } else {
      paletteData[base] = def.color[0] / 255
      paletteData[base + 1] = def.color[1] / 255
      paletteData[base + 2] = def.color[2] / 255
    }
  }
}

function fillPolitical(
  paletteData: Float32Array,
  paletteSize: number,
  provinceById: GlobeMapInput['provinceById'],
  seaStarts: Set<ProvinceId>,
  customColors?: Record<ProvinceId, NormalizedColor>,
): void {
  const SEA_R = 0.08,
    SEA_G = 0.18,
    SEA_B = 0.4

  for (const [idStr] of Object.entries(provinceById)) {
    const id = Number(idStr)
    if (id >= paletteSize) continue
    const base = id * 3

    if (seaStarts.has(id)) {
      paletteData[base] = SEA_R
      paletteData[base + 1] = SEA_G
      paletteData[base + 2] = SEA_B
      continue
    }

    if (customColors && customColors[id] !== undefined) {
      const [r, g, b] = customColors[id]!
      paletteData[base] = r
      paletteData[base + 1] = g
      paletteData[base + 2] = b
    } else {
      // Sem dono: branco
      paletteData[base] = 1.0
      paletteData[base + 1] = 1.0
      paletteData[base + 2] = 1.0
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
  for (const [idStr] of Object.entries(provinceById)) {
    const id = Number(idStr)
    if (id >= paletteSize) continue
    const base = id * 3

    if (seaStarts.has(id)) {
      const [r, g, b] = TERRAIN_SEA
      paletteData[base] = r
      paletteData[base + 1] = g
      paletteData[base + 2] = b
      continue
    }

    const overrideName = terrain.overrides[id]
    const colorName = overrideName ?? 'plains'

    const cat = terrain.categories[colorName]
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
  const SEA: NormalizedColor = [0.08, 0.18, 0.4]
  const UNCLAIMED: NormalizedColor = [0.35, 0.35, 0.35]

  const idToColor = new Map<ProvinceId, NormalizedColor>()
  let colorIdx = 0
  for (const [, ids] of Object.entries(continents)) {
    const color = CONTINENT_COLORS[colorIdx % CONTINENT_COLORS.length]
    for (const id of ids) {
      idToColor.set(id, color)
    }
    colorIdx++
  }

  for (const [idStr] of Object.entries(provinceById)) {
    const id = Number(idStr)
    if (id >= paletteSize) continue
    const base = id * 3

    const color = seaStarts.has(id) ? SEA : (idToColor.get(id) ?? UNCLAIMED)

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
  const SEA: NormalizedColor = [0.08, 0.18, 0.4]
  const UNCLAIMED: NormalizedColor = [0.35, 0.35, 0.35]

  const idToColor = new Map<ProvinceId, NormalizedColor>()
  let colorIdx = 0
  for (const [, ids] of Object.entries(regions)) {
    const color = CONTINENT_COLORS[colorIdx % CONTINENT_COLORS.length]
    for (const id of ids) {
      idToColor.set(id, color)
    }
    colorIdx++
  }

  for (const [idStr] of Object.entries(provinceById)) {
    const id = Number(idStr)
    if (id >= paletteSize) continue
    const base = id * 3

    const color = seaStarts.has(id) ? SEA : (idToColor.get(id) ?? UNCLAIMED)

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
    out[i * 4 + 3] = i === 0 || seaStarts.has(i) ? 0 : 255
  }
  return out
}
