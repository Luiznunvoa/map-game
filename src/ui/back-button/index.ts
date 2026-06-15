import { html } from '@/lib/utils/html'

export class BackButtonUI {
  private element: HTMLElement

  constructor(container: HTMLElement, onClick: () => void) {
    this.element = html`
      <button 
        class="absolute bottom-4 right-4 z-50 px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-white text-sm font-semibold rounded-lg shadow backdrop-blur transition-colors duration-200 border border-slate-600/50"
      >
        ← Back to Menu
      </button>
    `
    
    this.element.onclick = onClick
    
    container.appendChild(this.element)
  }

  public dispose(): void {
    this.element.remove()
  }
}
