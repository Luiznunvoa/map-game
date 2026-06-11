import type {
  Adjacency,
  AdjacencyType,
  ColorToProvince,
  IdToProvince,
  ProvinceDefinition,
} from './types.js'

export interface ParsedDefinitions {
  byColor: ColorToProvince;
  byId: IdToProvince;
}


export function parseDefinitionCsv(content: string): ParsedDefinitions {
  const byColor: ColorToProvince = new Map()
  const byId: IdToProvince = new Map()

  const lines = content.split(/\r?\n/)

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const raw = lines[lineNum].trim()

    // Ignorar linhas vazias e comentários
    if (!raw || raw.startsWith('#')) continue

    // Ignorar linha de cabeçalho (começa com "province")
    if (raw.toLowerCase().startsWith('province')) continue

    const parts = raw.split(';')
    if (parts.length < 5) {
      console.warn(`[CsvParser] Linha ${lineNum + 1}: campos insuficientes, pulando: "${raw}"`)
      continue
    }

    const id = parseInt(parts[0], 10)
    const r = parseInt(parts[1], 10)
    const g = parseInt(parts[2], 10)
    const b = parseInt(parts[3], 10)
    const name = parts[4].trim()

    if (isNaN(id) || isNaN(r) || isNaN(g) || isNaN(b)) {
      console.warn(
        `[CsvParser] Linha ${lineNum + 1}: campos numéricos inválidos, pulando: "${raw}"`,
      )
      continue
    }

    if (id <= 0) {
      // ID 0 é reservado para oceano/wasteland — não entra no mapa
      continue
    }

    const def: ProvinceDefinition = { id, r, g, b, name }
    const key = `${r},${g},${b}`

    if (byColor.has(key)) {
      console.warn(
        `[CsvParser] Linha ${lineNum + 1}: cor duplicada "${key}" (ID ${id} vs ${byColor.get(key)!.id})`,
      )
    }

    byColor.set(key, def)
    byId.set(id, def)
  }

  console.info(
    `[CsvParser] definition.csv: ${byId.size} províncias carregadas`,
  )

  return { byColor, byId }
}

export function parseAdjacenciesCsv(content: string): Adjacency[] {
  const result: Adjacency[] = []
  const lines = content.split(/\r?\n/)

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const raw = lines[lineNum].trim()

    // Ignorar linhas vazias e comentários
    if (!raw || raw.startsWith('#')) continue

    const parts = raw.split(';')
    if (parts.length < 5) {
      console.warn(
        `[CsvParser] adjacencies.csv linha ${lineNum + 1}: campos insuficientes, pulando: "${raw}"`,
      )
      continue
    }

    const from = parseInt(parts[0], 10)
    const to = parseInt(parts[1], 10)
    const typeStr = parts[2].trim().toLowerCase()
    const through = parseInt(parts[3], 10)
    const data = parseInt(parts[4], 10)
    const comment = (parts[5] ?? '').trim()

    if (isNaN(from) || isNaN(to) || isNaN(through)) {
      console.warn(
        `[CsvParser] adjacencies.csv linha ${lineNum + 1}: campos numéricos inválidos, pulando`,
      )
      continue
    }

    const type: AdjacencyType =
      typeStr === 'sea' ? 'sea' : typeStr === 'impassable' ? 'impassable' : 'land'

    result.push({ from, to, type, through, data: isNaN(data) ? 0 : data, comment })
  }

  console.info(`[CsvParser] adjacencies.csv: ${result.length} adjacências carregadas`)
  return result
}
