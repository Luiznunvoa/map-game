import fs from 'fs'
import path from 'path'

const PUBLIC_DIR = path.join(process.cwd(), 'apps', 'web', 'public')
const COUNTRIES_IN = path.join(PUBLIC_DIR, 'countries.json')
const ADJACENCIES_IN = path.join(PUBLIC_DIR, 'adjacencies.csv')
const DEFINITION_IN = path.join(PUBLIC_DIR, 'definition.csv')

const COUNTRIES_OUT = path.join(PUBLIC_DIR, 'countries_new.json')
const DEFINITIONS_OUT = path.join(PUBLIC_DIR, 'definitions.json')

async function migrate() {
  console.log('Lendo dados antigos...')
  
  // 1. Ler countries.json
  const oldCountriesStr = fs.readFileSync(COUNTRIES_IN, 'utf-8')
  const oldCountries = JSON.parse(oldCountriesStr)
  
  // 2. Processar definition.csv
  const definitionContent = fs.readFileSync(DEFINITION_IN, 'utf-8')
  const provinceDefs = new Map() // id -> { id, color: [r,g,b], name }
  
  definitionContent.split(/\r?\n/).forEach(line => {
    const raw = line.trim()
    if (!raw || raw.startsWith('#') || raw.toLowerCase().startsWith('province')) return
    
    const parts = raw.split(';')
    if (parts.length < 5) return
    
    const id = parseInt(parts[0], 10)
    const r = parseInt(parts[1], 10)
    const g = parseInt(parts[2], 10)
    const b = parseInt(parts[3], 10)
    const name = parts[4].trim()
    
    if (!isNaN(id) && id > 0 && !isNaN(r)) {
      provinceDefs.set(id, { id, color: [r, g, b], name })
    }
  })

  // 3. Processar adjacencies.csv
  const adjacenciesContent = fs.readFileSync(ADJACENCIES_IN, 'utf-8')
  const adjacenciesMap = new Map() // fromId -> ProvinceAdjacency[]
  
  adjacenciesContent.split(/\r?\n/).forEach(line => {
    const raw = line.trim()
    if (!raw || raw.startsWith('#')) return
    
    const parts = raw.split(';')
    if (parts.length < 5) return
    
    const from = parseInt(parts[0], 10)
    const to = parseInt(parts[1], 10)
    const typeStr = parts[2].trim().toLowerCase()
    const through = parseInt(parts[3], 10)
    const data = parseInt(parts[4], 10)
    const comment = (parts[5] || '').trim()
    
    if (isNaN(from) || isNaN(to) || isNaN(through)) return
    
    const type = typeStr === 'sea' ? 'sea' : typeStr === 'impassable' ? 'impassable' : 'land'
    
    const adj = {
      to,
      type,
      ...(through > 0 ? { through } : {}),
      ...(data > 0 ? { data } : {}),
      ...(comment ? { comment } : {}),
    }
    
    if (!adjacenciesMap.has(from)) adjacenciesMap.set(from, [])
    adjacenciesMap.get(from).push(adj)
  })

  // 4. Montar os novos CountryData
  const newCountries = []
  for (const [tag, data] of Object.entries(oldCountries.tags)) {
    newCountries.push({
      tag,
      color: data.color || [1, 1, 1], // Tratar cores caso falte alguma
      money: 1000, // Dinheiro inicial padrão
    })
  }

  // 5. Montar os novos ProvinceData baseados no oldCountries.provinces e mesclar com CSVs
  const oldProvinces = oldCountries.provinces || []
  const newProvinces = []
  
  // Vamos mapear os que existem em countries.json
  const existingProvincesInJson = new Set()
  
  for (const p of oldProvinces) {
    existingProvincesInJson.add(p.id)
    const def = provinceDefs.get(p.id)
    
    newProvinces.push({
      id: p.id,
      color: def ? def.color : undefined,
      cores: p.cores || [],
      owner: p.owner || '',
      controller: p.controller || null,
      adjacencies: adjacenciesMap.get(p.id) || [],
    })
  }
  
  // O que estiver no CSV mas não no json (wastelands/oceanos que tem adjacências ou IDs válidos)
  for (const [id, def] of provinceDefs.entries()) {
    if (!existingProvincesInJson.has(id)) {
      newProvinces.push({
        id: id,
        color: def.color,
        cores: [],
        owner: '',
        controller: null,
        adjacencies: adjacenciesMap.get(id) || [],
      })
    }
  }

  // 6. Salvar os novos arquivos
  console.log(`Escrevendo ${COUNTRIES_OUT} com ${newCountries.length} países...`)
  fs.writeFileSync(COUNTRIES_OUT, JSON.stringify(newCountries, null, 2))
  
  console.log(`Escrevendo ${DEFINITIONS_OUT} com ${newProvinces.length} províncias...`)
  fs.writeFileSync(DEFINITIONS_OUT, JSON.stringify(newProvinces, null, 2))
  
  // Substituir countries.json pelo novo de forma segura
  fs.renameSync(COUNTRIES_OUT, COUNTRIES_IN)
  
  console.log('Migração concluída com sucesso!')
}

migrate().catch(console.error)
