import { createResource, type Resource } from 'solid-js'

import { mapService } from '@/services/http/map-service'
import type { RichMapData, WorldData } from '@/types/data'

export const fetchMapAssets = async (
  roomId: string,
): Promise<{ worldData: WorldData; mapData: RichMapData }> => {
  const [countries, provinces, rawMapData, provincesBitmap] = await Promise.all([
    mapService.fetchCountries(roomId),
    mapService.fetchDefinitions(roomId),
    mapService.fetchParsedMapData(roomId),
    mapService.fetchMapImage(`/api/rooms/${roomId}/map/provinces.png`),
  ])

  return {
    worldData: {
      countries,
      provinces,
    },
    mapData: {
      ...rawMapData,
      provincesBitmap,
      idBufferResult: {
        ...rawMapData.idBufferResult,
        idBuffer: new Uint16Array(rawMapData.idBufferResult.idBuffer.slice().buffer),
      },
    },
  }
}

export function useMapData(
  roomId: () => string | undefined,
): Resource<{ worldData: WorldData; mapData: RichMapData }> {
  const [data] = createResource(roomId, fetchMapAssets)
  return data
}
