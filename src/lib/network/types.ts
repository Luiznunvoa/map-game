export interface View {
  load(): Promise<void>
  unload(): Promise<void> | void
  start(): void
  stop(): void
}

export type ViewConstructor<T extends View = View> = new (...args: any[]) => T
