// globe.ts
import {
  Group,
  BackSide,
  MeshStandardMaterial,
  Mesh,
  MeshBasicMaterial,
  SphereGeometry,
  type Object3DEventMap,
} from 'three'

export interface GlobeConfig {
  radius?: number;
  color?: number;
  outlineColor?: number;
}

export class Globe {
  public readonly group: Group<Object3DEventMap>

  private mesh: Mesh
  private outlineMesh: Mesh

  constructor(config: GlobeConfig = {}) {
    const {
      radius = 1,
      color = 0x1d4ed8,
      outlineColor = 0x000000,
    } = config

    const geometry = new SphereGeometry(radius, 64, 48)
    const material = new MeshStandardMaterial({ color })
    const outlineMaterial = new MeshBasicMaterial({
      color: outlineColor,
      side: BackSide,
    })

    this.mesh = new Mesh(geometry, material)
    this.outlineMesh = new Mesh(geometry, outlineMaterial)
    this.outlineMesh.scale.setScalar(1.002)

    this.group = new Group()
    this.group.add(this.mesh, this.outlineMesh)
  }

  public dispose(): void {
    this.mesh.geometry.dispose()
    ;(this.mesh.material as MeshStandardMaterial).dispose()
    ;(this.outlineMesh.material as MeshBasicMaterial).dispose()
  }
}

export type { MapColorMode, NormalizedColor, GlobeMapInput, ProvinceTextures } from './ProvinceMapTextures.js'
export { buildProvinceTextures } from './ProvinceMapTextures.js'
export type { ProvinceGlobeConfig, ProvinceGlobeResult } from './ProvinceGlobe.js'
export { createProvinceGlobe } from './ProvinceGlobe.js'