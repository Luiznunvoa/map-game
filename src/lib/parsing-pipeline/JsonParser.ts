import type { ProvinceData } from '@/types/data'
import type { Adjacency, ProvinceDefinition } from '@/types/data'

export type ColorToProvince = Record<string, ProvinceDefinition>;
export type IdToProvince = Record<number, ProvinceDefinition>;

export interface ParsedDefinitionsAndAdjacencies {
  byColor: ColorToProvince;
  byId: IdToProvince;
  adjacencies: Adjacency[];
}

export function parseDefinitionsJson(content: string): ParsedDefinitionsAndAdjacencies {
  const byColor: ColorToProvince = {}
  const byId: IdToProvince = {}
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
      const def: ProvinceDefinition = { id: prov.id, color: [r, g, b], name: prov.id.toString() }
      
      const key = `${r},${g},${b}`
      if (byColor[key]) {
        console.warn(`[JsonParser] Cor duplicada "${key}" (ID ${prov.id} vs ${byColor[key].id})`)
      }
      
      byColor[key] = def
      byId[prov.id] = def
    }

    if (prov.adjacencies && prov.adjacencies.length > 0) {
      for (const adj of prov.adjacencies) {
        adjacencies.push({
          from: prov.id,
          to: adj.to,
          type: adj.type,
          through: adj.through || 0,
          data: adj.data || 0,
          comment: adj.comment || '',
        })
      }
    }
  }

  console.info(`[JsonParser] definitions.json: ${Object.keys(byId).length} províncias e ${adjacencies.length} adjacências carregadas`)

  return { byColor, byId, adjacencies }
}
