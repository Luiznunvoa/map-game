import { Object3D } from 'three'

export interface Entity {
  group: Object3D
  updateTime?(time: number): void
  dispose(): void
}
