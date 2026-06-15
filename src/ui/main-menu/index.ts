import { bg } from '@/assets'
import { html } from '@/lib/utils/html'

export class MainMenuUI {
  private element: HTMLElement

  constructor(container: HTMLElement, onStart: () => void) {
    this.element = html`
      <div 
        class="flex flex-col items-center justify-center min-w-screen min-h-screen bg-repeat" 
        style="background-image: url('${bg}');"
      >
        <h1 class="text-6xl font-bold tracking-wider mb-10 text-white drop-shadow-lg">
          Map Game
        </h1>
        <button id="start-btn" class="px-10 py-4 text-xl font-semibold bg-indigo-600 hover:bg-indigo-500 hover:scale-105 active:scale-95 transition-all duration-200 rounded-xl shadow-lg hover:shadow-indigo-500/50">
          Start Game
        </button>
      </div>
    `
    
    const startButton = this.element.querySelector('#start-btn') as HTMLButtonElement
    startButton.onclick = onStart
    
    container.appendChild(this.element)
  }

  public dispose(): void {
    this.element.remove()
  }
}
