import './style.css'

import { PerspectiveCamera } from 'three'
import { Globe, createProvinceGlobe } from './lib/globe'
import type { MapColorMode, ProvinceGlobeResult } from './lib/globe'
import { KeyboardControls } from './lib/keyboard-control'
import { OrbitControl } from './lib/orbit-control'
import { CustomScene } from './lib/custom-scene/custom-scene'
import { MapParser } from './lib/map-parser'

const MOCK_API = ''

const AVAILABLE_FILES = [
  'provinces.bmp',
  'definition.csv',
  'default.map',
  'adjacencies.csv',
  'terrain.txt',
  'region.txt',
  'continent.txt',
  'climate.txt',
]

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <section id="scene-container"></section>
`

const container = document.querySelector<HTMLElement>('#scene-container')!

const camera = new PerspectiveCamera(20, container.clientWidth / container.clientHeight, 0.1, 1000)
camera.position.z = 5

const keyboard = new KeyboardControls()
const orbit = new OrbitControl(5)

const globe = new Globe()

let currentObject = globe.group 
let provinceGlobe: ProvinceGlobeResult | null = null
let colorMode: MapColorMode = 'continent'

const customScene = new CustomScene(container, {
  camera,
  objects: [globe.group],
  animateCallback: (_scene, cam) => {
    const keys = keyboard.getKeys()
    const distMultiplier = cam.position.length() / 10

    // Rotação passiva quando longe do globo
    if (currentObject?.rotation && cam.position.length() > 8) {
      currentObject.rotation.y += 0.001
    }

    // Atualiza posição orbital via WASD
    const pos = orbit.updatePosition(keys, distMultiplier)
    cam.position.set(pos.x, pos.y, pos.z)
    cam.lookAt(0, 0, 0)

    // Atualiza uniform de tempo para highlight animado
    provinceGlobe?.updateTime(performance.now() / 1000)
  },
})

const parser = new MapParser()

parser.subscribe(({ status, data }) => {
  if (status === 'loading') return

  if (status === 'done' && data) {
    provinceGlobe?.dispose()

    provinceGlobe = createProvinceGlobe(data, {
      radius: 1.0,
      widthSegments: 128,
      heightSegments: 64,
      initialColorMode: colorMode,
    })

    currentObject = provinceGlobe.group
    customScene.setObjects([provinceGlobe.group])
  }
})

parser.parseFromUrl(MOCK_API, AVAILABLE_FILES);

(window as any).setColorMode = (mode: MapColorMode) => {
  colorMode = mode
  provinceGlobe?.setColorMode(mode)
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    customScene.dispose()
    keyboard.dispose()
    orbit.dispose()
    parser.dispose()
    globe.dispose()
    provinceGlobe?.dispose()
  })
}