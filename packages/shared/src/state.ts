import { MapSchema, Schema, type } from '@colyseus/schema'

export class ProvinceState extends Schema {
  @type('number') id: number = 0
  @type('number') population: number = 0
  @type('string') owner: string = ''
  @type('string') controller: string | null = null 
}

export class PlayerState extends Schema {
  @type('number') id: number = 0
  @type('string') countryTag: string = '' 
}

export class CountryState extends Schema {
  @type('string') tag: string = ''
  @type('number') money: number = 0
}

export class GameState extends Schema {
  @type('string') id: string = '' // ID da sala

  @type({ map: ProvinceState }) provinces = new MapSchema<ProvinceState>()
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>()
  @type({ map: CountryState }) countries = new MapSchema<CountryState>()
}

