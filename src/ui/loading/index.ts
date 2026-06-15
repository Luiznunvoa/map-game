import { bg, doge } from '@/assets'
import { html } from '@/lib/utils/html'

export class LoadingScreen {
  private container: HTMLElement
  private overlayElement: HTMLElement | null = null
  private imagePath: string

  constructor(container: HTMLElement, imagePath: string = doge) {
    this.container = container
    this.imagePath = imagePath
  }

  /**
   * Mostra a tela de loading criando os elementos via helper nativo
   */
  public show(): void {
    if (this.overlayElement) return

    this.overlayElement = html`
      <div 
        class="absolute inset-0 flex justify-center items-center z-[9999] bg-repeat transition-opacity duration-300"
        style="background-image: url('${bg}');"
      >
        <div class="relative flex justify-center items-center w-32 h-32">
          <!-- Spinner Ring -->
          <div class="absolute inset-0 border-4 border-white/10 border-t-indigo-500 border-r-indigo-500 rounded-full animate-spin"></div>
          
          <!-- Inner Image -->
          <img 
            src="${this.imagePath}" 
            alt="Loading" 
            class="w-16 h-16 object-contain z-10 pointer-events-none" 
            onerror="this.style.display='none'" 
          />
        </div>
      </div>
    `

    this.container.appendChild(this.overlayElement)
  }

  /**
   * Oculta a tela de loading suavemente com fade-out e remove do DOM
   */
  public async hide(): Promise<void> {
    if (!this.overlayElement) return

    const overlay = this.overlayElement
    this.overlayElement = null

    // Aplica as classes Tailwind para fade-out
    overlay.classList.add('opacity-0', 'pointer-events-none')
    
    // Aguarda o término da animação de transição (300ms definido na classe duration-300)
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
