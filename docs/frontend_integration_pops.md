# Documentação de Integração Front-end: Dados Demográficos (POPs) no Savegame

Este documento detalha o formato da nova estrutura de dados (estado do mapa) que está sendo enviada pela API para o front-end, especificamente na rota de carregamento do savegame, onde agora são incluídos os dados das populações de cada província (POPs).

## 1. Rota e Formato de Transferência

- **Endpoint:** `/api/map/savegame` (sujeito à configuração atual de rotas no arquivo principal)
- **Codificação:** MessagePack (`msgpack`) 
- **Compressão:** O binário gerado pelo `msgpack` é comprimido usando **Gzip** antes de ser despachado pela rede.
- **Cabeçalho de Resposta:** `Content-Type: application/gzip`

**Para o desenvolvedor Front-end:** 
Ao dar um `fetch()` nesta rota, você deve:
1. Receber o *Blob* ou *ArrayBuffer*.
2. Descomprimir o buffer Gzip (usando a [DecompressionStream API](https://developer.mozilla.org/en-US/docs/Web/API/DecompressionStream) ou biblioteca `pako`).
3. Decodificar o *buffer* binário resultante usando um decodificador MessagePack (como `@msgpack/msgpack`).

---

## 2. Nova Estrutura de Tipos (TypeScript Interfaces)

O *payload* desempacotado corresponderá à raiz do jogo (`GameState`). O mapa não usa *arrays* para as províncias e sim *Dicionários* / *Objetos* indexados pelo respectivo ID para complexidade O(1). Abaixo estão as tipagens esperadas no Javascript/Typescript:

### O Estado Raiz (Root)
```typescript
interface GameState {
  totalTicks: number;
  countries: Record<string, CountryState>;
  provinces: Record<number, ProvinceState>; // Chave: Province ID (ex: 1209)
}
```

### O Estado da Província
A estrutura da província foi atualizada para receber os `pops` de forma opcional (apenas províncias com população definida terão a chave).

```typescript
interface ProvinceState {
  id: number;
  owner: string;
  controller: string;
  pops?: POPState[]; // Novo: Um array populacional opcional
}
```

### O Estado do POP (A População)
Cada objeto no *array* `pops` contém as minúcias demográficas completas e em tempo real dos cidadãos:

```typescript
interface POPState {
  id: number;            // ID global único desta população
  size: number;          // Quantidade bruta de indivíduos
  type: string;          // A profissão. Ex: "aristocrats", "farmers", "artisans"
  culture: string;       // A etnia. Ex: "pashtun", "tajik", "russian"
  religion: string;      // A religião. Ex: "sunni", "orthodox", "animist"
  wealth: number;        // Dinheiro físico (float) acumulado pelo grupo
  militancy: number;     // Tendência/Probabilidade a se revoltar e criar exércitos rebeldes
  consciousness: number; // Nível de consciência política e exigência por reformas
}
```

---

## 3. Exemplo do Payload Retornado (Representação JSON)

Abaixo um trecho simulado de como fica a resposta final na memória do Front-end ao inspecionar o objeto da província de ID `1209` (Cabul/Afeganistão):

```json
{
  "totalTicks": 0,
  "countries": {
    "AFG": {
      "tag": "AFG",
      "color": "#c08224"
    }
  },
  "provinces": {
    "1209": {
      "id": 1209,
      "owner": "AFG",
      "controller": "AFG",
      "pops": [
        {
          "id": 12543,
          "size": 2750,
          "type": "aristocrats",
          "culture": "pashtun",
          "religion": "sunni",
          "wealth": 0.0,
          "militancy": 0.0,
          "consciousness": 0.0
        },
        {
          "id": 12544,
          "size": 113025,
          "type": "farmers",
          "culture": "pashtun",
          "religion": "sunni",
          "wealth": 0.0,
          "militancy": 0.0,
          "consciousness": 0.0
        }
      ]
    }
  }
}
```

---

## 4. Recomendações e Boas Práticas

1. **Eficiência de Renderização:** O payload atualizado agora carrega **~24.187 entradas individuais** de populações distribuídas por milhares de províncias. Como o Front-end lida com WebGL/Canvas para desenhar o mapa, procure mapear os valores populacionais agregando os dados no nível da província (ex: somar tudo para exibir um `TotalPopulation`) para não encher a renderização.
2. **Dados em Interfaces (UI):** Recomendado desenhar gráficos demográficos (como um *Pie Chart* de Cultura ou Religião) apenas quando uma província for explicitamente clicada/selecionada.
3. **Ausência de POPs:** A propriedade `pops` utiliza `omitempty` no Backend. O dev de front deve estar pronto para a situação onde `province.pops` é `undefined`, o que significa que o território é vazio/inabitável.
