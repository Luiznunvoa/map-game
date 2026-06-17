import { createResource } from 'solid-js'

import { mapService } from '@/services/http/map-service'

export const fetchMapAssets = async () => {
  const [countries, provinces, rawMapData, provincesBitmap] = await Promise.all([
    mapService.fetchCountries(),
    mapService.fetchDefinitions(),
    mapService.fetchParsedMapData(),
    mapService.fetchMapImage('/api/maps/current/provinces.png'),
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

export function useMapData() {
  const [data] = createResource(fetchMapAssets)
  return data
}
