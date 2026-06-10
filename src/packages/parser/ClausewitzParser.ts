import type { ClausewitzObject, ClausewitzValue } from "./types.js";

type TokenType =
  | "LBRACE"   // {
  | "RBRACE"   // }
  | "EQUALS"   // =
  | "STRING"   // palavra sem espaço ou string entre aspas
  | "EOF";

interface Token {
  type: TokenType;
  value: string;
}

function tokenize(text: string): Token[] {
  // Remove comentários e normaliza quebras de linha
  const cleaned = text
    .split(/\r?\n/)
    .map((line) => {
      const commentIdx = line.indexOf("#");
      return commentIdx >= 0 ? line.slice(0, commentIdx) : line;
    })
    .join("\n");

  const tokens: Token[] = [];
  let i = 0;
  const len = cleaned.length;

  while (i < len) {
    const ch = cleaned[i];

    // Pular espaços e quebras de linha
    if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") {
      i++;
      continue;
    }

    if (ch === "{") {
      tokens.push({ type: "LBRACE", value: "{" });
      i++;
      continue;
    }

    if (ch === "}") {
      tokens.push({ type: "RBRACE", value: "}" });
      i++;
      continue;
    }

    if (ch === "=") {
      tokens.push({ type: "EQUALS", value: "=" });
      i++;
      continue;
    }

    // String entre aspas
    if (ch === '"') {
      let str = "";
      i++; // pular a aspa de abertura
      while (i < len && cleaned[i] !== '"') {
        str += cleaned[i++];
      }
      i++; // pular a aspa de fechamento
      tokens.push({ type: "STRING", value: str });
      continue;
    }

    // Palavra (tudo que não é espaço, chave, aspas ou `=`)
    if (ch !== " " && ch !== "\t" && ch !== "\n" && ch !== "\r") {
      let word = "";
      while (
        i < len &&
        cleaned[i] !== " " &&
        cleaned[i] !== "\t" &&
        cleaned[i] !== "\n" &&
        cleaned[i] !== "\r" &&
        cleaned[i] !== "{" &&
        cleaned[i] !== "}" &&
        cleaned[i] !== "=" &&
        cleaned[i] !== '"'
      ) {
        word += cleaned[i++];
      }
      if (word) {
        tokens.push({ type: "STRING", value: word });
      }
      continue;
    }

    i++; // caractere inesperado — pular
  }

  tokens.push({ type: "EOF", value: "" });
  return tokens;
}

function coerce(token: string): string | number | boolean {
  if (token === "yes") return true;
  if (token === "no") return false;

  const num = Number(token);
  if (!isNaN(num) && token.trim() !== "") return num;

  return token;
}

interface ParseState {
  tokens: Token[];
  pos: number;
}

function peek(state: ParseState): Token {
  return state.tokens[state.pos];
}

function consume(state: ParseState): Token {
  return state.tokens[state.pos++];
}

function parseObject(state: ParseState): ClausewitzObject {
  const obj: ClausewitzObject = {};

  while (true) {
    const tok = peek(state);

    if (tok.type === "EOF" || tok.type === "RBRACE") {
      break;
    }

    if (tok.type !== "STRING") {
      // Token inesperado — pular
      consume(state);
      continue;
    }

    const key = consume(state).value; // nome da chave

    // Verificar se o próximo token é `=`
    if (peek(state).type !== "EQUALS") {
      // Lista de valores sem chave explícita (ex: sea_starts = { 1 2 3 })
      // Tratamos como valor avulso — não deve acontecer no nível raiz,
      // mas pode acontecer dentro de blocos.
      const val = coerce(key);
      appendValue(obj, "__values__", val);
      continue;
    }

    consume(state); // consumir `=`

    const value = parseValue(state);
    appendValue(obj, key, value);
  }

  return obj;
}

function parseValue(state: ParseState): ClausewitzValue {
  const tok = peek(state);

  if (tok.type === "LBRACE") {
    consume(state); // consumir `{`

    // Decidir se é um objeto ou um array de valores
    // Heurística: se o primeiro token dentro das chaves for seguido de `=`,
    // é um objeto. Caso contrário, é um array de valores escalares.
    // const saved = state.pos;
    const first = peek(state);

    if (first.type === "STRING") {
      const second = state.tokens[state.pos + 1];
      if (second && second.type === "EQUALS") {
        // É um objeto
        const obj = parseObject(state);
        if (peek(state).type === "RBRACE") consume(state); // consumir `}`
        return obj;
      }
    }

    if (first.type === "RBRACE") {
      // Bloco vazio {}
      consume(state);
      return {};
    }

    // É uma lista de valores escalares
    const arr: ClausewitzValue[] = [];
    while (peek(state).type !== "RBRACE" && peek(state).type !== "EOF") {
      const item = peek(state);
      if (item.type === "STRING") {
        arr.push(coerce(consume(state).value));
      } else if (item.type === "LBRACE") {
        // Lista de objetos aninhados
        consume(state); // {
        const nested = parseObject(state);
        if (peek(state).type === "RBRACE") consume(state); // }
        arr.push(nested);
      } else {
        consume(state); // pular token inesperado
      }
    }

    if (peek(state).type === "RBRACE") consume(state); // consumir `}`
    return arr;
  }

  if (tok.type === "STRING") {
    return coerce(consume(state).value);
  }

  // Valor inesperado
  consume(state);
  return "";
}

function appendValue(obj: ClausewitzObject, key: string, value: ClausewitzValue): void {
  if (key in obj) {
    const existing = obj[key];
    if (Array.isArray(existing)) {
      (existing as ClausewitzValue[]).push(value);
    } else {
      obj[key] = [existing, value];
    }
  } else {
    obj[key] = value;
  }
}

export function parseClausewitz(text: string): ClausewitzObject {
  const tokens = tokenize(text);
  const state: ParseState = { tokens, pos: 0 };
  return parseObject(state);
}

export function getString(
  obj: ClausewitzObject,
  key: string
): string | undefined {
  const val = obj[key];
  return typeof val === "string" ? val : undefined;
}

/** Extrai um valor numérico. Retorna undefined se não for number. */
export function getNumber(
  obj: ClausewitzObject,
  key: string
): number | undefined {
  const val = obj[key];
  return typeof val === "number" ? val : undefined;
}

/** Extrai um boolean. Retorna undefined se não for boolean. */
export function getBoolean(
  obj: ClausewitzObject,
  key: string
): boolean | undefined {
  const val = obj[key];
  return typeof val === "boolean" ? val : undefined;
}

/** Extrai um array de números (ex: listas de IDs de províncias). */
export function getNumberArray(
  obj: ClausewitzObject,
  key: string
): number[] {
  const val = obj[key];
  if (!Array.isArray(val)) return [];
  return val.filter((v): v is number => typeof v === "number");
}

/** Extrai um sub-objeto. Retorna {} se não for objeto. */
export function getObject(
  obj: ClausewitzObject,
  key: string
): ClausewitzObject {
  const val = obj[key];
  if (val && typeof val === "object" && !Array.isArray(val)) {
    return val as ClausewitzObject;
  }
  return {};
}
