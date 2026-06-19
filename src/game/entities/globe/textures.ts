import { DataTexture, NearestFilter, RGBAFormat, UnsignedByteType } from 'three'

import type { IdBufferWithStats, NormalizedColor, ProvinceId } from '@/types/data'
import type { GlobeMapInput, MapColorMode } from '@/types/globe'

import { fillPalette, floatRgbToRgbaBytes } from './palette.js'

export interface ProvinceTextures {
  idTexture: DataTexture
  paletteTexture: DataTexture
  maxProvinceId: number
  mapWidth: number
  mapHeight: number
  idBuffer: Uint16Array
  stats: IdBufferWithStats['stats']
  updatePalette(mode: MapColorMode, customColors?: Record<ProvinceId, NormalizedColor>): void
  dispose(): void
}

export function buildProvinceTextures(
  data: GlobeMapInput,
  initialMode: MapColorMode = 'province',
): ProvinceTextures {
  const {
    provincesBitmap,
    provinceById,
    defaultMap,
    terrain,
    continents,
    regions,
    idBufferResult,
  } = data
  const { width, height } = provincesBitmap

  const { idBuffer, maxProvinceId, stats } = idBufferResult
  const rgbaIds = new Uint8Array(width * height * 4)
  for (let i = 0; i < idBuffer.length; i++) {
    const id = idBuffer[i]
    rgbaIds[i * 4 + 0] = id & 0xff // R = low byte
    rgbaIds[i * 4 + 1] = (id >> 8) & 0xff // G = high byte
    rgbaIds[i * 4 + 2] = 0
    rgbaIds[i * 4 + 3] = 255
  }

  const idTexture = new DataTexture(rgbaIds, width, height, RGBAFormat, UnsignedByteType)
  idTexture.minFilter = NearestFilter
  idTexture.magFilter = NearestFilter
  idTexture.flipY = false
  idTexture.needsUpdate = true
  const paletteSize = maxProvinceId + 1
  const paletteFloat = new Float32Array(paletteSize * 3)

  paletteFloat[0] = 0.08
  paletteFloat[1] = 0.18
  paletteFloat[2] = 0.4

  const seaStartsSet = new Set(defaultMap.seaStarts)

  fillPalette(
    paletteFloat,
    paletteSize,
    initialMode,
    provinceById,
    seaStartsSet,
    terrain,
    continents,
    regions,
  )

  const paletteBytes = floatRgbToRgbaBytes(paletteFloat, paletteSize, seaStartsSet)

  const paletteTexture = new DataTexture(paletteBytes, paletteSize, 1, RGBAFormat, UnsignedByteType)
  paletteTexture.minFilter = NearestFilter
  paletteTexture.magFilter = NearestFilter
  paletteTexture.needsUpdate = true

  function updatePalette(
    mode: MapColorMode,
    customColors?: Record<ProvinceId, NormalizedColor>,
  ): void {
    paletteFloat.fill(0)
    paletteFloat[0] = 0.08
    paletteFloat[1] = 0.18
    paletteFloat[2] = 0.4

    fillPalette(
      paletteFloat,
      paletteSize,
      mode,
      provinceById,
      seaStartsSet,
      terrain,
      continents,
      regions,
      customColors,
    )

    const newBytes = floatRgbToRgbaBytes(paletteFloat, paletteSize, seaStartsSet)
    paletteBytes.set(newBytes)
    paletteTexture.needsUpdate = true
  }

  return {
    idTexture,
    paletteTexture,
    maxProvinceId,
    mapWidth: width,
    mapHeight: height,
    idBuffer,
    stats,
    updatePalette,
    dispose() {
      idTexture.dispose()
      paletteTexture.dispose()
    },
  }
}
