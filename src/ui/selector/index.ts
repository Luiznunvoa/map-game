import { html } from '@/lib/utils/html'

export interface SelectorOption<T extends string | number> {
  value: T;
  label: string;
}

export interface SelectorConfig<T extends string | number> {
  container: HTMLElement;
  options: SelectorOption<T>[];
  initialValue: T;
  onChange: (value: T) => void;
  title?: string;
}

export class GenericSelector<T extends string | number> {
  private element: HTMLElement
  private buttons: Map<T, HTMLButtonElement> = new Map()
  private currentValue: T
  private onChangeCallback: (value: T) => void

  constructor(config: SelectorConfig<T>) {
    const { container, options, initialValue, onChange, title } = config
    this.currentValue = initialValue
    this.onChangeCallback = onChange

    const buttonsHtml = options.map(opt => `
      <button class="px-4 py-2 text-xs font-semibold font-mono cursor-pointer outline-none transition-colors duration-200 rounded-md">
        ${opt.label}
      </button>
    `).join('')

    this.element = html`
      <div class="absolute top-[70px] right-5 flex flex-col gap-2 p-3 bg-slate-900/65 backdrop-blur-md rounded-xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.4)] z-[1000] select-none">
        ${title ? `<div class="text-white text-[10px] font-bold font-mono tracking-widest pl-1 -mb-1">${title}</div>` : ''}
        <div class="flex gap-1">
          ${buttonsHtml}
        </div>
      </div>
    `

    const btnNodes = this.element.querySelectorAll('button')
    btnNodes.forEach((btn, index) => {
      const opt = options[index]
      this.buttons.set(opt.value, btn)

      this.applyButtonState(btn, opt.value === initialValue)

      btn.addEventListener('click', () => {
        if (opt.value !== this.currentValue) {
          this.setValue(opt.value)
        }
      })
    })

    container.appendChild(this.element)
  }

  private applyButtonState(btn: HTMLButtonElement, isActive: boolean): void {
    if (isActive) {
      btn.className = "px-4 py-2 text-xs font-semibold font-mono cursor-pointer outline-none transition-colors duration-200 bg-indigo-600 text-white rounded-md shadow"
    } else {
      btn.className = "px-4 py-2 text-xs font-semibold font-mono cursor-pointer outline-none transition-colors duration-200 bg-transparent text-white/70 hover:bg-white/10 hover:text-white rounded-md"
    }
  }

  public setValue(value: T): void {
    const oldBtn = this.buttons.get(this.currentValue)
    if (oldBtn) {
      this.applyButtonState(oldBtn, false)
    }

    this.currentValue = value
    const newBtn = this.buttons.get(value)
    if (newBtn) {
      this.applyButtonState(newBtn, true)
    }

    this.onChangeCallback(value)
  }

  public getValue(): T {
    return this.currentValue
  }

  public dispose(): void {
    this.element.remove()
    this.buttons.clear()
  }
}
