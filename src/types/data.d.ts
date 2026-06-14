export type NormalizedColor = [number, number, number]

export interface ProvinceAdjacency {
  to: number
  type: 'sea' | 'land' | 'impassable'
  through?: number
  data?: number
  comment?: string
}

export interface ProvinceData {
  id: number
  color?: NormalizedColor  // [r, g, b]
  cores: string[]
  owner: string
  controller: string | null
  adjacencies?: ProvinceAdjacency[]
  population: number
}

export interface CountryData {
  tag: string
  color: NormalizedColor
  money: number
}

export interface PlayerData {
  id: number,
  name: string
  countryTag: string | undefined
}

export interface WorldData {
  countries: CountryData[]
  provinces: ProvinceData[]
}

