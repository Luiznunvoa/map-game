import type { CountryState, PlayerState, ProvinceState } from './state'
import type { GameTickPayload, PlayerInRoom, Room, LobbyPlayer } from './room'

export interface HttpRequest<TBody = unknown> {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  url: string
  headers?: Record<string, string>
  params?: Record<string, unknown>
  data?: TBody
  timeout?: number
  responseType?: 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream'
}

export interface HttpResponse<TBody = unknown> {
  data: TBody
  status: number
  headers?: Record<string, string>
}

export interface IRequestClient {
  request<TBody = unknown, TResponse = unknown>(
    config: HttpRequest<TBody>,
  ): Promise<HttpResponse<TResponse>>
}

export type WebSocketMessageHandler<T = unknown> = (data: T) => void
export type WebSocketConnectionHandler = () => void
export type WebSocketErrorHandler = (error: unknown) => void

export interface IWebSocketClient<
  TEvents extends Record<string, unknown> = Record<string, unknown>,
> {
  connect(endpoint: string): Promise<void>
  disconnect(): void
  send<K extends keyof TEvents>(event: K, data: TEvents[K]): void
  on<K extends keyof TEvents>(event: K, handler: WebSocketMessageHandler<TEvents[K]>): void
  off<K extends keyof TEvents>(event: K, handler: WebSocketMessageHandler<TEvents[K]>): void
  onConnect(handler: WebSocketConnectionHandler): void
  offConnect(handler: WebSocketConnectionHandler): void
  onDisconnect(handler: WebSocketConnectionHandler): void
  offDisconnect(handler: WebSocketConnectionHandler): void
  onError(handler: WebSocketErrorHandler): void
  offError(handler: WebSocketErrorHandler): void
}

export interface INetworkAdapter<
  TEvents extends Record<string, unknown> = Record<string, unknown>,
> {
  http: IRequestClient
  roomWs: IWebSocketClient<TEvents>
  tickWs: IWebSocketClient<TEvents>
  stateWs: IWebSocketClient<TEvents>
}

type AppWebSocketEvents = {
  'user:state': PlayerState
  'province:state': ProvinceState
  'country:state': CountryState
  // Room WS events
  players_update: LobbyPlayer[]
  select_country: { country_id: string }
  start_game: undefined
  game_started: undefined
  room_closed: { message: string }
  game_tick: GameTickPayload
  action: { action: 'play' | 'pause'; speed?: number }
  state_action_ack: { status: string; message: string }
}

export interface IHttpStateService<TState, TId = number | string> {
  onStateChange(handler: (data: TState) => void): () => void
  sendStateUpdate(data: TState): void
  fetch(id: TId): Promise<TState>
}
