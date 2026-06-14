import { parseBmp } from './BmpParser.js'
import { buildIdBuffer } from './IdBuffer.js'
import type { FileLoader } from './io.js'
import { parseDefinitionsJson } from './JsonParser.js'
import {
  parseDefaultMap,
} from './MapFileParsers.js'
import type { ParsedMapData, RawBitmap } from '@/types/data'

export interface PipelineOptions {
  onProgress?: (progress: number, stage: string) => void;
}

// type StageResult<T> =
//   | { ok: true; data: T }
//   | { ok: false; error: string };


export interface PipelineResult extends Omit<ParsedMapData, 'provincesBitmapUrl' | 'terrainBitmapUrl'> {
  provincesBitmap: RawBitmap;
  terrainBitmap: RawBitmap;
}

export async function runParserPipeline(
  loader: FileLoader,
  options: PipelineOptions = {},
): Promise<PipelineResult> {
  const { onProgress } = options

  const report = (progress: number, stage: string) => {
    onProgress?.(progress, stage)
    console.info(`[Pipeline] ${Math.round(progress * 100)}% — ${stage}`)
  }

  report(0.05, 'Lendo definitions.json…')
  const definitionText = await loader.readText('definitions.json')
  const { byColor: provinces, byId: provinceById, adjacencies } = parseDefinitionsJson(definitionText)

  report(0.10, 'Lendo default.map…')
  const defaultMapText = await loader.readText('default.map')
  const defaultMap = parseDefaultMap(defaultMapText)

  report(0.15, 'Lendo provinces.bmp… (pode demorar)')
  const provincesBmpBytes = await loader.readBytes(defaultMap.files!.provinces)
  report(0.45, 'Decodificando provinces.bmp…')
  const provincesBitmap = await parseBmp(provincesBmpBytes, defaultMap.files!.provinces)
  report(0.60, `provinces.bmp decodificado: ${provincesBitmap.width}×${provincesBitmap.height}`)

  let terrainBitmap: RawBitmap = { width: 0, height: 0, data: new Uint8Array(0) }
  if (loader.has(defaultMap.files!.terrain)) {
    report(0.62, 'Lendo terrain.bmp…')
    const terrainBmpBytes = await loader.readBytes(defaultMap.files!.terrain)
    report(0.72, 'Decodificando terrain.bmp…')
    terrainBitmap = await parseBmp(terrainBmpBytes, defaultMap.files!.terrain)
  }

  report(0.80, 'Lendo terrain.json…')
  let terrain: ParsedMapData['terrain'] = {
    paletteSize: 64,
    categories: {},
    overrides: {},
    indexToTerrain: {},
  }
  if (loader.has(defaultMap.files!.terrainDefinition)) {
    const terrainText = await loader.readText(defaultMap.files!.terrainDefinition)
    const rawTerrain = JSON.parse(terrainText)
    
    terrain = {
      paletteSize: rawTerrain.paletteSize || 64,
      categories: rawTerrain.categories || {},
      overrides: rawTerrain.overrides || {},
      indexToTerrain: rawTerrain.indexToTerrain || {},
    }
  }

  if (terrainBitmap.width > 0 && terrain.indexToTerrain && Object.keys(terrain.indexToTerrain).length > 0) {
    report(0.82, 'Calculando terrenos das províncias por pixel…')
    const { idBuffer } = buildIdBuffer(provincesBitmap, provinces)
    const totalPixels = provincesBitmap.width * provincesBitmap.height

    const provinceTerrainCounts: Record<number, Record<string, number>> = {}

    for (let i = 0; i < totalPixels; i++) {
      const provinceId = idBuffer[i]
      if (provinceId === 0) continue

      const terrainIdx = terrainBitmap.data[i * 3]
      const terrainType = terrain.indexToTerrain[terrainIdx]
      if (!terrainType) continue

      if (!provinceTerrainCounts[provinceId]) provinceTerrainCounts[provinceId] = {}
      provinceTerrainCounts[provinceId][terrainType] = (provinceTerrainCounts[provinceId][terrainType] || 0) + 1
    }

    for (const [provinceIdStr, counts] of Object.entries(provinceTerrainCounts)) {
      const provinceId = Number(provinceIdStr)
      if (terrain.overrides[provinceId]) continue

      let maxType = ''
      let maxCount = 0
      for (const [type, count] of Object.entries(counts)) {
        if (count > maxCount) {
          maxCount = count
          maxType = type
        }
      }
      if (maxType) {
        terrain.overrides[provinceId] = maxType
      }
    }
  }

  report(0.85, 'Lendo regions.json…')
  const regions: ParsedMapData['regions'] = {}
  if (loader.has('regions.json')) {
    const regionText = await loader.readText('regions.json')
    Object.assign(regions, JSON.parse(regionText))
  }

  report(0.90, 'Lendo continents.json…')
  const continents: ParsedMapData['continents'] = {}
  if (loader.has('continents.json')) {
    const continentText = await loader.readText('continents.json')
    Object.assign(continents, JSON.parse(continentText))
  }

  report(1.0, 'Parsing concluído!')

  const result: PipelineResult = {
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

function logSummary(data: PipelineResult): void {
  const { provincesBitmap, provinceById, defaultMap, adjacencies, regions, continents } = data
  console.group('[Pipeline] Resumo do parsing:')
  console.log(`  Bitmap: ${provincesBitmap.width}×${provincesBitmap.height} px`)
  console.log(`  Províncias definidas: ${Object.keys(provinceById).length}`)
  console.log(`  Províncias marítimas (sea_starts): ${defaultMap.seaStarts.length}`)
  console.log(`  Adjacências especiais: ${adjacencies.length}`)
  console.log(`  Regiões: ${Object.keys(regions).length}`)
  console.log(`  Continentes: ${Object.keys(continents).length}`)
  console.groupEnd()
}
