export class PerformanceMonitor {
  private element: HTMLDivElement
  private frames: number = 0
  private prevTime: number
  private lastFrameTime: number

  constructor(parent: HTMLElement = document.body) {
    this.element = document.createElement('div')
    
    Object.assign(this.element.style, {
      position: 'absolute',
      top: '10px',
      left: '10px',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: '#00ff00',
      padding: '8px 12px',
      fontFamily: 'monospace',
      fontSize: '13px',
      borderRadius: '6px',
      pointerEvents: 'none',
      zIndex: '9999',
      lineHeight: '1.5',
      whiteSpace: 'pre', // Permite o uso de \n no innerText
    })

    this.element.innerText = 'Inicializando monitor...'
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

    // Atualiza os textos apenas 1x por segundo para ser legível (não piscar na tela)
    if (currentTime >= this.prevTime + 1000) {
      const fps = Math.round((this.frames * 1000) / (currentTime - this.prevTime))
      
      let text = `FPS:      ${fps}\n`
      text += `Latência: ${frameLatency.toFixed(2)} ms\n`

      // Tenta acessar a API de memória (Suportada no Chrome/Edge)
      const memory = (performance as any).memory
      if (memory) {
        // Converte bytes para Megabytes (MB)
        const usedMB = (memory.usedJSHeapSize / 1048576).toFixed(1)
        const limitMB = (memory.jsHeapSizeLimit / 1048576).toFixed(1)
        text += `Memória:  ${usedMB} MB / ${limitMB} MB`
      } else {
        text += 'Memória:  N/A (Browser s/ suporte)'
      }

      this.element.innerText = text
      
      // Muda a cor geral do painel dependendo da performance
      if (fps >= 50) this.element.style.color = '#00ff00'      // Verde
      else if (fps >= 30) this.element.style.color = '#ffff00' // Amarelo
      else this.element.style.color = '#ff4444'                // Vermelho

      this.prevTime = currentTime
      this.frames = 0
    }
  }

  public dispose(): void {
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element)
    }
  }
}
