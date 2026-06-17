export type ViewEvent = 
  | { type: 'START_GAME' }
  | { type: 'BACK_TO_MENU' }
  | { type: 'ENTER_ROOM'; data: number }
  // | { type: 'SELECT_PROVINCE'; payload: { id: number } }

export type ViewEventHandler = (event: ViewEvent) => void;

export interface IView {
  onEvent?: ViewEventHandler;
  load(): Promise<void>
  unload(): Promise<void> | void
  start(): void
  stop(): void
}

export type ViewConstructor<T extends IView = IView> = new (...args: unknown[]) => T
