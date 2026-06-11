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
  private element: HTMLDivElement;
  private buttons: Map<T, HTMLButtonElement> = new Map();
  private currentValue: T;
  private onChangeCallback: (value: T) => void;

  constructor(config: SelectorConfig<T>) {
    const { container, options, initialValue, onChange, title } = config;
    this.currentValue = initialValue;
    this.onChangeCallback = onChange;

    // Criar o container principal do seletor
    this.element = document.createElement('div');
    this.element.className = 'map-selector-container';
    
    // Estilos premium do container (Glassmorphism moderno)
    this.element.style.position = 'absolute';
    this.element.style.top = '20px';
    this.element.style.right= '20px';
    this.element.style.display = 'flex';
    this.element.style.flexDirection = 'column';
    this.element.style.gap = '8px';
    this.element.style.padding = '12px';
    this.element.style.backgroundColor = 'rgba(15, 23, 42, 0.65)'; // slate-900 translúcido
    this.element.style.backdropFilter = 'blur(16px)';
    this.element.style.setProperty('-webkit-backdrop-filter', 'blur(16px)');
    this.element.style.border = '1px solid rgba(255, 255, 255, 0.08)';
    this.element.style.borderRadius = '12px';
    this.element.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.4)';
    this.element.style.zIndex = '1000';
    this.element.style.fontFamily = "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    this.element.style.userSelect = 'none';

    // Adicionar título se houver
    if (title) {
      const titleEl = document.createElement('div');
      titleEl.innerText = title;
      titleEl.style.color = 'rgba(255, 255, 255, 0.5)';
      titleEl.style.fontSize = '10px';
      titleEl.style.fontWeight = '700';
      titleEl.style.textTransform = 'uppercase';
      titleEl.style.letterSpacing = '1px';
      titleEl.style.paddingLeft = '4px';
      titleEl.style.marginBottom = '2px';
      this.element.appendChild(titleEl);
    }

    // Container dos botões
    const btnContainer = document.createElement('div');
    btnContainer.style.display = 'flex';
    btnContainer.style.gap = '4px';
    this.element.appendChild(btnContainer);

    // Criar botões para cada opção
    for (const opt of options) {
      const btn = document.createElement('button');
      btn.innerText = opt.label;
      
      // Estilos base dos botões
      btn.style.padding = '8px 16px';
      btn.style.border = 'none';
      btn.style.borderRadius = '8px';
      btn.style.fontSize = '12px';
      btn.style.fontWeight = '600';
      btn.style.cursor = 'pointer';
      btn.style.outline = 'none';
      btn.style.transition = 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)';
      
      // Aplicar estado inicial (ativo ou inativo)
      this.applyButtonState(btn, opt.value === initialValue);

      // Efeito de hover
      btn.addEventListener('mouseenter', () => {
        if (opt.value !== this.currentValue) {
          btn.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
          btn.style.color = '#fff';
        }
      });
      btn.addEventListener('mouseleave', () => {
        if (opt.value !== this.currentValue) {
          btn.style.backgroundColor = 'transparent';
          btn.style.color = 'rgba(255, 255, 255, 0.7)';
        }
      });

      // Clique do botão
      btn.addEventListener('click', () => {
        if (opt.value !== this.currentValue) {
          this.setValue(opt.value);
        }
      });

      this.buttons.set(opt.value, btn);
      btnContainer.appendChild(btn);
    }

    container.appendChild(this.element);
  }

  private applyButtonState(btn: HTMLButtonElement, isActive: boolean): void {
    if (isActive) {
      // Estado selecionado (Gradiante roxo/azul vibrante com sombra)
      btn.style.background = 'linear-gradient(135deg, #4f46e5, #9333ea)'; // indigo-600 para purple-600
      btn.style.color = '#ffffff';
      btn.style.boxShadow = '0 4px 12px rgba(79, 70, 229, 0.35)';
      btn.style.transform = 'scale(1.02)';
    } else {
      // Estado normal/desativado
      btn.style.background = 'transparent';
      btn.style.color = 'rgba(255, 255, 255, 0.7)';
      btn.style.boxShadow = 'none';
      btn.style.transform = 'scale(1)';
    }
  }

  public setValue(value: T): void {
    // Restaurar estado do botão anteriormente ativo
    const oldBtn = this.buttons.get(this.currentValue);
    if (oldBtn) {
      this.applyButtonState(oldBtn, false);
    }

    // Ativar novo botão
    this.currentValue = value;
    const newBtn = this.buttons.get(value);
    if (newBtn) {
      this.applyButtonState(newBtn, true);
    }

    // Disparar o callback
    this.onChangeCallback(value);
  }

  public getValue(): T {
    return this.currentValue;
  }

  public dispose(): void {
    this.element.remove();
    this.buttons.clear();
  }
}
