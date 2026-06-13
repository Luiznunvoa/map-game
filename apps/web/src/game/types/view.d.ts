export interface IView {
  load(): Promise<void>
  unload(): Promise<void> | void
  start(): void
  stop(): void
}

export type ViewConstructor<T extends IView = IView> = new (...args: any[]) => T
