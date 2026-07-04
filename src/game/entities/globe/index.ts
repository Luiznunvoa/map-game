import {
  AdditiveBlending,
  BackSide,
  GLSL3,
  Group,
  Mesh,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
  type IUniform,
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
  private uniforms: Record<string, IUniform>

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
      u_riverTexture: { value: this.textures.riverTexture },
      u_hasRivers: { value: this.textures.riverTexture !== null ? 1 : 0 },
      u_showRivers: { value: 1 },
      u_showBorders: { value: 1 },
      u_isPopulationMode: { value: initialColorMode === 'population' ? 1 : 0 },
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

  public getProvinceCameraFocus(id: ProvinceId): { baseTheta: number; phi: number } | null {
    const stats = this.textures.stats[id]
    if (!stats || stats.pixelCount === 0) return null

    const x = stats.centroidX
    const y = stats.centroidY

    const u = x / this.mapWidth
    const mappedV = y / this.mapHeight
    const v = mappedV * (this.mapVMax - this.mapVMin) + this.mapVMin

    const phi = (1 - v) * Math.PI
    // Adjust baseTheta mapping to look directly at the given U coordinate
    const baseTheta = u * 2 * Math.PI - Math.PI / 2

    return { baseTheta, phi }
  }

  public setColorMode(
    mode: MapColorMode,
    customColors?: Record<ProvinceId, NormalizedColor>,
  ): void {
    this.uniforms.u_isPopulationMode.value = mode === 'population' ? 1 : 0
    this.textures.updatePalette(mode, customColors)
  }

  public setBordersVisible(visible: boolean): void {
    this.uniforms.u_showBorders.value = visible ? 1 : 0
  }

  public setRiversVisible(visible: boolean): void {
    this.uniforms.u_showRivers.value = visible ? 1 : 0
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
