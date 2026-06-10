export interface FileLoader {
  readText(key: string): Promise<string>;
  readBytes(key: string): Promise<Uint8Array>;
  has(key: string): boolean;
}

export function createBrowserFileLoader(files: Map<string, File>): FileLoader {
  return {
    has(key) {
      return files.has(key);
    },

    async readText(key) {
      const file = files.get(key);
      if (!file) throw new Error(`[FileLoader] Arquivo não encontrado: "${key}"`);
      return file.text();
    },

    async readBytes(key) {
      const file = files.get(key);
      if (!file) throw new Error(`[FileLoader] Arquivo não encontrado: "${key}"`);
      const buf = await file.arrayBuffer();
      return new Uint8Array(buf);
    },
  };
}

export function createFetchFileLoader(
  baseUrl: string,
  availableKeys?: string[],
): FileLoader {
  const keySet = availableKeys ? new Set(availableKeys) : null

  function url(key: string): string {
    return `${baseUrl}/${key}`
  }

  return {
    has(key) {
      return keySet ? keySet.has(key) : true
    },

    async readText(key) {
      const res = await fetch(url(key))
      if (!res.ok) {
        throw new Error(
          `[FetchFileLoader] Falha ao carregar "${key}": HTTP ${res.status} ${res.statusText}`,
        )
      }
      return res.text()
    },

    async readBytes(key) {
      const res = await fetch(url(key))
      if (!res.ok) {
        throw new Error(
          `[FetchFileLoader] Falha ao carregar "${key}": HTTP ${res.status} ${res.statusText}`,
        )
      }
      const buf = await res.arrayBuffer()
      return new Uint8Array(buf)
    },
  }
}

export const NODE_FILE_LOADER_STUB = `
// Cole este código em packages/parser/src/io/NodeFileLoader.ts
import fs from "fs";
import path from "path";
import sharp from "sharp";

export function createNodeFileLoader(baseDir: string): FileLoader {
  return {
    has(key) {
      return fs.existsSync(path.join(baseDir, key));
    },
    async readText(key) {
      return fs.readFileSync(path.join(baseDir, key), "utf-8");
    },
    async readBytes(key) {
      if (key.endsWith(".bmp")) {
        // sharp decodifica o BMP sem transformações de cor
        const { data } = await sharp(path.join(baseDir, key))
          .removeAlpha()
          .raw()
          .toBuffer({ resolveWithObject: true });
        return new Uint8Array(data.buffer);
      }
      const buf = fs.readFileSync(path.join(baseDir, key));
      return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
    },
  };
}
`;
