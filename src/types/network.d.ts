import type { CountryState, PlayerState, ProvinceState } from "./state";

export interface HttpRequest<TBody = unknown> {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
  data?: TBody;
  timeout?: number;
}

export interface HttpResponse<TBody = unknown> {
  data: TBody;
  status: number;
  headers?: Record<string, string>;
}

export interface IRequestClient {
  request<TBody = unknown, TResponse = unknown>(
    config: HttpRequest<TBody>
  ): Promise<HttpResponse<TResponse>>;
}

export type WebSocketMessageHandler<T = unknown> = (data: T) => void;
export type WebSocketConnectionHandler = () => void;
export type WebSocketErrorHandler = (error: unknown) => void;

export interface IWebSocketClient<TEvents extends Record<string, unknown> = Record<string, unknown>> {
  connect(endpoint: string): Promise<void>;
  disconnect(): void;
  send<K extends keyof TEvents>(event: K, data: TEvents[K]): void;
  on<K extends keyof TEvents>(event: K, handler: WebSocketMessageHandler<TEvents[K]>): void;
  off<K extends keyof TEvents>(event: K, handler: WebSocketMessageHandler<TEvents[K]>): void;
  onConnect(handler: WebSocketConnectionHandler): void;
  onDisconnect(handler: WebSocketConnectionHandler): void;
  onError(handler: WebSocketErrorHandler): void;
}

export interface INetworkAdapter<
  TEvents extends Record<string, unknown> = Record<string, unknown>
> {
  http: IRequestClient;
  ws: IWebSocketClient<TEvents>;
}

type AppWebSocketEvents = {
  // Examples
  // TODO: Revise that
  'user:state': PlayerState
  'province:state': ProvinceState
  'country:state': CountryState
};

