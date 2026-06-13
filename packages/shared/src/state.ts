import { MapSchema, Schema, type } from '@colyseus/schema'

// Estado de uma província individual (Delta Update)
export class ProvinceState extends Schema {
  @type('string') owner: string = ''
  @type('number') development: number = 1
  @type('boolean') isUnderSiege: boolean = false
}

// Estado do jogador (Conexão / Sessão)
export class PlayerState extends Schema {
  @type('string') sessionId: string = ''
  @type('string') name: string = ''
  @type('string') countryTag: string = '' // A tag do país que este jogador está controlando
}

// Estado do país na simulação de jogo
export class CountryState extends Schema {
  @type('string') tag: string = ''
  @type('string') name: string = ''
  @type('number') gold: number = 0
  @type('number') manpower: number = 0
  @type('number') stability: number = 1 // Exemplo de atributo específico de país
}

// O Estado Global da Sala (GameState)
export class GameState extends Schema {
  @type('number') tick: number = 0
  @type('string') inGameDate: string = '1444-11-11'

  // MapSchema é excelente para dicionários/listas que mudam de tamanho ou valores
  @type({ map: ProvinceState }) provinces = new MapSchema<ProvinceState>()
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>()
  @type({ map: CountryState }) countries = new MapSchema<CountryState>()
}
