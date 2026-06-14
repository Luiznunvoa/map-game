import type { Adjacency, AdjacencyType, ProvinceDefinition } from '@/types/data'

export type ColorToProvince = Record<string, ProvinceDefinition>;
export type IdToProvince = Record<number, ProvinceDefinition>;

export interface ParsedDefinitions {
  byColor: ColorToProvince;
  byId: IdToProvince;
}

export function parseDefinitionCsv(content: string): ParsedDefinitions {
  const lines = content.split(/\r?\n/)
  const byColor: ColorToProvince = {}
  const byId: IdToProvince = {}

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line || line.startsWith('#')) continue

    const parts = line.split(';')
    if (parts.length < 5) continue

    const id = parseInt(parts[0], 10)
    const r = parseInt(parts[1], 10)
    const g = parseInt(parts[2], 10)
    const b = parseInt(parts[3], 10)
    const name = parts[4].trim()

    if (isNaN(id) || isNaN(r) || isNaN(g) || isNaN(b)) {
      continue
    }

    const def: ProvinceDefinition = { id, color: [r, g, b], name }
    const key = `${r},${g},${b}`

    if (byColor[key]) {
      console.warn(
        `[CsvParser] Linha ${i + 1}: cor duplicada "${key}" (ID ${id} vs ${byColor[key].id})`,
      )
    }

    byColor[key] = def
    byId[id] = def
  }

  console.info(
    `[CsvParser] definition.csv: ${Object.keys(byId).length} províncias carregadas`,
  )

  return { byColor, byId }
}

export function parseAdjacenciesCsv(content: string): Adjacency[] {
  const lines = content.split(/\r?\n/)
  const result: Adjacency[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line || line.startsWith('#')) continue

    const parts = line.split(';')
    if (parts.length < 3) continue

    const from = parseInt(parts[0], 10)
    const to = parseInt(parts[1], 10)
    const type = parts[2].trim() as AdjacencyType

    if (isNaN(from) || isNaN(to) || from === -1 || to === -1) continue

    const adj: Adjacency = { from, to, type }

    if (parts[3] && parts[3].trim() !== '-1' && parts[3].trim() !== '') {
      adj.through = parseInt(parts[3], 10)
    }
    if (parts[4]) {
      const dataStr = parts[4].trim()
      const dataX = parseInt(parts[5], 10)
      const dataY = parseInt(parts[6], 10)

      if (dataStr && !isNaN(dataX) && !isNaN(dataY)) {
        adj.data = dataX 
      }
    }
    if (parts[7]) {
      adj.comment = parts[7].trim()
    }

    result.push(adj)
  }

  console.info(`[CsvParser] adjacencies.csv: ${result.length} lidas`)
  return result
}
