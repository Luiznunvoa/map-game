import { View } from '../lib/view'
import { CustomScene } from '../packages/custom-scene/custom-scene'
import { PerformanceMonitor } from '../packages/fps-counter'
import { createProvinceGlobe, type MapColorMode, type ProvinceGlobeResult } from '../packages/globe'
import { KeyboardControls } from '../packages/keyboard-control'
import { MapParser } from '../packages/map-parser'
import { MouseControls } from '../packages/mouse-controls'
import { OrbitControl, type InputState } from '../packages/orbit-control'
import { PerspectiveCamera, Object3D } from 'three'

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
  
  private map: ProvinceGlobeResult | null = null
  private monitor!: PerformanceMonitor 
  private objects: Object3D[] = []
  
  private customScene!: CustomScene
  private parser!: MapParser
  private colorMode: MapColorMode = 'province'

  constructor(container: HTMLElement) {
    super(container)
  }

  async load(): Promise<void> {
    const container = this.container!

    this.setupCamera(container)
    this.setupControls(container)
    this.setupObjects() 
    this.setupScene(container)
    
    await this.setupParser()
  }

  private setupCamera(container: HTMLElement): void {
    this.camera = new PerspectiveCamera(20, container.clientWidth / container.clientHeight, 0.1, 1000)
    this.camera.position.z = 5
  }

  private setupControls(container: HTMLElement): void {
    this.keyboard = new KeyboardControls()
    this.mouseControls = new MouseControls(container)
    this.orbit = new OrbitControl(5)
  }

  private setupObjects(): void {
    this.monitor = new PerformanceMonitor(this.container!)
  }

  private setupScene(container: HTMLElement): void {
    this.customScene = new CustomScene(container, {
      camera: this.camera,
      objects: [...this.objects], 
      animateCallback: this.onFrame,
    })
  }

  private async setupParser(): Promise<void> {
    this.parser = new MapParser()
    this.parser.subscribe(({ status, data }) => {
      if (status === 'loading') return
      
      if (status === 'done' && data) {
        this.map?.dispose()
        this.map = createProvinceGlobe(data, {
          radius: 1.0,
          widthSegments: 128,
          heightSegments: 64,
          initialColorMode: this.colorMode,
        })
        
        this.customScene.setObjects([this.map.group, ...this.objects])
      }
    })

    await this.parser.parseFromUrl(MOCK_API, AVAILABLE_FILES)
  }

  private onFrame = (_scene: any, cam: PerspectiveCamera): void => {
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

    this.map?.updateTime(performance.now() / 1000)

    this.monitor.update()
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
    this.map?.dispose()
    this.monitor.dispose()
  }

  setColorMode(mode: MapColorMode): void {
    this.colorMode = mode
    this.map?.setColorMode(mode)
  }

  private get currentObject() {
    return this.map?.group
  }
}