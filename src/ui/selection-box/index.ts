import { html } from '@/lib/utils/html'

export class SelectionBox {
  private element: HTMLElement

  constructor() {
    this.element = html`
      <div class="fixed border-2 border-dashed border-blue-500 bg-blue-500/20 pointer-events-none z-[9999] hidden"></div>
    `
    document.body.appendChild(this.element)
  }

  public show(x: number, y: number): void {
    this.element.style.left = `${x}px`
    this.element.style.top = `${y}px`
    this.element.style.width = '0px'
    this.element.style.height = '0px'
    this.element.style.display = 'block'
  }

  public update(startX: number, startY: number, currentX: number, currentY: number): void {
    const x = Math.min(startX, currentX)
    const y = Math.min(startY, currentY)
    const width = Math.abs(startX - currentX)
    const height = Math.abs(startY - currentY)

    this.element.style.left = `${x}px`
    this.element.style.top = `${y}px`
    this.element.style.width = `${width}px`
    this.element.style.height = `${height}px`
  }

  public hide(): void {
    this.element.style.display = 'none'
  }

  public dispose(): void {
    this.element.remove()
  }
}
