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
import {
  buildProvinceTextures,
  type MapColorMode,
  type NormalizedColor,
  type ProvinceTextures,
  type GlobeMapInput,
} from "./ProvinceMapTextures.js";


const VERTEX_SHADER = /* glsl */`
  out vec2 vUv;
  out vec3 vNormal;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */`
  // Nota: sem #version aqui — Three.js injeta via glslVersion: GLSL3

  uniform sampler2D u_idTexture;
  uniform sampler2D u_palette;
  uniform float     u_paletteSize;
  uniform int       u_selectedId;
  uniform vec3      u_highlightColor;
  uniform vec3      u_lightDir;
  uniform float     u_ambientStrength;
  uniform float     u_time;
  uniform float     u_vMin;
  uniform float     u_vMax;

  in vec2 vUv;
  in vec3 vNormal;

  out vec4 fragColor;

  void main() {
    // Se estiver nos polos (fora da faixa do mapa), renderiza oceano puro
    if (vUv.y < u_vMin || vUv.y > u_vMax) {
      float paletteU = 0.5 / u_paletteSize; // ID 0 (Oceano)
      vec3 color = texture(u_palette, vec2(paletteU, 0.5)).rgb;
      
      vec3 N = normalize(vNormal);
      vec3 L = normalize(u_lightDir);
      float NdotL = max(dot(N, L), 0.0);
      float diffuse = u_ambientStrength + (1.0 - u_ambientStrength) * NdotL;
      
      fragColor = vec4(color * diffuse, 1.0);
      return;
    }

    // Remapear V para a faixa do mapa
    vec2 uv = vec2(vUv.x, (vUv.y - u_vMin) / (u_vMax - u_vMin));

    // Decodificar ID da província: R = byte baixo, G = byte alto
    vec4 raw = texture(u_idTexture, uv);
    int id = int(raw.r * 255.0 + 0.5) + int(raw.g * 255.0 + 0.5) * 256;

    // Lookup da paleta
    float paletteU = (float(id) + 0.5) / u_paletteSize;
    vec3 color = texture(u_palette, vec2(paletteU, 0.5)).rgb;

    // Highlight de seleção
    if (id == u_selectedId && u_selectedId > 0) {
      float pulse = 0.5 + 0.5 * sin(u_time * 3.0);
      color = mix(color, u_highlightColor, 0.55 + 0.15 * pulse);
    }

    // Iluminação Lambertian simples
    vec3 N = normalize(vNormal);
    vec3 L = normalize(u_lightDir);
    float NdotL = max(dot(N, L), 0.0);
    float diffuse = u_ambientStrength + (1.0 - u_ambientStrength) * NdotL;
    color *= diffuse;

    fragColor = vec4(color, 1.0);
  }
`;

const ATMOSPHERE_VERT = /* glsl */`
  out vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ATMOSPHERE_FRAG = /* glsl */`
  in vec3 vNormal;
  out vec4 fragColor;
  void main() {
    float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
    fragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
  }
`;

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
