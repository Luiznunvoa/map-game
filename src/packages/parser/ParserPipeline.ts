import type { FileLoader } from "./io.js";
import type { ParsedMapData } from "./types.js";
import { parseBmp } from "./BmpParser.js";
import { parseDefinitionCsv, parseAdjacenciesCsv } from "./CsvParser.js";
import {
  parseDefaultMap,
  parseTerrainTxt,
  parseRegionTxt,
  parseContinentTxt,
  parseClimateTxt,
} from "./MapFileParsers.js";

export interface PipelineOptions {
  onProgress?: (progress: number, stage: string) => void;
}

// type StageResult<T> =
//   | { ok: true; data: T }
//   | { ok: false; error: string };


export async function runParserPipeline(
  loader: FileLoader,
  options: PipelineOptions = {}
): Promise<ParsedMapData> {
  const { onProgress } = options;

  const report = (progress: number, stage: string) => {
    onProgress?.(progress, stage);
    console.info(`[Pipeline] ${Math.round(progress * 100)}% — ${stage}`);
  };

  // Etapa 1: definition.csv
  report(0.05, "Lendo definition.csv…");
  const definitionText = await loader.readText("definition.csv");
  const { byColor: provinces, byId: provinceById } = parseDefinitionCsv(definitionText);

  // Etapa 2: default.map 
  report(0.10, "Lendo default.map…");
  const defaultMapText = await loader.readText("default.map");
  const defaultMap = parseDefaultMap(defaultMapText);

  // Etapa 3: provinces.bmp
  report(0.15, "Lendo provinces.bmp… (pode demorar)");
  const provincesBmpBytes = await loader.readBytes(defaultMap.files.provinces);
  report(0.45, "Decodificando provinces.bmp…");
  const provincesBitmap = await parseBmp(provincesBmpBytes, defaultMap.files.provinces);
  report(0.60, `provinces.bmp decodificado: ${provincesBitmap.width}×${provincesBitmap.height}`);

  // Etapa 4: terrain.bmp
  let terrainBitmap = { width: 0, height: 0, data: new Uint8Array(0) };
  if (loader.has(defaultMap.files.terrain)) {
    report(0.62, "Lendo terrain.bmp…");
    const terrainBmpBytes = await loader.readBytes(defaultMap.files.terrain);
    report(0.72, "Decodificando terrain.bmp…");
    // FIX: Isso aqui também
    terrainBitmap = await parseBmp(terrainBmpBytes, defaultMap.files.terrain);
  } else {
    console.warn("[Pipeline] terrain.bmp não encontrado — terreno não será calculado por pixel");
  }

  // Etapa 5: adjacencies.csv
  report(0.75, "Lendo adjacencies.csv…");
  let adjacencies: ParsedMapData["adjacencies"] = [];
  if (loader.has("adjacencies.csv")) {
    const adjText = await loader.readText("adjacencies.csv");
    adjacencies = parseAdjacenciesCsv(adjText);
  } else {
    console.warn("[Pipeline] adjacencies.csv não encontrado — adjacências especiais ignoradas");
  }

  // Etapa 6: terrain.txt
  report(0.80, "Lendo terrain.txt…");
  let terrain: ParsedMapData["terrain"] = {
    paletteSize: 64,
    categories: new Map(),
    overrides: new Map(),
  };
  if (loader.has(defaultMap.files.terrainDefinition)) {
    const terrainText = await loader.readText(defaultMap.files.terrainDefinition);
    terrain = parseTerrainTxt(terrainText);
  }

  // Etapa 7: region.txt
  report(0.85, "Lendo region.txt…");
  let regions: ParsedMapData["regions"] = new Map();
  if (loader.has("region.txt")) {
    const regionText = await loader.readText("region.txt");
    regions = parseRegionTxt(regionText);
  }

  // Etapa 8: continent.txt
  report(0.90, "Lendo continent.txt…");
  let continents: ParsedMapData["continents"] = new Map();
  if (loader.has("continent.txt")) {
    const continentText = await loader.readText("continent.txt");
    continents = parseContinentTxt(continentText);
  }

  // Etapa 9: climate.txt
  report(0.95, "Lendo climate.txt…");
  let climate: ParsedMapData["climate"] = {
    categories: new Map(),
    provinceClimate: new Map(),
  };
  if (loader.has("climate.txt")) {
    const climateText = await loader.readText("climate.txt");
    climate = parseClimateTxt(climateText);
  }

  report(1.0, "Parsing concluído!");

  const result: ParsedMapData = {
    defaultMap,
    provinces,
    provinceById,
    adjacencies,
    terrain,
    regions,
    continents,
    climate,
    provincesBitmap,
    terrainBitmap,
  };

  logSummary(result);
  return result;
}

function logSummary(data: ParsedMapData): void {
  const { provincesBitmap, provinceById, defaultMap, adjacencies, regions, continents } = data;
  console.group("[Pipeline] Resumo do parsing:");
  console.log(`  Bitmap: ${provincesBitmap.width}×${provincesBitmap.height} px`);
  console.log(`  Províncias definidas: ${provinceById.size}`);
  console.log(`  Províncias marítimas (sea_starts): ${defaultMap.seaStarts.size}`);
  console.log(`  Adjacências especiais: ${adjacencies.length}`);
  console.log(`  Regiões: ${regions.size}`);
  console.log(`  Continentes: ${continents.size}`);
  console.groupEnd();
}
