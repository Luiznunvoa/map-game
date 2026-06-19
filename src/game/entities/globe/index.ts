import {
  AdditiveBlending,
  BackSide,
  GLSL3,
  Group,
  Mesh,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
} from 'three'

import ATMOSPHERE_FRAG from '@/shaders/globe.atmosphere.frag.glsl?raw'
import ATMOSPHERE_VERT from '@/shaders/globe.atmosphere.vert.glsl?raw'
import FRAGMENT_SHADER from '@/shaders/globe.frag.glsl?raw'
import VERTEX_SHADER from '@/shaders/globe.vert.glsl?raw'
import type { NormalizedColor, ProvinceId } from '@/types/data'
import type { Entity } from '@/types/entity.js'
import type { GlobeMapInput, MapColorMode, ProvinceGlobeConfig } from '@/types/globe'

import type { ProvinceTextures as MapTextures } from './textures.js'
import { buildProvinceTextures } from './textures.js'

export class Map3D implements Entity {
  public id: number
  public type = 'map'
  public group: Group
  public textures: MapTextures

  private geometry: SphereGeometry
  private material: ShaderMaterial
  private atmosphereGeometry: SphereGeometry
  private atmosphereMaterial: ShaderMaterial
  private uniforms: Record<string, any>

  private mapVMin: number
  private mapVMax: number
  private mapWidth: number
  private mapHeight: number
  private idBuffer: Uint16Array

  public terrain: GlobeMapInput['terrain']
  public defaultMap: GlobeMapInput['defaultMap']

  constructor(id: number, data: GlobeMapInput, config: ProvinceGlobeConfig = {}) {
    this.id = id
    const {
      radius = 1.0,
      widthSegments = 128,
      heightSegments = 64,
      initialColorMode = 'province',
      mapVMin = 0.15,
      mapVMax = 0.85,
    } = config

    this.mapVMin = mapVMin
    this.mapVMax = mapVMax
    this.terrain = data.terrain
    this.defaultMap = data.defaultMap

    this.textures = buildProvinceTextures(data, initialColorMode)
    const { idTexture, paletteTexture, maxProvinceId, mapWidth, mapHeight, idBuffer } =
      this.textures

    this.mapWidth = mapWidth
    this.mapHeight = mapHeight
    this.idBuffer = idBuffer

    this.uniforms = {
      u_idTexture: { value: idTexture },
      u_palette: { value: paletteTexture },
      u_paletteSize: { value: maxProvinceId + 1 },
      u_selectedId: { value: 0 },
      u_highlightColor: { value: new Vector3(1.0, 0.85, 0.0) },
      u_lightDir: { value: new Vector3(5.0, 3.0, 5.0).normalize() },
      u_ambientStrength: { value: 0.35 },
      u_time: { value: 0.0 },
      u_vMin: { value: mapVMin },
      u_vMax: { value: mapVMax },
    }

    this.material = new ShaderMaterial({
      glslVersion: GLSL3,
      uniforms: this.uniforms,
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
    })

    this.geometry = new SphereGeometry(radius, widthSegments, heightSegments)
    const sphereMesh = new Mesh(this.geometry, this.material)
    sphereMesh.name = 'province-sphere'

    this.atmosphereGeometry = new SphereGeometry(radius * 1.025, 64, 32)
    this.atmosphereMaterial = new ShaderMaterial({
      glslVersion: GLSL3,
      vertexShader: ATMOSPHERE_VERT,
      fragmentShader: ATMOSPHERE_FRAG,
      blending: AdditiveBlending,
      side: BackSide,
      transparent: true,
      depthWrite: false,
    })
    const atmosphereMesh = new Mesh(this.atmosphereGeometry, this.atmosphereMaterial)
    atmosphereMesh.name = 'atmosphere'

    this.group = new Group()
    this.group.name = 'province-globe'
    this.group.add(atmosphereMesh)
    this.group.add(sphereMesh)
  }

  public pickProvinceAt(u: number, v: number): ProvinceId {
    // UV da esfera Three.js: U = 0→1 (longitude), V = 0→1 (latitude bottom-up)
    if (v < this.mapVMin || v > this.mapVMax) return 0 // Polo = oceano

    const mappedV = (v - this.mapVMin) / (this.mapVMax - this.mapVMin)

    // O bitmap é top-down, então invertemos o V mapeado
    const x = Math.floor(u * this.mapWidth)
    const y = Math.floor(mappedV * this.mapHeight)
    const clampedX = Math.max(0, Math.min(this.mapWidth - 1, x))
    const clampedY = Math.max(0, Math.min(this.mapHeight - 1, y))
    return this.idBuffer[clampedY * this.mapWidth + clampedX] ?? 0
  }

  public getProvinceTerrain(id: ProvinceId): string {
    if (this.defaultMap.seaStarts.includes(id)) {
      return 'ocean'
    }
    return this.terrain.overrides[id] ?? 'plains'
  }

  public selectProvince(id: ProvinceId): void {
    this.uniforms.u_selectedId.value = id
  }

  public setColorMode(
    mode: MapColorMode,
    customColors?: Record<ProvinceId, NormalizedColor>,
  ): void {
    this.textures.updatePalette(mode, customColors)
  }

  public updateTime(time: number): void {
    this.uniforms.u_time.value = time
  }

  public dispose(): void {
    this.geometry.dispose()
    this.material.dispose()
    this.atmosphereGeometry.dispose()
    this.atmosphereMaterial.dispose()
    this.textures.dispose()
  }
}
