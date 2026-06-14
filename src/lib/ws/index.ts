import type {
  IWebSocketClient,
  WebSocketConnectionHandler,
  WebSocketErrorHandler,
  WebSocketMessageHandler,
} from '@/types/network'

// Protocolo de envelope — ambos os lados precisam respeitar esse shape.
// send(event, data)  →  serializa  →  { event, data }
// onmessage(raw)     →  parseia    →  despacha para handlers do evento
type MessageEnvelope<T = unknown> = {
  event: string;
  data: T;
}

// ─── Implementação atualizada ─────────────────────────────────────────────────

export class NativeWebSocketClient<TEvents extends Record<string, unknown> = Record<string, unknown>>
implements IWebSocketClient<TEvents>
{
  private socket: WebSocket | null = null
  private readonly messageHandlers    = new Map<string, Set<WebSocketMessageHandler>>()
  private readonly connectHandlers    = new Set<WebSocketConnectionHandler>()
  private readonly disconnectHandlers = new Set<WebSocketConnectionHandler>()
  private readonly errorHandlers      = new Set<WebSocketErrorHandler>()

  connect(endpoint: string): Promise<void> {
    this.disconnect()

    return new Promise((resolve, reject) => {
      let settled = false
      const socket = new WebSocket(endpoint)

      socket.onopen = () => {
        settled = true
        this.socket = socket
        this.connectHandlers.forEach(h => h())
        resolve()
      }

      socket.onmessage = ({ data }) => this.handleMessage(data)

      socket.onclose = () => {
        this.socket = null
        if (!settled) {
          settled = true
          reject(new Error('WebSocket closed before connecting'))
          return
        }
        this.disconnectHandlers.forEach(h => h())
      }

      socket.onerror = (event) => {
        this.errorHandlers.forEach(h => h(event))
        if (!settled) {
          settled = true
          reject(new Error('WebSocket connection failed'))
        }
      }
    })
  }

  disconnect(): void {
    this.socket?.close()
    this.socket = null
  }

  // K extends keyof TEvents garante que só eventos mapeados podem ser enviados
  send<K extends keyof TEvents>(event: K, data: TEvents[K]): void {
    if (this.socket?.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected')
    }
    const envelope: MessageEnvelope<TEvents[K]> = { event: event as string, data }
    this.socket.send(JSON.stringify(envelope))
  }

  on<K extends keyof TEvents>(event: K, handler: WebSocketMessageHandler<TEvents[K]>): void {
    if (!this.messageHandlers.has(event as string)) {
      this.messageHandlers.set(event as string, new Set())
    }
    this.messageHandlers.get(event as string)!.add(handler as WebSocketMessageHandler)
  }

  off<K extends keyof TEvents>(event: K, handler: WebSocketMessageHandler<TEvents[K]>): void {
    this.messageHandlers.get(event as string)?.delete(handler as WebSocketMessageHandler)
  }

  onConnect(handler: WebSocketConnectionHandler): void    { this.connectHandlers.add(handler) }
  onDisconnect(handler: WebSocketConnectionHandler): void { this.disconnectHandlers.add(handler) }
  onError(handler: WebSocketErrorHandler): void           { this.errorHandlers.add(handler) }

  // handleMessage continua com unknown — JSON.parse não tem como saber o tipo
  private handleMessage(raw: unknown): void {
    if (typeof raw !== 'string') return

    try {
      const envelope = JSON.parse(raw) as MessageEnvelope
      if (typeof envelope.event !== 'string') return
      this.messageHandlers.get(envelope.event)?.forEach(h => h(envelope.data))
    } catch {
      // JSON malformado — ignora silenciosamente
    }
  }
}