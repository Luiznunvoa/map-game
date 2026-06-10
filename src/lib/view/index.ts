export abstract class View {
  protected loaded = false
  protected container: HTMLElement | undefined

  constructor(container?: HTMLElement) {
    this.container = container 
  }

  abstract load(): Promise<void>

  abstract unload(): Promise<void> | void

  abstract start(): void

  abstract stop(): void

  async mount(): Promise<void> {
    if (!this.loaded) {
      await this.load()
      this.loaded = true
    }
    this.start()
  }

  async unmount(): Promise<void> {
    try {
      this.stop()
    } finally {
      if (this.loaded) {
        await this.unload()
        this.loaded = false
      }
    }
  }

  isLoaded(): boolean {
    return this.loaded
  }
}

export type ViewConstructor<T extends View = View> = new (...args: any[]) => T
