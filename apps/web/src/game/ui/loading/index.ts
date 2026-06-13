import { doge } from "@/assets"

export class LoadingScreen {
  private container: HTMLElement
  private overlayElement: HTMLDivElement | null = null
  private imagePath: string

  constructor(container: HTMLElement, imagePath: string = doge) {
    this.container = container
    this.imagePath = imagePath
  }

  /**
   * Mostra a tela de loading criando os elementos DOM
   */
  public show(): void {
    if (this.overlayElement) return

    this.overlayElement = document.createElement('div')
    this.overlayElement.className = 'game-loading-overlay'

    const container = document.createElement('div')
    container.className = 'game-loading-container'

    const spinner = document.createElement('div')
    spinner.className = 'game-loading-spinner'

    const img = document.createElement('img')
    img.className = 'game-loading-image'
    img.src = this.imagePath
    img.alt = 'Loading'
    img.onerror = () => {
      img.style.display = 'none'
    }

    container.appendChild(spinner)
    container.appendChild(img)
    this.overlayElement.appendChild(container)
    this.container.appendChild(this.overlayElement)
  }

  /**
   * Oculta a tela de loading suavemente com fade-out e remove do DOM
   */
  public async hide(): Promise<void> {
    if (!this.overlayElement) return

    const overlay = this.overlayElement
    this.overlayElement = null

    overlay.classList.add('fade-out')
    
    // Aguarda o término da animação CSS de fade-out
    await new Promise((resolve) => setTimeout(resolve, 300))
    overlay.remove()
  }

  /**
   * Destrói imediatamente o elemento se ainda estiver no DOM
   */
  public dispose(): void {
    if (this.overlayElement) {
      this.overlayElement.remove()
      this.overlayElement = null
    }
  }
}
