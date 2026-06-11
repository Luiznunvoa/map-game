import { Object3D, PerspectiveCamera, Raycaster, Vector2 } from 'three'

import { PerformanceMonitor } from '@/game/ui/fps-counter'
import { ProvinceGlobe } from '@/game/entities/globe'
import { KeyboardControls } from '@/game/controls/keyboard-control'
import { MouseControls } from '@/game/controls/mouse-controls'
import { type InputState,OrbitControl } from '@/game/controls/orbit-control'
import { GenericSelector } from '@/game/ui/selector'
import { GenericTextBox } from '@/game/ui/text-box'
import type { IView } from '@/game/types/view'
import { MapParser } from '@/game/services/map-parser'
import { CustomScene } from '@/lib/scene'
import type { MapColorMode } from '../entities/globe/types'

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
  'terrain.bmp',
]

export class MapView implements IView {
  private container: HTMLElement
  private camera!: PerspectiveCamera
  private keyboard!: KeyboardControls
  private mouseControls!: MouseControls 
  private orbit!: OrbitControl
  
  private map: ProvinceGlobe | null = null
  private monitor!: PerformanceMonitor 
  private objects: Object3D[] = []
  
  private customScene!: CustomScene
  private parser!: MapParser
  private colorMode: MapColorMode = 'continent'

  private textBox!: GenericTextBox
  private mapModeSelector!: GenericSelector<MapColorMode>
  private raycaster = new Raycaster()
  private mouse = new Vector2()

  constructor(container: HTMLElement, colorMode: MapColorMode = 'continent') {
    this.container = container
    this.colorMode = colorMode
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
    
    this.mouseControls.onClick(this.onClick)
  }

  private onClick = (event: MouseEvent) => {
    if (!this.container) return
    const rect = this.container.getBoundingClientRect()
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    this.raycaster.setFromCamera(this.mouse, this.camera)

    if (!this.map?.group) return

    const intersects = this.raycaster.intersectObject(this.map.group, true)
    
    if (intersects.length > 0) {
      const hit = intersects.find(i => i.object.name === 'province-sphere')
      if (hit && hit.uv) {
        const u = hit.uv.x
        const v = hit.uv.y

        const provinceId = this.map.pickProvinceAt(u, v)
        if (provinceId > 0) {
          this.map.selectProvince(provinceId)
          const terrainType = this.map.getProvinceTerrain(provinceId)
          this.textBox?.setText(`Selected Province ID: ${provinceId} | Terrain: ${terrainType}`)
        }
      }
    }
  }

  private setupObjects(): void {
    this.monitor = new PerformanceMonitor(this.container!)

    this.textBox = new GenericTextBox(this.container!, 'No province selected')

    this.mapModeSelector = new GenericSelector<MapColorMode>({
      container: this.container!,
      options: [
        { value: 'continent', label: 'Continents' },
        { value: 'province', label: 'Provinces' },
        { value: 'terrain', label: 'Terrain' },
        // { value: 'political', label: 'Político' },
      ],
      initialValue: this.colorMode,
      title: 'Map Modes',
      onChange: (mode) => {
        this.setColorMode(mode)
      },
    })
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
        this.map = new ProvinceGlobe(data, {
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
    this.textBox?.dispose()
    this.mapModeSelector?.dispose()
  }

  private setColorMode(mode: MapColorMode): void {
    this.colorMode = mode
    this.map?.setColorMode(mode)
  }

  private get currentObject() {
    return this.map?.group
  }
}