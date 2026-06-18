import { Object3D } from 'three'

export interface Entity {
  id: number
  type: string
  group: Object3D
  updateTime?(time: number): void
  dispose(): void
}
