import {
  getNumber,
  getString,
  parseClausewitz,
} from './ClausewitzParser.js'
import type { ClausewitzObject } from './ClausewitzParser.js'
import type { DefaultMap, ProvinceId } from '@/types/data'

export function parseDefaultMap(content: string): DefaultMap {
  const obj = parseClausewitz(content)

  const maxProvinces = getNumber(obj, 'max_provinces') ?? 0

  // sea_starts é um bloco { 2703 2704 2705 ... }
  const seaStartsVal = obj['sea_starts']
  const seaStarts = new Set<ProvinceId>()

  if (Array.isArray(seaStartsVal)) {
    for (const v of seaStartsVal) {
      if (typeof v === 'number') seaStarts.add(v)
    }
  } else if (seaStartsVal && typeof seaStartsVal === 'object' && !Array.isArray(seaStartsVal)) {
    // O parser pode ter interpretado como objeto com chave "__values__"
    const inner = seaStartsVal as ClausewitzObject
    const values = inner['__values__']
    if (Array.isArray(values)) {
      for (const v of values) {
        if (typeof v === 'number') seaStarts.add(v)
      }
    }
  }

  // Alternativa: o parser retorna { sea_starts: [2703, 2704, ...] }
  // Se seaStarts ainda estiver vazio, tentar leitura direta como array
  if (seaStarts.size === 0 && Array.isArray(obj['sea_starts'])) {
    const arr = obj['sea_starts'] as unknown[]
    for (const v of arr) {
      if (typeof v === 'number') seaStarts.add(v)
    }
  }

  return {
    maxProvinces,
    seaStarts: Array.from(seaStarts),
    files: {
      definitions: (getString(obj, 'definitions') ?? 'definition.csv').replace(/"/g, ''),
      provinces: (getString(obj, 'provinces') ?? 'provinces.bmp').replace(/"/g, ''),
      positions: (getString(obj, 'positions') ?? 'positions.txt').replace(/"/g, ''),
      terrain: (getString(obj, 'terrain') ?? 'terrain.bmp').replace(/"/g, ''),
      rivers: (getString(obj, 'rivers') ?? 'rivers.bmp').replace(/"/g, ''),
      terrainDefinition: (getString(obj, 'terrain_definition') ?? 'terrain.txt').replace(/"/g, ''),
    },
  }
}






