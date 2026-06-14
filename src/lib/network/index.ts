import type { AppWebSocketEvents, INetworkAdapter } from "@/types/network";
import { AxiosRequestClient } from "../axios";
import { NativeWebSocketClient } from "../ws";
import { BASE_URL } from "@/env";

const createNetworkAdapter = (): INetworkAdapter<AppWebSocketEvents> => ({
  http: new AxiosRequestClient(BASE_URL),
  ws:   new NativeWebSocketClient<AppWebSocketEvents>(),
});

export const networkAdapter = createNetworkAdapter();
