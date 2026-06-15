import { MainMenuUI } from '@/ui/main-menu'
import type { IView, ViewEventHandler } from '@/types/view'

export class MenuView implements IView {
  public onEvent?: ViewEventHandler
  private container: HTMLElement
  private menuUI: MainMenuUI | null = null

  constructor(container: HTMLElement) {
    this.container = container
  }

  async load(): Promise<void> {
    // Nothing complex to load asynchronously
  }

  start(): void {
    this.menuUI = new MainMenuUI(this.container, () => {
      if (this.onEvent) {
        this.onEvent({ type: 'START_GAME' })
      }
    })
  }

  stop(): void {
    if (this.menuUI) {
      this.menuUI.dispose()
      this.menuUI = null
    }
  }

  async unload(): Promise<void> {
    this.stop()
  }
}
