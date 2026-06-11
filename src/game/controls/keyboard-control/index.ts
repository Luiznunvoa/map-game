export interface KeyControls {
  w: boolean;
  a: boolean;
  s: boolean;
  d: boolean;
}

export class KeyboardControls {
  private keys: KeyControls = { w: false, a: false, s: false, d: false }

  private handleKeyDown = (e: KeyboardEvent): void => {
    const key = e.key.toLowerCase()
    if (key in this.keys) {
      this.keys[key as keyof KeyControls] = true
    }
  }

  private handleKeyUp = (e: KeyboardEvent): void => {
    const key = e.key.toLowerCase()
    if (key in this.keys) {
      this.keys[key as keyof KeyControls] = false
    }
  }

  constructor() {
    window.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('keyup', this.handleKeyUp)
  }

  public getKeys(): Readonly<KeyControls> {
    return this.keys
  }

  public dispose(): void {
    window.removeEventListener('keydown', this.handleKeyDown)
    window.removeEventListener('keyup', this.handleKeyUp)
  }
}

