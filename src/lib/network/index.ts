import { BASE_URL } from '@/env'
import type { AppWebSocketEvents, INetworkAdapter } from '@/types/network'

import { AxiosRequestClient } from './axios'
import { NativeWebSocketClient } from './ws'

const createNetworkAdapter = (): INetworkAdapter<AppWebSocketEvents> => ({
  http: new AxiosRequestClient(BASE_URL),
  lobbyWs: new NativeWebSocketClient<AppWebSocketEvents>(),
  tickWs: new NativeWebSocketClient<AppWebSocketEvents>(),
  stateWs: new NativeWebSocketClient<AppWebSocketEvents>(),
})

export const networkAdapter = createNetworkAdapter()
