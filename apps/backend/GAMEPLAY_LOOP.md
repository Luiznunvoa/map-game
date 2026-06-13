# Simulação e Gameplay Loop: The Map Game

Este arquivo detalha as mecânicas que o servidor processa periodicamente (Tick Engine) e como ocorrem a movimentação, economia, combate e cerco (siege).

---

## 1. O Relógio Central (Tick Engine)

O servidor opera com três granularidades de tempo:

| Tipo de Tick | Frequência Real | Função Principal | Atualização de Estado |
| :--- | :--- | :--- | :--- |
| **Physics/Movement Tick** | Cada 100ms | Atualizar o progresso visual de movimentação das tropas. | `ArmyState.progressPercent` |
| **In-game Day Tick** | Cada 1000ms (1s) | Avançar o calendário fictício e recalcular combates. | `GameState.inGameDate`, `GameState.tick` |
| **In-game Month Tick** | Cada 30 dias (30s) | Geração de ouro, recarga de exércitos (manpower) e impostos. | `PlayerState.gold`, `PlayerState.manpower` |

---

## 2. Movimentação de Exércitos e Pathfinding

Diferente de jogos de tabuleiro simples onde a unidade se teleporta, as tropas caminham fisicamente pelas províncias.

### Fluxo de Movimento:
1. O cliente envia `move_army` contendo o `armyId` e a província de destino final (`targetProvinceId`).
2. O servidor usa o algoritmo **A*** no grafo de adjacências para encontrar o menor caminho terrestre de províncias válidas até o destino.
3. Se existir um caminho válido e o jogador estiver em paz (ou no território do inimigo em guerra), o servidor define a fila de províncias no array `movementPath` da unidade.
4. A cada tick de movimento (100ms), o progresso aumenta:
   $$\text{Progresso} += \frac{\text{Velocidade Base}}{\text{Custo de Movimento do Terreno}}$$
5. Ao alcançar $100\%$, o exército é movido logicamente para a próxima província da fila.

```text
Caminho: Província A ──(Deserto: Custo 1.5)──> Província B ──(Planície: Custo 1.0)──> Província C
```

---

## 3. Economia e Crescimento

No início de cada mês fictício:
1. **Geração de Ouro (Gold):**
   - Cada província gera uma renda base multiplicada pelo seu desenvolvimento.
   - A renda de todas as províncias controladas pelo jogador é somada e depositada em seu saldo (`PlayerState.gold`).
2. **Geração de Reservas Militares (Manpower):**
   - Cada província contribui com soldados recrutáveis dependendo do terreno e do desenvolvimento.
   - O saldo de `PlayerState.manpower` é atualizado.

---

## 4. Batalhas Terrestres (Combate)

Quando dois exércitos de nações inimigas (em estado de guerra) se encontram na mesma província:
1. O servidor bloqueia o movimento de ambos os exércitos (travados em combate).
2. A cada **Day Tick** (1 segundo), ocorre uma rodada de combate:
   - Rolagem de dados aleatória para cada lado.
   - Aplicação de modificadores de terreno (ex: atacar cruzando rio ou em montanha pune o atacante).
   - O dano infligido reduz a força/tamanho do exército adversário.
3. O combate termina quando:
   - Um dos exércitos é completamente aniquilado.
   - A moral de um dos exércitos chega a zero, forçando uma retirada automática para uma província vizinha amigável.

---

## 5. Cercos (Siege) e Ocupação

Se o exército de um jogador está em uma província controlada por um inimigo e não há exército defensor inimigo na mesma província:
1. A província entra em estado de cerco (`ProvinceState.isUnderSiege = true`).
2. A cada tick de dia, o exército atacante acumula progresso de cerco. A velocidade do cerco depende do tamanho do exército vs. nível de desenvolvimento/defesas da província.
3. Ao atingir $100\%$ de progresso:
   - O cerco termina (`ProvinceState.isUnderSiege = false`).
   - O controle político da província muda temporariamente (`ProvinceState.owner = tag_atacante`).
   - A renda daquela província deixa de ir para o antigo dono.
