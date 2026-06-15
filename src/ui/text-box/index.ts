import { html } from '@/lib/utils/html'

export class GenericTextBox {
  private element: HTMLElement

  constructor(container: HTMLElement, initialText: string = '') {
    this.element = html`
      <div class="absolute bottom-5 left-5 px-4 py-2 bg-black/70 text-white font-mono text-sm rounded-lg pointer-events-none z-[1000]">
        ${initialText}
      </div>
    `
    container.appendChild(this.element)
  }

  public setText(text: string): void {
    this.element.innerText = text
  }

  public dispose(): void {
    this.element.remove()
  }
}
