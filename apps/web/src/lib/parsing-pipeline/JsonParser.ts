import type { ProvinceData } from '@map-game/shared'
import type {
  Adjacency,
  ColorToProvince,
  IdToProvince,
  ProvinceDefinition,
} from './types.js'

export interface ParsedDefinitionsAndAdjacencies {
  byColor: ColorToProvince;
  byId: IdToProvince;
  adjacencies: Adjacency[];
}

export function parseDefinitionsJson(content: string): ParsedDefinitionsAndAdjacencies {
  const byColor: ColorToProvince = new Map()
  const byId: IdToProvince = new Map()
  const adjacencies: Adjacency[] = []

  let data: ProvinceData[] = []
  try {
    data = JSON.parse(content)
  } catch (e) {
    console.error('[JsonParser] Erro ao fazer parse de definitions.json', e)
    return { byColor, byId, adjacencies }
  }

  for (const prov of data) {
    if (prov.id <= 0) continue

    if (prov.color && prov.color.length >= 3) {
      const [r, g, b] = prov.color
      const def: ProvinceDefinition = { id: prov.id, r, g, b, name: prov.id.toString() }
      
      const key = `${r},${g},${b}`
      if (byColor.has(key)) {
        console.warn(`[JsonParser] Cor duplicada "${key}" (ID ${prov.id} vs ${byColor.get(key)!.id})`)
      }
      
      byColor.set(key, def)
      byId.set(prov.id, def)
    }

    if (prov.adjacencies && prov.adjacencies.length > 0) {
      for (const adj of prov.adjacencies) {
        adjacencies.push({
          from: prov.id,
          to: adj.to,
          type: adj.type,
          through: adj.through || 0,
          data: adj.data || 0,
          comment: adj.comment || ''
        })
      }
    }
  }

  console.info(`[JsonParser] definitions.json: ${byId.size} províncias e ${adjacencies.length} adjacências carregadas`)

  return { byColor, byId, adjacencies }
}
