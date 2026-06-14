export class SelectionBox {
  private element: HTMLDivElement

  constructor() {
    this.element = document.createElement('div')
    this.element.className = 'selection-box'
    this.element.style.position = 'fixed'
    this.element.style.border = '2px dashed #3b82f6'
    this.element.style.backgroundColor = 'rgba(59, 130, 246, 0.2)'
    this.element.style.pointerEvents = 'none'
    this.element.style.zIndex = '9999'
    this.element.style.display = 'none'
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
