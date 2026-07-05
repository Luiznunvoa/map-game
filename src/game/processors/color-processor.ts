import type { NormalizedColor, WorldData } from '@/types/data'
import type { MapColorMode } from '@/types/globe'

export interface ColorModeResult {
  customColors?: Record<number, NormalizedColor>
  customSecondaryColors?: Record<number, NormalizedColor>
}

export function processColorMode(worldData: WorldData, viewName: MapColorMode): ColorModeResult {
  let customColors: Record<number, NormalizedColor> | undefined
  let customSecondaryColors: Record<number, NormalizedColor> | undefined

  if (viewName === 'political') {
    customColors = {}
    for (const prov of worldData.provinces) {
      if (prov.owner && worldData.countries) {
        const ownerCountry = worldData.countries.find((c) => c.tag === prov.owner)
        if (ownerCountry) {
          customColors[prov.id] = ownerCountry.color
          continue
        }
      } else {
        customColors[prov.id] = [1, 1, 1]
        continue
      }
    }
  } else if (viewName === 'population') {
    customColors = {}
    let maxPop = 0
    for (const prov of worldData.provinces) {
      if (prov.population > maxPop) maxPop = prov.population
    }
    
    const maxLog = Math.log(maxPop + 1)
    for (const prov of worldData.provinces) {
      if (prov.population === 0) {
        customColors[prov.id] = [0, 0, 0]
      } else {
        const ratio = maxPop > 0 ? Math.log(prov.population + 1) / maxLog : 0
        customColors[prov.id] = [ratio, 1 - ratio, 0]
      }
    }
  } else if (viewName === 'culture') {
    customColors = {}
    customSecondaryColors = {}
    
    const hexToRGB = (hex: string): NormalizedColor => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result ? [
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255
      ] : [1, 1, 1]
    }

    for (const prov of worldData.provinces) {
      if (prov.population === 0 || !prov.pops || prov.pops.length === 0) {
        customColors[prov.id] = [0, 0, 0]
        continue
      }
      
      const cultureCount: Record<string, number> = {}
      let dominantCulture = ''
      let maxPop = -1
      let totalPop = 0
      
      for (const pop of prov.pops) {
        cultureCount[pop.culture] = (cultureCount[pop.culture] || 0) + pop.size
        totalPop += pop.size
        if (cultureCount[pop.culture] > maxPop) {
          maxPop = cultureCount[pop.culture]
          dominantCulture = pop.culture
        }
      }

      const hexColor = worldData.cultures?.[dominantCulture]?.color || '#FFFFFF'
      customColors[prov.id] = hexToRGB(hexColor)

      // Find secondary culture >= 33%
      let secondaryCulture = ''
      for (const [culture, size] of Object.entries(cultureCount)) {
        if (culture !== dominantCulture && size >= totalPop * 0.33) {
          secondaryCulture = culture
          break // Pick the first one that matches
        }
      }

      if (secondaryCulture) {
        const secHexColor = worldData.cultures?.[secondaryCulture]?.color || '#FFFFFF'
        customSecondaryColors[prov.id] = hexToRGB(secHexColor)
      }
    }
  }

  return { customColors, customSecondaryColors }
}
