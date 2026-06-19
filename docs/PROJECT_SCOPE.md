# 🗺️ The Map Game - Game Design & Project Scope

Este documento consolida todas as definições e decisões de design arquitetônico acordadas. Ele serve como o guia fundamental para o desenvolvimento do jogo.

---

## 1. Visão Geral

- **Nome Provisório:** The Map Game
- **Era/Tema:** Era Industrial / Vitoriana (1836 - 1936).
- **Pitch:** "Lidere sua nação pela industrialização e expansão em um jogo em tempo real de diplomacia, guerra e disputas econômicas online."
- **Escopo da Partida:**
  - Sessões curtas/médias (entre 1,5 a 3 horas).
  - Lobbies públicos/privados de 1 até 20 jogadores simultâneos.
  - O tempo será modular: a sala poderá definir diferentes cenários de duração (ex: campanhas curtas de 20 anos ou completas de 100 anos) e velocidade da partida.
- **Condição de Vitória:** Acúmulo de Score baseado em 3 pilares: **Poder Industrial, Poder Militar e Prestígio**, apurados no término do tempo de cenário estipulado.

## 2. Mecânicas Principais (Core Loop)

### Populações (Pops) e Economia

- Fortemente inspirado em _Victoria 2_, mas otimizado para sessões curtas.
- **Pops:** Cada província possui populações agrupadas por duas chaves para otimização do servidor: `[Profissão, Cultura]`. (A religião foi removida do escopo inicial para facilitar a lógica em partidas curtas).
- **Mercado Global e Mobilidade Social:** Existe um mercado de recursos afetado por oferta/demanda e com estoques por país. A transição de profissões de um Pop (ex: Fazendeiro para Operário) ocorre no **Tick Econômico/Mensal**, influenciado majoritariamente pelas necessidades das fábricas, rentabilidade e salários.

### Pesquisa e Tecnologia

- Diferente da clássica "árvore de tecnologia", o jogador **não pesquisa tecnologias manualmente**.
- Os jogadores investem em **Focos Nacionais**.
- A cada ciclo, há uma "rolagem de dados" baseada na quantidade de intelectuais/Pops focados. Caso seja bem sucedido, uma tecnologia aleatória do escopo daquele Foco é descoberta e os jogadores recebem uma Notificação (Pop-up/Jornal), que pode impactar fortemente o andamento do país.

### Guerra e Combate

- O mapa é dividido em Províncias (via imagem Bitmap e Parsing em Go).
- O movimento de um exército não é instantâneo. Exércitos demoram múltiplos _ticks_ para atravessar províncias, dependendo de tamanho, terreno e composição de unidades.
- **Combates:** Duram múltiplos ticks contínuos. Enquanto o combate acontece, jogadores de ambos os lados podem enviar e receber reforços das províncias adjacentes, até que um dos lados desista ou seja derrotado matematicamente.
- **Fog of War:** Visão limitada. Um país só enxerga o que está no raio de suas unidades/províncias. Essa visão é **compartilhada entre membros da mesma Aliança**.

### Diplomacia

- Inicialmente engloba: Alianças (que garantem visão de mapa compartilhada e cooperação militar), Guerras, Acordos Comerciais, Estados Vassalos e Concessão de Direito de Passagem.

## 3. Arquitetura Técnica e Servidor

A arquitetura usa a filosofia de **Servidor Autoritário Baseado em Estado**.

### Stack Tecnológico

- **Frontend:** TypeScript, Vite, UI sobre DOM e Motor Gráfico usando **Three.js**.
- **Backend:** Go (Golang) rodando como Servidor Central de Game State, WebSocket e Parser Lógico de Mapas.

### Responsabilidade Gráfica vs Servidor

- O Servidor (Go) **nunca calcula coordenadas 3D**. Ele trabalha com inteiros, províncias e distâncias relativas em porcentagem (`ex: Exército_A da província 10 para 15, progresso: 50%`).
- O Cliente (Three.js) é responsável por ler esses dados e **interpolar visualmente**, movendo e animando o modelo 3D na UI.

### Sistema de Rede e Deltas

- Para evitar afogamento de rede, o Backend Go mandará o Estado Completo apenas quando o usuário se conectar. A partir daí, emitirá **apenas os Deltas** (as mudanças).
- **Filtro de Fog of War:** O Go calcula a Visão Baseada em Aliança e emite Deltas customizados para cada jogador. _(Nota técnica: Calcular adjacências de grafos por jogador num servidor Go possui um overhead irrelevante. É algo totalmente viável para um escopo de até 20 a 50 jogadores simultâneos)._

### O Loop do Servidor (Multi-Tick)

O loop principal (Game Loop) em Go será dividido para suportar performance e simulação:

1. **Tick de Movimento/Guerra:** Frequente (ex: 2 a 10 vezes por segundo real). Responsável pelo progresso dos exércitos no mapa e cálculos de dano.
2. **Tick Econômico/Mensal:** Infrequente (ex: a cada 30~60 segundos reais). Responsável por recálculo de Populações, processamento do Mercado Global de oferta/demanda e disparos dos testes de descobrimento de Tecnologia.

## 4. O Produto Mínimo Viável (MVP)

A primeira base estrutural (foco imediato de desenvolvimento) abordará a camada primordial, sobre a qual todo o resto florescerá:

1. **Passagem do Tempo e Sessão:** Setup do servidor onde o tempo passa (de 1836 a 1936) via um relógio central.
2. **Sistema de Lobbies:** Conexão dos jogadores a uma sala WebSocket, seleção de país sincronizada.
3. **Core Sync loop:** Conexão Go <-> TypeScript trocando pacotes JSON de base do Estado.
4. **Broadcast de Eventos Base:** O servidor passando para o front-end informações vitais do avanço do tempo e recebendo confirmações de conexão.

A partir desse MVP funcionando com estabilidade, empilharemos os módulos gráficos do mapa, movimentação de tropas e o motor do Mercado de Pops.

---

_Este documento é um guia-vivo e será complementado com documentações de APIs ou structs específicas à medida que o código avançar._
