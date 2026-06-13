import { MapSchema,Schema, type } from '@colyseus/schema'

// Estado de uma província individual (Delta Update)
export class ProvinceState extends Schema {
  @type('string') owner: string = ''
  @type('number') development: number = 1
  @type('boolean') isUnderSiege: boolean = false
}

// Estado do jogador (Envio contínuo / Frequente)
export class PlayerState extends Schema {
  @type('string') name: string = ''
  @type('number') gold: number = 0
  @type('number') manpower: number = 0
}

// O Estado Global da Sala (GameState)
export class GameState extends Schema {
  @type('number') tick: number = 0
  @type('string') inGameDate: string = '1444-11-11'

  // MapSchema é excelente para dicionários/listas que mudam de tamanho ou valores
  @type({ map: ProvinceState }) provinces = new MapSchema<ProvinceState>()
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>()
}
