import {
  AdditiveBlending,
  BackSide,
  GLSL3,
  Group,
  Mesh,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
} from "three";
import type { ProvinceId } from "../parser/index.js";
import VERTEX_SHADER from "../../shaders/globe.vert.glsl?raw"
import FRAGMENT_SHADER from "../../shaders/globe.frag.glsl?raw"
import ATMOSPHERE_VERT from "../../shaders/globe.atmosphere.vert.glsl?raw"
import ATMOSPHERE_FRAG from "../../shaders/globe.atmosphere.frag.glsl?raw"
import {
  buildProvinceTextures,
  type MapColorMode,
  type NormalizedColor,
  type ProvinceTextures,
  type GlobeMapInput,
} from "./ProvinceMapTextures.js";

export interface ProvinceGlobeConfig {
  radius?: number;
  widthSegments?: number;
  heightSegments?: number;
  initialColorMode?: MapColorMode;
  mapVMin?: number;
  mapVMax?: number;
}

export interface ProvinceGlobeResult {
  group: Group;
  textures: ProvinceTextures;
  pickProvinceAt(u: number, v: number): ProvinceId;
  selectProvince(id: ProvinceId): void;
  setColorMode(mode: MapColorMode, customColors?: Map<ProvinceId, NormalizedColor>): void;
  updateTime(time: number): void;
  dispose(): void;
}

export function createProvinceGlobe(
  data: GlobeMapInput,
  config: ProvinceGlobeConfig = {}
): ProvinceGlobeResult {
  const {
    radius = 1.0,
    widthSegments = 128,
    heightSegments = 64,
    initialColorMode = "province",
    mapVMin = 0.12,
    mapVMax = 0.80,
  } = config;

  const textures = buildProvinceTextures(data, initialColorMode);
  const { idTexture, paletteTexture, maxProvinceId, mapWidth, mapHeight, idBuffer } = textures;

  const uniforms = {
    u_idTexture:       { value: idTexture },
    u_palette:         { value: paletteTexture },
    u_paletteSize:     { value: maxProvinceId + 1 },
    u_selectedId:      { value: 0 },
    u_highlightColor:  { value: new Vector3(1.0, 0.85, 0.0) },
    u_lightDir:        { value: new Vector3(5.0, 3.0, 5.0).normalize() },
    u_ambientStrength: { value: 0.35 },
    u_time:            { value: 0.0 },
    u_vMin:            { value: mapVMin },
    u_vMax:            { value: mapVMax },
  };

  const material = new ShaderMaterial({
    glslVersion: GLSL3,
    uniforms,
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
  });

  const geometry = new SphereGeometry(radius, widthSegments, heightSegments);
  const sphereMesh = new Mesh(geometry, material);
  sphereMesh.name = "province-sphere";

  const atmosphereGeometry = new SphereGeometry(radius * 1.025, 64, 32);
  const atmosphereMaterial = new ShaderMaterial({
    glslVersion: GLSL3,
    vertexShader: ATMOSPHERE_VERT,
    fragmentShader: ATMOSPHERE_FRAG,
    blending: AdditiveBlending,
    side: BackSide,
    transparent: true,
    depthWrite: false,
  });
  const atmosphereMesh = new Mesh(atmosphereGeometry, atmosphereMaterial);
  atmosphereMesh.name = "atmosphere";

  const group = new Group();
  group.name = "province-globe";
  group.add(atmosphereMesh);
  group.add(sphereMesh);

  function pickProvinceAt(u: number, v: number): ProvinceId {
    // UV da esfera Three.js: U = 0→1 (longitude), V = 0→1 (latitude bottom-up)
    if (v < mapVMin || v > mapVMax) return 0; // Polo = oceano

    const mappedV = (v - mapVMin) / (mapVMax - mapVMin);
    
    // O bitmap é top-down, então invertemos o V mapeado
    const x = Math.floor(u * mapWidth);
    const y = Math.floor((1 - mappedV) * mapHeight); 
    const clampedX = Math.max(0, Math.min(mapWidth - 1, x));
    const clampedY = Math.max(0, Math.min(mapHeight - 1, y));
    return idBuffer[clampedY * mapWidth + clampedX] ?? 0;
  }

  function selectProvince(id: ProvinceId): void {
    uniforms.u_selectedId.value = id;
  }

  function setColorMode(
    mode: MapColorMode,
    customColors?: Map<ProvinceId, NormalizedColor>
  ): void {
    textures.updatePalette(mode, customColors);
  }

  function updateTime(time: number): void {
    uniforms.u_time.value = time;
  }

  function dispose(): void {
    geometry.dispose();
    material.dispose();
    atmosphereGeometry.dispose();
    atmosphereMaterial.dispose();
    textures.dispose();
  }

  return { group, pickProvinceAt, selectProvince, setColorMode, updateTime, textures, dispose };
}
