import { View } from '../lib/view'
import { CustomScene } from '../packages/custom-scene/custom-scene'
import { createProvinceGlobe, Globe, type MapColorMode, type ProvinceGlobeResult } from '../packages/globe'
import { KeyboardControls } from '../packages/keyboard-control'
import { MapParser } from '../packages/map-parser'
import { MouseControls } from '../packages/mouse-controls'
import { OrbitControl, type InputState } from '../packages/orbit-control'
import { PerspectiveCamera } from 'three'

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

export class MapView extends View {
  private camera!: PerspectiveCamera
  private keyboard!: KeyboardControls
  private mouseControls!: MouseControls 
  private orbit!: OrbitControl
  private globe!: Globe
  private customScene!: CustomScene
  private parser!: MapParser
  private provinceGlobe: ProvinceGlobeResult | null = null
  private colorMode: MapColorMode = 'province'

  constructor(container: HTMLElement) {
    super(container)
  }

  async load(): Promise<void> {
    const container = this.container!

    // Sets up camera
    this.camera = new PerspectiveCamera(20, container.clientWidth / container.clientHeight, 0.1, 1000)
    this.camera.position.z = 5

    // Input controls
    this.keyboard = new KeyboardControls()
    this.mouseControls = new MouseControls(container)
    
    this.orbit = new OrbitControl(5)
    this.globe = new Globe()

    this.customScene = new CustomScene(container, {
      camera: this.camera,
      objects: [this.globe.group],
      animateCallback: (_scene, cam) => {
        const keys = this.keyboard.getKeys()
        const mouseDeltas = this.mouseControls.consumeDeltas()
        
        const inputState: InputState = {
          keys,
          dragDeltaX: mouseDeltas.dragDeltaX,
          dragDeltaY: mouseDeltas.dragDeltaY,
          zoomDelta: mouseDeltas.zoomDelta,
        }

        const distMultiplier = cam.position.length() / 10

        if (this.currentObject?.rotation && cam.position.length() > 8) {
          this.currentObject.rotation.y += 0.001
        }

        const pos = this.orbit.updatePosition(inputState, distMultiplier)
        cam.position.set(pos.x, pos.y, pos.z)
        cam.lookAt(0, 0, 0)

        this.provinceGlobe?.updateTime(performance.now() / 1000)
      },
    })

    this.parser = new MapParser()
    this.parser.subscribe(({ status, data }) => {
      if (status === 'loading') return
      if (status === 'done' && data) {
        this.provinceGlobe?.dispose()
        this.provinceGlobe = createProvinceGlobe(data, {
          radius: 1.0,
          widthSegments: 128,
          heightSegments: 64,
          initialColorMode: this.colorMode,
        })
        this.customScene.setObjects([this.provinceGlobe.group])
      }
    })

    await this.parser.parseFromUrl(MOCK_API, AVAILABLE_FILES)
  }

  start(): void {
    this.customScene.resume()
  }

  stop(): void {
    this.customScene.pause()
  }

  async unload(): Promise<void> {
    this.customScene.dispose()
    this.keyboard.dispose()
    this.mouseControls.dispose()
    this.parser.dispose()
    this.globe.dispose()
    this.provinceGlobe?.dispose()
  }

  setColorMode(mode: MapColorMode): void {
    this.colorMode = mode
    this.provinceGlobe?.setColorMode(mode)
  }

  private get currentObject() {
    return this.provinceGlobe?.group ?? this.globe.group
  }
}