import { parseBmp } from './BmpParser.js'
import { parseDefinitionsJson } from './JsonParser.js'
import { buildIdBuffer } from './IdBuffer.js'
import type { FileLoader } from './io.js'
import {
  parseDefaultMap,
} from './MapFileParsers.js'
import type { ParsedMapData, RawBitmap } from './types.js'

export interface PipelineOptions {
  onProgress?: (progress: number, stage: string) => void;
}

// type StageResult<T> =
//   | { ok: true; data: T }
//   | { ok: false; error: string };


export async function runParserPipeline(
  loader: FileLoader,
  options: PipelineOptions = {},
): Promise<ParsedMapData> {
  const { onProgress } = options

  const report = (progress: number, stage: string) => {
    onProgress?.(progress, stage)
    console.info(`[Pipeline] ${Math.round(progress * 100)}% — ${stage}`)
  }

  // Etapa 1: definitions.json
  report(0.05, 'Lendo definitions.json…')
  const definitionText = await loader.readText('definitions.json')
  const { byColor: provinces, byId: provinceById, adjacencies } = parseDefinitionsJson(definitionText)

  // Etapa 2: default.map 
  report(0.10, 'Lendo default.map…')
  const defaultMapText = await loader.readText('default.map')
  const defaultMap = parseDefaultMap(defaultMapText)

  // Etapa 3: provinces.bmp
  report(0.15, 'Lendo provinces.bmp… (pode demorar)')
  const provincesBmpBytes = await loader.readBytes(defaultMap.files.provinces)
  report(0.45, 'Decodificando provinces.bmp…')
  const provincesBitmap = await parseBmp(provincesBmpBytes, defaultMap.files.provinces)
  report(0.60, `provinces.bmp decodificado: ${provincesBitmap.width}×${provincesBitmap.height}`)

  // Etapa 4: terrain.bmp
  let terrainBitmap: RawBitmap = { width: 0, height: 0, data: new Uint8Array(0) }
  if (loader.has(defaultMap.files.terrain)) {
    report(0.62, 'Lendo terrain.bmp…')
    const terrainBmpBytes = await loader.readBytes(defaultMap.files.terrain)
    report(0.72, 'Decodificando terrain.bmp…')
    terrainBitmap = await parseBmp(terrainBmpBytes, defaultMap.files.terrain)
  } else {
    console.warn('[Pipeline] terrain.bmp não encontrado — terreno não será calculado por pixel')
  }

  // adjacencies já extraídas na etapa 1

  // Etapa 6: terrain.json
  report(0.80, 'Lendo terrain.json…')
  let terrain: ParsedMapData['terrain'] = {
    paletteSize: 64,
    categories: new Map(),
    overrides: new Map(),
    indexToTerrain: new Map(),
  }
  if (loader.has(defaultMap.files.terrainDefinition)) {
    const terrainText = await loader.readText(defaultMap.files.terrainDefinition)
    const rawTerrain = JSON.parse(terrainText)
    
    const categoriesMap = new Map()
    for (const [k, v] of Object.entries(rawTerrain.categories)) categoriesMap.set(k, v)
    
    const overridesMap = new Map()
    if (rawTerrain.overrides) {
      for (const [k, v] of Object.entries(rawTerrain.overrides)) overridesMap.set(Number(k), v as string)
    }
    
    const indexToTerrainMap = new Map()
    if (rawTerrain.indexToTerrain) {
      for (const [k, v] of Object.entries(rawTerrain.indexToTerrain)) indexToTerrainMap.set(Number(k), v as string)
    }

    terrain = {
      paletteSize: rawTerrain.paletteSize || 64,
      categories: categoriesMap,
      overrides: overridesMap,
      indexToTerrain: indexToTerrainMap,
    }
  }

  // Calcular terreno predominante para cada província usando terrain.bmp e indexToTerrain
  if (terrainBitmap.width > 0 && terrain.indexToTerrain && terrain.indexToTerrain.size > 0) {
    report(0.82, 'Calculando terrenos das províncias por pixel…')
    const { idBuffer } = buildIdBuffer(provincesBitmap, provinces)
    const totalPixels = provincesBitmap.width * provincesBitmap.height

    // Mapa de ProvinceId -> Map of TerrainType -> count
    const provinceTerrainCounts = new Map<number, Map<string, number>>()

    for (let i = 0; i < totalPixels; i++) {
      const provinceId = idBuffer[i]
      if (provinceId === 0) continue // Pular ID 0 (oceano puro)

      const terrainIdx = terrainBitmap.data[i * 3] // index está nos canais R, G, B
      const terrainType = terrain.indexToTerrain.get(terrainIdx)
      if (!terrainType) continue

      let counts = provinceTerrainCounts.get(provinceId)
      if (!counts) {
        counts = new Map<string, number>()
        provinceTerrainCounts.set(provinceId, counts)
      }
      counts.set(terrainType, (counts.get(terrainType) || 0) + 1)
    }

    for (const [provinceId, counts] of provinceTerrainCounts.entries()) {
      if (terrain.overrides.has(provinceId)) continue // preservar override manual do terrain.txt

      let maxType = ''
      let maxCount = 0
      for (const [type, count] of counts.entries()) {
        if (count > maxCount) {
          maxCount = count
          maxType = type
        }
      }
      if (maxType) {
        terrain.overrides.set(provinceId, maxType)
      }
    }
    console.info(`[Pipeline] Terrenos pixel-based calculados para ${provinceTerrainCounts.size} províncias.`)
  }

  // Etapa 7: regions.json
  report(0.85, 'Lendo regions.json…')
  let regions: ParsedMapData['regions'] = new Map()
  if (loader.has('regions.json')) {
    const regionText = await loader.readText('regions.json')
    const rawRegions = JSON.parse(regionText)
    for (const [name, ids] of Object.entries(rawRegions)) {
      regions.set(name, ids as number[])
    }
  }

  // Etapa 8: continents.json
  report(0.90, 'Lendo continents.json…')
  let continents: ParsedMapData['continents'] = new Map()
  if (loader.has('continents.json')) {
    const continentText = await loader.readText('continents.json')
    const rawContinents = JSON.parse(continentText)
    for (const [name, ids] of Object.entries(rawContinents)) {
      continents.set(name, ids as number[])
    }
  }

  report(1.0, 'Parsing concluído!')

  const result: ParsedMapData = {
    defaultMap,
    provinces,
    provinceById,
    adjacencies,
    terrain,
    regions,
    continents,
    provincesBitmap,
    terrainBitmap,
  }

  logSummary(result)
  return result
}

function logSummary(data: ParsedMapData): void {
  const { provincesBitmap, provinceById, defaultMap, adjacencies, regions, continents } = data
  console.group('[Pipeline] Resumo do parsing:')
  console.log(`  Bitmap: ${provincesBitmap.width}×${provincesBitmap.height} px`)
  console.log(`  Províncias definidas: ${provinceById.size}`)
  console.log(`  Províncias marítimas (sea_starts): ${defaultMap.seaStarts.size}`)
  console.log(`  Adjacências especiais: ${adjacencies.length}`)
  console.log(`  Regiões: ${regions.size}`)
  console.log(`  Continentes: ${continents.size}`)
  console.groupEnd()
}
