

export class MouseControls {
  private isCameraDragging: boolean = false
  private isSelecting: boolean = false
  private startX: number = 0
  private startY: number = 0
  
  // Acumuladores de movimento
  private dragDeltaX: number = 0
  private dragDeltaY: number = 0
  private zoomDelta: number = 0

  // Elemento alvo (pode ser o window, document, ou um canvas específico)
  private target: HTMLElement | Window
  private onClickCallback?: (e: MouseEvent) => void

  constructor(target: HTMLElement | Window = window) {
    this.target = target
    this.attachEvents()
  }

  public onClick(callback: (e: MouseEvent) => void): void {
    this.onClickCallback = callback
  }

  // Arrow functions preservam o contexto do 'this'
  private onMouseDown = (e: Event): void => {
    const mouseEvent = e as MouseEvent
    
    // Left button (0) for selection, middle button (1) for camera
    if (mouseEvent.button === 0) {
      this.isSelecting = true
      this.startX = mouseEvent.clientX
      this.startY = mouseEvent.clientY
    } else if (mouseEvent.button === 1) {
      mouseEvent.preventDefault()
      this.isCameraDragging = true
      this.startX = mouseEvent.clientX
      this.startY = mouseEvent.clientY
    }
  }

  private onMouseUp = (e: Event): void => {
    const mouseEvent = e as MouseEvent
    
    if (mouseEvent.button === 0 && this.isSelecting) {
      this.isSelecting = false
      const dx = mouseEvent.clientX - this.startX
      const dy = mouseEvent.clientY - this.startY
      const dist = Math.sqrt(dx * dx + dy * dy)

      // Se o arraste foi insignificante (menos de 5 pixels), trata-se de um clique
      if (dist < 5 && this.onClickCallback) {
        this.onClickCallback(mouseEvent)
      }
    } else if (mouseEvent.button === 1 && this.isCameraDragging) {
      this.isCameraDragging = false
    }
  }

  private onMouseMove = (e: Event): void => {
    const mouseEvent = e as MouseEvent
    
    if (this.isCameraDragging) {
      this.dragDeltaX += mouseEvent.movementX
      this.dragDeltaY += mouseEvent.movementY
    } else if (this.isSelecting) {
      // Logic for selection drag update if needed later
    }
  }

  private onWheel = (e: Event): void => {
    const wheelEvent = e as WheelEvent
    wheelEvent.preventDefault() // Evita o scroll da página
    this.zoomDelta += wheelEvent.deltaY
  }

  private attachEvents(): void {
    this.target.addEventListener('mousedown', this.onMouseDown)
    this.target.addEventListener('mouseup', this.onMouseUp)
    this.target.addEventListener('mousemove', this.onMouseMove)
    this.target.addEventListener('wheel', this.onWheel, { passive: false })
  }

  /**
   * Retorna os deltas acumulados e os zera imediatamente.
   * Isso é ideal para ser chamado uma vez por frame no seu Game Loop.
   */
  public consumeDeltas() {
    const deltas = {
      dragDeltaX: this.dragDeltaX,
      dragDeltaY: this.dragDeltaY,
      zoomDelta: this.zoomDelta,
    }

    // Zera os acumuladores após o consumo
    this.dragDeltaX = 0
    this.dragDeltaY = 0
    this.zoomDelta = 0

    return deltas
  }

  /**
   * Remove os eventos para evitar memory leaks caso o controle seja destruído
   */
  public dispose(): void {
    this.target.removeEventListener('mousedown', this.onMouseDown)
    this.target.removeEventListener('mouseup', this.onMouseUp)
    this.target.removeEventListener('mousemove', this.onMouseMove)
    this.target.removeEventListener('wheel', this.onWheel)
    

  }
}