import type { IView, ViewEventHandler } from '@/types/view'

export class MenuView implements IView {
  public onEvent?: ViewEventHandler
  private container: HTMLElement
  private menuContainer: HTMLElement

  constructor(container: HTMLElement) {
    this.container = container
    this.menuContainer = document.createElement('div')
    
    // Minimalist / Modern styling for the menu
    this.menuContainer.style.position = 'absolute'
    this.menuContainer.style.top = '0'
    this.menuContainer.style.left = '0'
    this.menuContainer.style.width = '100%'
    this.menuContainer.style.height = '100%'
    this.menuContainer.style.display = 'flex'
    this.menuContainer.style.flexDirection = 'column'
    this.menuContainer.style.justifyContent = 'center'
    this.menuContainer.style.alignItems = 'center'
    this.menuContainer.style.backgroundColor = '#1e1e24'
    this.menuContainer.style.color = '#fff'
    this.menuContainer.style.fontFamily = 'system-ui, -apple-system, sans-serif'
    this.menuContainer.style.zIndex = '10'

    const title = document.createElement('h1')
    title.textContent = 'Map Game'
    title.style.fontSize = '3rem'
    title.style.marginBottom = '2rem'
    title.style.letterSpacing = '0.05em'
    
    const startButton = document.createElement('button')
    startButton.textContent = 'Start Game'
    startButton.style.padding = '1rem 2.5rem'
    startButton.style.fontSize = '1.25rem'
    startButton.style.backgroundColor = '#3a86ff'
    startButton.style.color = 'white'
    startButton.style.border = 'none'
    startButton.style.borderRadius = '8px'
    startButton.style.cursor = 'pointer'
    startButton.style.transition = 'background-color 0.2s, transform 0.1s'

    startButton.onmouseover = () => {
      startButton.style.backgroundColor = '#2a66cc'
      startButton.style.transform = 'scale(1.05)'
    }
    
    startButton.onmouseout = () => {
      startButton.style.backgroundColor = '#3a86ff'
      startButton.style.transform = 'scale(1)'
    }

    startButton.onclick = () => {
      if (this.onEvent) {
        this.onEvent({ type: 'START_GAME' })
      }
    }

    this.menuContainer.appendChild(title)
    this.menuContainer.appendChild(startButton)
  }

  async load(): Promise<void> {
    // Nothing complex to load asynchronously
  }

  start(): void {
    this.container.appendChild(this.menuContainer)
  }

  stop(): void {
    if (this.menuContainer.parentNode === this.container) {
      this.container.removeChild(this.menuContainer)
    }
  }

  async unload(): Promise<void> {
    this.stop()
  }
}
