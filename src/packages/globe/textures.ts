import {
  DataTexture,
  NearestFilter,
  RGBAFormat,
  UnsignedByteType,
} from 'three'

import type { ProvinceId } from '@/packages/parser/index.js'
import type { IdBufferWithStats } from '@/packages/parser/index.js'
import { buildIdBuffer } from '@/packages/parser/index.js'

import { fillPalette, floatRgbToRgbaBytes } from './palette.js'
import type { GlobeMapInput, MapColorMode, NormalizedColor } from './types.js'

export interface ProvinceTextures {
  idTexture: DataTexture;
  paletteTexture: DataTexture;
  maxProvinceId: number;
  mapWidth: number;
  mapHeight: number;
  idBuffer: Uint16Array;
  stats: IdBufferWithStats['stats'];
  updatePalette(mode: MapColorMode, customColors?: Map<ProvinceId, NormalizedColor>): void;
  dispose(): void;
}

export function buildProvinceTextures(
  data: GlobeMapInput,
  initialMode: MapColorMode = 'province',
): ProvinceTextures {
  const { provincesBitmap, provinces, provinceById, defaultMap, terrain, continents } = data
  const { width, height } = provincesBitmap

  console.time('[ProvinceTextures] buildIdBuffer')
  const idResult = buildIdBuffer(provincesBitmap, provinces)
  console.timeEnd('[ProvinceTextures] buildIdBuffer')

  const { idBuffer, maxProvinceId, stats } = idResult
  const rgbaIds = new Uint8Array(width * height * 4)
  for (let i = 0; i < idBuffer.length; i++) {
    const id = idBuffer[i]
    rgbaIds[i * 4 + 0] = id & 0xFF         // R = low byte
    rgbaIds[i * 4 + 1] = (id >> 8) & 0xFF  // G = high byte
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
  paletteFloat[2] = 0.40

  fillPalette(paletteFloat, paletteSize, initialMode, provinceById, defaultMap.seaStarts, terrain, continents)

  const paletteBytes = floatRgbToRgbaBytes(paletteFloat, paletteSize, defaultMap.seaStarts)

  const paletteTexture = new DataTexture(paletteBytes, paletteSize, 1, RGBAFormat, UnsignedByteType)
  paletteTexture.minFilter = NearestFilter
  paletteTexture.magFilter = NearestFilter
  paletteTexture.needsUpdate = true

  function updatePalette(
    mode: MapColorMode,
    customColors?: Map<ProvinceId, NormalizedColor>,
  ): void {
    paletteFloat.fill(0)
    paletteFloat[0] = 0.08
    paletteFloat[1] = 0.18
    paletteFloat[2] = 0.40

    fillPalette(paletteFloat, paletteSize, mode, provinceById, defaultMap.seaStarts, terrain, continents, customColors)

    const newBytes = floatRgbToRgbaBytes(paletteFloat, paletteSize, defaultMap.seaStarts)
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
