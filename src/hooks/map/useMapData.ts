import { createResource, type Resource } from 'solid-js'

import { mapService } from '@/services/http/map-service'

import type { RichMapData, WorldData } from '@/types/data'

export const fetchMapAssets = async (): Promise<{ worldData: WorldData; mapData: RichMapData }> => {
  const [countries, provinces, cultures, rawMapData, provincesBitmap, riversBitmap, bufferArray] = await Promise.all([
    mapService.fetchCountries(""),
    mapService.fetchDefinitions(""),
    mapService.fetchCultures(""),
    mapService.fetchParsedMapData(""),
    mapService.fetchMapImage(`/api/map/provinces.png`),
    mapService.fetchMapImage(`/api/map/rivers.png`),
    mapService.fetchIdBuffer(""),
  ])
  
  // Decodifica o RLE Buffer (4 bytes block: uint16 count, uint16 id - Little Endian)
  const expectedSize = provincesBitmap.width * provincesBitmap.height
  const idBuffer = new Uint16Array(expectedSize)
  const dataview = new DataView(bufferArray)
  
  let denseIndex = 0
  for (let i = 0; i < dataview.byteLength; i += 4) {
    const count = dataview.getUint16(i, true)
    const id = dataview.getUint16(i + 2, true)
    for (let c = 0; c < count; c++) {
      if (denseIndex < expectedSize) {
        idBuffer[denseIndex++] = id
      }
    }
  }

  return {
    worldData: {
      countries,
      provinces,
      cultures,
    },
    mapData: {
      ...rawMapData,
      provincesBitmap,
      riversBitmap,
      idBufferResult: {
        ...rawMapData.idBufferResult,
        idBuffer: idBuffer,
      },
    },
  }
}

export function useMapData(): Resource<{ worldData: WorldData; mapData: RichMapData }> {
  const [data] = createResource(fetchMapAssets)
  return data
}
