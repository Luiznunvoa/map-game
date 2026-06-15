import { html } from '@/lib/utils/html'

export class PerformanceMonitor {
  private element: HTMLElement
  private frames: number = 0
  private prevTime: number
  private lastFrameTime: number

  constructor(parent: HTMLElement = document.body) {
    this.element = html`
      <div class="absolute top-3 left-3 bg-black/80 text-green-400 px-3 py-2 font-mono text-[13px] rounded-md pointer-events-none z-[9999] leading-relaxed whitespace-pre">
        Inicializando monitor...
      </div>
    `
    parent.appendChild(this.element)
    
    this.prevTime = performance.now()
    this.lastFrameTime = this.prevTime
  }

  public update(): void {
    const currentTime = performance.now()
    this.frames++

    // Calcula a latência do último frame em milissegundos
    const frameLatency = currentTime - this.lastFrameTime
    this.lastFrameTime = currentTime

    // Atualiza os textos apenas 1x por segundo para ser legível
    if (currentTime >= this.prevTime + 1000) {
      const fps = Math.round((this.frames * 1000) / (currentTime - this.prevTime))
      
      let text = `FPS:      ${fps}\n`
      text += `Latência: ${frameLatency.toFixed(2)} ms\n`

      // Tenta acessar a API de memória (Suportada no Chrome/Edge)
      const memory = (performance as any).memory
      if (memory) {
        const usedMB = (memory.usedJSHeapSize / 1048576).toFixed(1)
        const limitMB = (memory.jsHeapSizeLimit / 1048576).toFixed(1)
        text += `Memória:  ${usedMB} MB / ${limitMB} MB`
      } else {
        text += 'Memória:  N/A (Browser s/ suporte)'
      }

      this.element.innerText = text
      
      this.element.classList.remove('text-green-400', 'text-yellow-400', 'text-red-500')
      if (fps >= 50) this.element.classList.add('text-green-400')
      else if (fps >= 30) this.element.classList.add('text-yellow-400')
      else this.element.classList.add('text-red-500')

      this.prevTime = currentTime
      this.frames = 0
    }
  }

  public dispose(): void {
    this.element.remove()
  }
}
