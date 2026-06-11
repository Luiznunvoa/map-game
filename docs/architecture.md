# Arquitetura do Projeto: The Map Game

## Visão Geral
O projeto **The Map Game** é um jogo online multiplayer de estratégia (estilo *Grand Strategy*) baseado em um mapa 3D interactivo. Ele segue uma arquitetura de cliente-servidor onde **o Servidor é a única fonte da verdade (Server-Authoritative)**. A ideia central é que todo o **Estado do Jogo** (posições, recursos, dono de cada província, etc.) seja calculado e emitido pelo servidor.

Neste contexto, as funções do **Cliente (este repositório)** se limitam estritamente a:
1. **Receber o estado** enviado pelo servidor e rederizá-lo graficamente (3D/DOM) de forma otimizada.
2. **Coletar inputs do usuário** (cliques, movimentos de câmera, ações) e enviá-los ao servidor como requisições, sem aplicar lógicas de negócio ou prever mudanças de estado antes da confirmação oficial do back-end.

## Stack Tecnológico
- **Linguagem Principal:** TypeScript
- **Bundler / Dev Server:** Vite
- **Package Manager:** Bun
- **Engine Gráfica (Frontend):** Three.js (responsável pela renderização 3D do globo, províncias e interações visuais).
- **Networking / Multiplayer:** Colyseus / Colyseus.js (Framework desenhado para jogos multiplayer, abstraindo a sincronização do state em tempo real).

## Estrutura de Diretórios
A arquitetura do cliente está separada para isolar a lógica específica do jogo de bibliotecas e adaptadores genéricos, localizada em `src/`:

### `src/game/`
Contém a lógica de negócio, regras visuais e os sistemas que formam o jogo em si:
- **`views/`**: Camada de apresentação principal. A classe `MapView` (em `map.ts`) serve como o agregador central, conectando a câmera, o parser do mapa, os controles de interação, a UI e a cena 3D.
- **`services/`**: Serviços de domínio e processos de background.
  - `network.ts`: Abstrai a comunicação de negócio do jogo com o servidor Colyseus, expondo métodos de intenção (ex: `moveArmy`, `declareWar`) e ouvindo o state do servidor (atualizações em `provinces`).
  - `map-parser.ts`: Serviço essencial focado na interpretação de "raw files" (arquivos bitmap de províncias, definições CSV, terrenos) para injetar os dados de relevo e divisões políticas.
- **`entities/`**: Entidades instanciáveis que habitam a cena 3D (ex: o `Globe`, que representa o próprio planeta/mapa-múndi).
- **`controls/`**: Módulos que traduzem inputs do usuário (teclado, mouse) em movimentos de câmera orbital ou interações em tela.
- **`ui/`**: Componentes da Interface de Usuário construídos sobre a camada HTML (DOM), que sobrepõem o canvas (como text boxes de seleção e medidores de FPS).
- **`types/`**: Definições estritas (TypeScript) das entidades, estados do jogo (`GameState`) e tipos usados transversalmente na pasta `game`.

### `src/lib/`
Contém infraestrutura agnóstica de domínio e adaptadores reaproveitáveis:
- **`network/`**: Fornece uma Interface unificada (`INetworkAdapter`) e possivelmente sua implementação real com Colyseus. Isso permite que a lógica de negócio do jogo não fique acoplada diretamente à sintaxe da biblioteca externa.
- **`scene/`**: Wrapper em torno do Three.js para o setup básico de rendering e o loop de animação contínuo.
- **`parsing-pipeline/`**: Funcionalidades auxiliares para leitura e decodificação assíncrona de formatos de arquivos.

## Ciclo de Vida e Fluxo de Dados
1. **Inicialização:** A classe `Game` (`src/game/index.ts`) inicia o sistema e carrega uma View (como a `MapView`).
2. **Construção do Mapa:** Durante o `load()` da `MapView`, o `MapParser` baixa e decodifica as texturas, CSVs e metadados. Esses dados são usados para inflar o modelo 3D do planeta.
3. **Loop de Renderização:** A câmera é atualizada por meio dos controles via input, e a cena (`CustomScene`) faz atualizações e chama o render a cada frame.
4. **Interação com a Rede:**
   - O `GameNetworkService` estabelece uma conexão via adaptador a uma room `"global_map"`.
   - Modificações no servidor sobre estado de províncias são recebidas, notificadas via "Pub/Sub" ou callbacks para as instâncias de tela locais, que reagem colorindo ou mutando o 3D.
   - Cliques em cena disparam raycasts (física simplificada), identificando a província focada, onde a intenção do usuário é processada e então disparada ao servidor.
