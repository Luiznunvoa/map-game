export interface INetworkAdapter<TState> {
  connect(endpoint: string, roomName: string, options?: any): Promise<void>;
  
  disconnect(): void;
  
  send<T>(action: string, payload: T): void;
  
  onStateChange(callback: (state: TState) => void): void;
  
  onMessage<T>(messageType: string, callback: (message: T) => void): void;
  
  onCollectionAdd(collectionKey: keyof TState, callback: (item: any, key: string) => void): void;
  onCollectionChange(collectionKey: keyof TState, callback: (item: any, key: string) => void): void;
  onCollectionRemove(collectionKey: keyof TState, callback: (item: any, key: string) => void): void;
}
