import type { MapViewContext } from './types'

export function handleClicks(ctx: MapViewContext, event: MouseEvent): void {
  if (!ctx.container) return
  const rect = ctx.container.getBoundingClientRect()
  ctx.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  ctx.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  ctx.raycaster.setFromCamera(ctx.mouse, ctx.scene.camera)

  if (!ctx.map?.group) return

  const intersects = ctx.raycaster.intersectObject(ctx.map.group, true)
  
  if (intersects.length > 0) {
    const hit = intersects.find(i => i.object.name === 'province-sphere')
    if (hit && hit.uv) {
      const u = hit.uv.x
      const v = hit.uv.y

      const provinceId = ctx.map.pickProvinceAt(u, v)
      if (provinceId > 0) {
        ctx.map.selectProvince(provinceId)
        const terrainType = ctx.map.getProvinceTerrain(provinceId)
        let text = `Selected Province ID: ${provinceId} | Terrain: ${terrainType}`
        if (ctx.countryData?.provinces) {
          const provData = ctx.countryData.provinces.find(p => p.id === provinceId)
          if (provData) {
            text += ` | Country: ${provData.owner}`
          }
        }
        ctx.textBox?.setText(text)
      }
    }
  }
}
