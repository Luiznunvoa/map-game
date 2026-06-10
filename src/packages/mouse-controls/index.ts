export class MouseControls {
  private isDragging: boolean = false;
  
  // Acumuladores de movimento
  private dragDeltaX: number = 0;
  private dragDeltaY: number = 0;
  private zoomDelta: number = 0;

  // Elemento alvo (pode ser o window, document, ou um canvas específico)
  private target: HTMLElement | Window;

  constructor(target: HTMLElement | Window = window) {
    this.target = target;
    this.attachEvents();
  }

  // Arrow functions preservam o contexto do 'this'
  private onMouseDown = (): void => {
    this.isDragging = true;
  };

  private onMouseUp = (): void => {
    this.isDragging = false;
  };

  private onMouseMove = (e: Event): void => {
    const mouseEvent = e as MouseEvent;
    if (this.isDragging) {
      this.dragDeltaX += mouseEvent.movementX;
      this.dragDeltaY += mouseEvent.movementY;
    }
  };

  private onWheel = (e: Event): void => {
    const wheelEvent = e as WheelEvent;
    wheelEvent.preventDefault(); // Evita o scroll da página
    this.zoomDelta += wheelEvent.deltaY;
  };

  private attachEvents(): void {
    this.target.addEventListener('mousedown', this.onMouseDown);
    this.target.addEventListener('mouseup', this.onMouseUp);
    this.target.addEventListener('mousemove', this.onMouseMove);
    this.target.addEventListener('wheel', this.onWheel, { passive: false });
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
    };

    // Zera os acumuladores após o consumo
    this.dragDeltaX = 0;
    this.dragDeltaY = 0;
    this.zoomDelta = 0;

    return deltas;
  }

  /**
   * Remove os eventos para evitar memory leaks caso o controle seja destruído
   */
  public dispose(): void {
    this.target.removeEventListener('mousedown', this.onMouseDown);
    this.target.removeEventListener('mouseup', this.onMouseUp);
    this.target.removeEventListener('mousemove', this.onMouseMove);
    this.target.removeEventListener('wheel', this.onWheel);
  }
}