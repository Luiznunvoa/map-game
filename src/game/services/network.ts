import type { INetworkAdapter } from "@/lib/network/types";
import type { GameState, ProvinceState } from "@/game/types/state";

export type ProvinceUpdateCallback = (id: number, data: ProvinceState) => void;

export class GameNetworkService {
  private adapter: INetworkAdapter<GameState>;
  private onProvinceUpdateListeners: Set<ProvinceUpdateCallback> = new Set();

  // INJEÇÃO DE DEPENDÊNCIA: Recebemos o adaptador genérico
  constructor(adapter: INetworkAdapter<GameState>) {
    this.adapter = adapter;
  }

  /** Inicia o ciclo de vida da rede do jogo */
  public async initializeGame(endpoint: string, playerToken: string) {
    await this.adapter.connect(endpoint, "global_map", { token: playerToken });
    this.setupGameListeners();
  }

  private setupGameListeners() {
    // Escuta a coleção "provinces"
    this.adapter.onCollectionAdd("provinces", (item: any, key: string) => {
      const provinceId = parseInt(key, 10);
      const provinceState = item as ProvinceState;
      this.notifyProvinceUpdate(provinceId, provinceState);
    });

    // Escuta eventos específicos do servidor
    this.adapter.onMessage("server_notification", (msg: { title: string, text: string }) => {
      console.log(`[ALERTA DO JOGO]: ${msg.title} - ${msg.text}`);
      // Poderia disparar um toast de UI aqui
    });
  }

  // --- Funções de Ação do Jogador ---

  public moveArmy(armyId: string, targetProvinceId: number) {
    // Usamos o adaptador para enviar de forma genérica
    this.adapter.send("move_army", { armyId, target: targetProvinceId });
  }

  public declareWar(targetCountryTag: string) {
    this.adapter.send("declare_war", { target: targetCountryTag });
  }

  // --- Sistema de Pub/Sub Local para o Three.js / UI consumirem ---

  public onProvinceUpdate(callback: ProvinceUpdateCallback) {
    this.onProvinceUpdateListeners.add(callback);
  }

  private notifyProvinceUpdate(id: number, data: ProvinceState) {
    this.onProvinceUpdateListeners.forEach(listener => listener(id, data));
  }
}