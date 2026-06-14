import { MapSchema, Schema, type } from '@colyseus/schema'
import { ProvinceData, type CountryData, type PlayerData } from './data'

export type ProvinceState = Pick<ProvinceData, 'id' 
  | 'owner' 
  | 'controller' 
  | 'cores' 
  | 'population'
>

export type PlayerState = Pick<PlayerData, 'id' 
  | 'countryTag',
>;

export type CountryState = Pick<CountryData, 'tag' 
  | 'money'
> 

export class GameState extends Schema {
  id: string = '' // 

  provinces?: ProvinceState[]
  players?: PlayerState[]
  countries?: CountryState[]
}
