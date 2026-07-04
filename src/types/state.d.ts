import { Schema } from '@colyseus/schema'

import { type CountryData, type PlayerData, ProvinceData } from './data'

export interface POPState {
  id: number
  size: number
  type: string
  culture: string
  religion: string
  wealth: number
  militancy: number
  consciousness: number
}

export type ProvinceState = Pick<
  ProvinceData,
  'id' | 'owner' | 'controller' | 'cores' | 'population' | 'pops'
>

export type PlayerState = Pick<PlayerData, 'id' | 'countryTag'>

export type CountryState = Pick<CountryData, 'tag' | 'money'>

export class GameState extends Schema {
  id: string = '' //

  provinces?: ProvinceState[]
  players?: PlayerState[]
  countries?: CountryState[]
}
