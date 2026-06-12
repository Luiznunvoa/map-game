import * as Colyseus from 'colyseus.js'

import type { INetworkAdapter } from './types'

export class ColyseusAdapter<TState> implements INetworkAdapter<TState> {
  private client: Colyseus.Client
  private room: Colyseus.Room<TState> | null = null

  constructor() {
    // A URL real deve ser injetada depois ou configurada via .env
    this.client = new Colyseus.Client() 
  }

  public async connect(endpoint: string, roomName: string, options: any = {}): Promise<void> {
    // Atualiza o endpoint no cliente antes de conectar
    this.client = new Colyseus.Client(endpoint)
    try {
      this.room = await this.client.joinOrCreate<TState>(roomName, options)
      console.log(`[ColyseusAdapter] Conectado na sala: ${roomName} | Sessão: ${this.room.sessionId}`)
    } catch (e) {
      console.error('[ColyseusAdapter] Falha na conexão', e)
      throw e
    }
  }

  public disconnect(): void {
    this.room?.leave()
    this.room = null
  }

  public send<T>(action: string, payload: T): void {
    this.room?.send(action, payload)
  }

  public onStateChange(callback: (state: TState) => void): void {
    this.room?.onStateChange(callback)
  }

  public onMessage<T>(messageType: string, callback: (message: T) => void): void {
    this.room?.onMessage(messageType, callback)
  }

  // --- Lógica de Deltas de Coleções Abstraída ---
  
  public onCollectionAdd(collectionKey: keyof TState, callback: (item: any, key: string) => void): void {
    if (!this.room) return
    const collection = this.room.state[collectionKey] as any
    if (collection && collection.onAdd) {
      collection.onAdd((item: any, key: string) => {
        callback(item, key)
        // O Colyseus requer que registremos onChange internamente no item recém-adicionado
        if (item.onChange) {
          item.onChange(() => callback(item, key)) // Trata mudanças futuras como "onChange"
        }
      })
    }
  }

  public onCollectionChange(_collectionKey: keyof TState, _callback: (item: any, key: string) => void): void {
    // A implementação acima com item.onChange já cobre a atualização.
    // Esta função é mantida para manter a interface genérica caso outra biblioteca precise.
  }

  public onCollectionRemove(collectionKey: keyof TState, callback: (item: any, key: string) => void): void {
    if (!this.room) return
    const collection = this.room.state[collectionKey] as any
    if (collection && collection.onRemove) {
      collection.onRemove(callback)
    }
  }
}