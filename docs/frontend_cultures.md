# Documentação de Integração Front-end: Culturas e Cores

Este documento serve para guiar a integração das Culturas Dinâmicas no front-end. Como discutido na arquitetura do jogo, as culturas agora possuem cores estritas que podem ser alteradas dependendo do savegame. Por conta disso, as cores são empacotadas **junto do save** (.osf).

## 1. Onde as culturas estão localizadas?

Quando você faz um `fetch` na rota `/api/map/savegame` e desempacota o `msgpack`, você recebe a estrutura principal do estado (`GameState`). 

Agora existe uma nova propriedade chamada `cultures` na raiz deste objeto, localizada ao lado de `provinces` e `countries`.

```typescript
interface GameState {
  totalTicks: number;
  countries: Record<string, CountryState>;
  cultures: Record<string, CultureState>; // <-- NOVO: Dicionário de culturas
  provinces: Record<number, ProvinceState>;
}
```

## 2. A estrutura da Cultura (`CultureState`)

A estrutura que representa uma Cultura é enviada em formato de Dicionário (*Key-Value Pair*) para acesso super rápido (`O(1)`). 
- **A Chave:** é o nome da cultura (ex: `"pashtun"`).
- **O Valor:** é um objeto contendo o próprio nome e a cor em formato **Hexadecimal**.

```typescript
interface CultureState {
  name: string;  // Nome oficial (ex: "pashtun")
  color: string; // Formato Hex com prefixo '#' (ex: "#34eb77")
}
```

### Exemplo do payload desempacotado:

```json
{
  "totalTicks": 0,
  "countries": { ... },
  "provinces": { ... },
  "cultures": {
    "pashtun": {
      "name": "pashtun",
      "color": "#34eb77"
    },
    "russian": {
      "name": "russian",
      "color": "#e3242b"
    },
    "native_american_minor": {
      "name": "native_american_minor",
      "color": "#b25c34"
    }
  }
}
```

## 3. Guia de Implementação para o Map Mode de "Culturas"

1. **Obtenção Rápida da Cor:**
   Sempre que precisar pintar uma província inteira de acordo com a cultura predominante (Map Mode), basta checar qual é o maior POP dentro do array `province.pops`.
   Pegue o nome da cultura predominante desse POP (ex: `"pashtun"`) e busque a cor instanciada diretamente no dicionário global:
   
   ```javascript
   const predominantCulture = "pashtun"; // Obtido a partir da análise dos POPs da província
   const mapColor = gameState.cultures[predominantCulture]?.color || "#FFFFFF"; // Fallback para branco caso não encontre
   ```

2. **Evite buscar as cores repetidamente:** 
   Recomenda-se salvar a propriedade `gameState.cultures` numa *Store* do estado da UI logo no carregamento (ex: `Redux` ou `Zustand`). Isso evita varreduras profundas enquanto o `canvas/WebGL` renderiza cada frame a 60 FPS.
