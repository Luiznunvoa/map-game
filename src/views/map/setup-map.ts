import { Vector3 } from 'three'

import type { InputState } from '@/controls/orbit-control'
import { Map3D } from '@/entities/globe'
import { CustomScene, type FrameState } from '@/lib/scene'
import { MapParser } from '@/services/map'

import type { MapViewContext } from './types'



export function setupScene(ctx: MapViewContext, onFrame: (state: FrameState) => void): void {
  ctx.scene = new CustomScene(ctx.container, {
    camera: {
      fov: 20,
      near: 0.1,
      far: 1000,
      position: new Vector3(0, 0, 5),
    },
    entities: [...ctx.entities],
    onFrame: onFrame,
  })
}

export async function setupParser(ctx: MapViewContext): Promise<void> {
  ctx.parser = new MapParser()
  ctx.parser.subscribe(({ status, data }: any) => {
    if (status === 'loading') return
    
    if (status === 'done' && data) {
      ctx.map?.dispose()
      ctx.map = new Map3D(data, {
        radius: 1.0,
        widthSegments: 128,
        heightSegments: 64,
        initialColorMode: ctx.colorMode,
      })
      
      ctx.setColorMode(ctx.colorMode)
      
      ctx.scene.setEntities([ctx.map, ...ctx.entities])
    }
  })

  await ctx.parser.fetchMap()
}

export function handleFrame(ctx: MapViewContext, state: FrameState): void {
  const keys = ctx.keyboard.getKeys()
  const mouseDeltas = ctx.mouseControls.consumeDeltas()
  
  const inputState: InputState = {
    keys,
    dragDeltaX: mouseDeltas.dragDeltaX,
    dragDeltaY: mouseDeltas.dragDeltaY,
    zoomDelta: mouseDeltas.zoomDelta,
  }

  const distMultiplier = state.camera.position.length() / 10

  const currentObject = ctx.map?.group
  if (currentObject?.rotation && state.camera.position.length() > 8) {
    currentObject.rotation.y += 0.001
  }

  const pos = ctx.orbit.updatePosition(inputState, distMultiplier)
  state.camera.position.set(pos.x, pos.y, pos.z)
  state.camera.lookAt(0, 0, 0)

  ctx.map?.updateTime(performance.now() / 1000)

  ctx.monitor.update()
}
