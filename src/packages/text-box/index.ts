export class GenericTextBox {
  private element: HTMLDivElement;

  constructor(container: HTMLElement, initialText: string = '') {
    this.element = document.createElement('div');
    this.element.style.position = 'absolute';
    this.element.style.bottom = '20px';
    this.element.style.left = '20px';
    this.element.style.padding = '10px 15px';
    this.element.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    this.element.style.color = '#fff';
    this.element.style.fontFamily = 'monospace';
    this.element.style.fontSize = '14px';
    this.element.style.borderRadius = '8px';
    this.element.style.pointerEvents = 'none';
    this.element.style.zIndex = '1000';
    this.setText(initialText);
    
    container.appendChild(this.element);
  }

  public setText(text: string): void {
    this.element.innerText = text;
  }

  public dispose(): void {
    this.element.remove();
  }
}
