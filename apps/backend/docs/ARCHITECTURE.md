# Arquitetura do Back-end: The Map Game

Este arquivo detalha a organização do código, a estrutura de diretórios e o fluxo de inicialização do servidor.

---

## 1. Estrutura de Diretórios Proposta

O código-fonte será organizado na pasta `src/` visando o desacoplamento de responsabilidades, facilitando a testabilidade e o reuso de tipos com o frontend.

```text
backend/
├── package.json
├── tsconfig.json
├── PROJECT_CONTEXT.md
├── ARCHITECTURE.md
├── GAMEPLAY_LOOP.md
└── src/
    ├── index.ts                 # Ponto de entrada do servidor
    ├── config/                  # Constantes globais e configurações de ambiente
    │   └── game.config.ts
    ├── rooms/                   # Salas do Colyseus (Controladores de Rede)
    │   └── MapGameRoom.ts
    ├── schema/                  # Modelos de Estado Sincronizados (Colyseus)
    │   ├── GameState.ts
    │   ├── PlayerState.ts
    │   ├── ProvinceState.ts
    │   └── ArmyState.ts
    ├── services/                # Regras de Negócio e Loops de Simulação
    │   ├── MapService.ts        # Carregamento e consulta de dados geográficos
    │   ├── GameLoopService.ts   # Orquestrador do loop de ticks do servidor
    │   ├── CombatService.ts     # Processador de batalhas
    │   └── SiegeService.ts      # Processador de cercos e ocupação
    └── utils/                   # Utilitários gerais
        ├── pathfinding.ts       # Algoritmo A* para movimentação de exércitos
        └── logger.ts
```

---

## 2. Componentes Principais

### 2.1 Ponto de Entrada (`index.ts`)
Responsável por:
- Inicializar o servidor HTTP (Express) e o servidor de WebSockets do Colyseus.
- Servir as rotas REST do mapa:
  - `GET /api/map/metadata`
  - `GET /api/map/textures/provinces`
  - `GET /api/map/textures/terrain`
- Chamar a carga assíncrona e processamento dos dados do mapa (`MapService`).
- Registrar o Room Handler `MapGameRoom` associado ao identificador `"global_map"`.

### 2.2 Colyseus Room (`rooms/MapGameRoom.ts`)
Atua como o **controller** de entrada de eventos e gerência de conexões:
- **`onCreate()`**: Configura a instância do `GameState`, inicializa listeners de rede (intents do cliente) e dispara o `GameLoopService`.
- **`onJoin(client, options)`**: Registra o novo jogador no estado, atribui uma tag/país inicial livre e envia confirmações.
- **`onLeave(client)`**: Trata desconexões (pausando o controle do país ou tornando-o IA temporariamente).
- **`onMessage(...)`**: Delega os comandos recebidos para as validações correspondentes em `services/`.

### 2.3 Services (Regras do Jogo)
- **`MapService`**:
  - Lê `web/public/definition.csv`, `web/public/adjacencies.csv` e `provinces.bmp` no startup.
  - Constrói o grafo de adjacências na memória de forma otimizada.
  - Processa o arquivo `provinces.bmp` e codifica os IDs numéricos das províncias nos canais de cor da textura, exportando-os em formato PNG compacto.
  - Provê funções como `areAdjacent(id1, id2)` e `getTerrainType(id)`.
- **`GameLoopService`**:
  - Gerencia o relógio central do jogo.
  - Ticks econômicos (mensais/diários na data fictícia do jogo) que geram recursos baseados nas províncias que cada jogador possui.
  - Ticks de simulação rápida (ex: a cada 100ms) para atualizar a posição dos exércitos em movimento.
- **`CombatService` & `SiegeService`**:
  - Implementam a lógica matemática de batalhas e cercos, gerando eventos no log do servidor e alterando o estado (`isUnderSiege`, `owner`, tamanho das tropas).

---

## 3. Fluxo de Inicialização (Bootstrap)

A sequência de boot do servidor ocorre conforme o diagrama abaixo:

```mermaid
sequenceDiagram
    participant Client as Cliente / Frontend
    participant Main as index.ts
    participant Map as MapService
    participant Net as Colyseus Server
    participant Loop as GameLoopService

    Main->>Map: 1. initialize()
    activate Map
    Note over Map: Lê BMP, CSV, TXT<br/>Gera texturas compactas PNG e grafo
    Map-->>Main: Sucesso
    deactivate Map

    Main->>Net: 2. listen(port)
    Note over Net: Registra sala "global_map" e rotas HTTP /api/map/*

    Client->>Main: 3. Requisição HTTP (GET /api/map/metadata & textures)
    Main-->>Client: Retorna dados otimizados e texturas PNG

    Client->>Net: 4. Conecta via WebSocket ("global_map")
    Net->>Loop: 5. startLoop() (Se for o primeiro jogador)
    activate Loop
    Note over Loop: Loop periódico ativo
```

---

## 4. Estratégia de Compartilhamento de Código com o Cliente

Uma grande vantagem de usar Bun + TypeScript em ambos os lados:
- Os arquivos de Schema (ex: `GameState.ts`, `ProvinceState.ts`) podem ser exportados diretamente ou copiados/referenciados de forma que o cliente tenha tipagem estrita 100% fiel à do servidor.
- Isso previne inconsistências de propriedades inexistentes na sincronização de estado do Colyseus.
