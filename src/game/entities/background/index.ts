import { Group } from 'three'

import type { Entity } from '@/types/entity'

export class StaticBackground implements Entity {
  public group: Group
  private container: HTMLElement

  constructor(container: HTMLElement, imageUrl: string) {
    this.group = new Group()
    this.group.name = 'static-background'
    this.container = container

    this.setupStyles()
    this.setImageUrl(imageUrl)
  }

  private setupStyles(): void {
    this.container.style.backgroundColor = '#000'
    this.container.style.backgroundSize = 'auto'
    this.container.style.backgroundPosition = 'center'
    this.container.style.backgroundRepeat = 'repeat'
  }

  public setImageUrl(imageUrl: string): void {
    this.container.style.backgroundImage = `url(${imageUrl})`
  }

  public dispose(): void {
    this.container.style.backgroundImage = ''
    this.container.style.backgroundColor = ''
    this.container.style.backgroundSize = ''
    this.container.style.backgroundPosition = ''
    this.container.style.backgroundRepeat = ''
  }
}
