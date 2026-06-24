import { createResource, type Resource } from 'solid-js'

import { mapService } from '@/services/http/map-service'
import { networkAdapter } from '@/lib/network'
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

  // Download the id_buffer.bin separately
  const idBufferRes = await networkAdapter.http.request<void, Blob>({
    method: 'GET',
    url: `/api/rooms/${roomId}/map/id_buffer.bin`,
    responseType: 'blob',
  })
  const bufferArray = await idBufferRes.data.arrayBuffer()
  const idBuffer = new Uint16Array(bufferArray)

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
        idBuffer: idBuffer,
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
