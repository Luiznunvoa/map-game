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
uniform sampler2D u_riverTexture;
uniform int       u_hasRivers;
uniform int       u_showRivers;
uniform int       u_showBorders;

in vec2 vUv;
in vec3 vNormal;
in vec3 vViewPosition;

out vec4 fragColor;

int getProvinceId(vec2 uv) {
  vec4 raw = texture(u_idTexture, uv);
  return int(raw.r * 255.0 + 0.5) + int(raw.g * 255.0 + 0.5) * 256;
}

bool isSeaId(int id) {
  float paletteU = (float(id) + 0.5) / u_paletteSize;
  return texture(u_palette, vec2(paletteU, 0.5)).a < 0.5;
}

void main() {
  // Linha listrada nos limites do mapa (polos) - alternando entre vermelho escuro e cinza claro
  float borderThickness = 1.5 * (abs(dFdx(vUv.y)) + abs(dFdy(vUv.y)));
  if (abs(vUv.y - u_vMin) < borderThickness || abs(vUv.y - u_vMax) < borderThickness) {
    vec3 N = normalize(vNormal);
    vec3 L = normalize(u_lightDir);
    float NdotL = max(dot(N, L), 0.0);
    float diffuse = u_ambientStrength + (1.0 - u_ambientStrength) * NdotL;
    
    // Cria 120 segmentos ao redor do globo
    float stripe = step(0.5, fract(vUv.x * 120.0));
    vec3 lineColor = mix(vec3(0.5, 0.0, 0.0), vec3(0.7, 0.7, 0.7), stripe);
    
    fragColor = vec4(lineColor * diffuse, 1.0);
    return;
  }

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

  // Decodificar ID da província
  int id = getProvinceId(uv);

  // Lookup da paleta
  float paletteU = (float(id) + 0.5) / u_paletteSize;
  vec4 paletteSample = texture(u_palette, vec2(paletteU, 0.5));
  vec3 color = paletteSample.rgb;
  bool isSeaProvince = (paletteSample.a < 0.5);

  // Verificar se é borda
  bool isSeaBorder = false;
  bool isLandBorder = false;
  bool isStateBorder = false;
  
  // Checar vizinhos usando derivadas de tela para manter a linha fina (1 pixel)
  vec2 offsets[4];
  offsets[0] = dFdx(uv) * 0.75;
  offsets[1] = -dFdx(uv) * 0.75;
  offsets[2] = dFdy(uv) * 0.75;
  offsets[3] = -dFdy(uv) * 0.75;
  
  for (int i = 0; i < 4; i++) {
    int neighborId = getProvinceId(uv + offsets[i]);
    if (neighborId != id) {
      bool neighborIsSea = isSeaId(neighborId);
      if (isSeaProvince && neighborIsSea) {
        isSeaBorder = true;
      } else if (!isSeaProvince && !neighborIsSea) {
        isLandBorder = true;
        
        float nU = (float(neighborId) + 0.5) / u_paletteSize;
        vec3 nColor = texture(u_palette, vec2(nU, 0.5)).rgb;
        if (distance(nColor, color) > 0.01) {
          isStateBorder = true;
        }
      }
    }
  }

  // Highlight de seleção (província específica)
  if (id == u_selectedId && u_selectedId > 0) {
    float pulse = 0.5 + 0.5 * sin(u_time * 3.0);
    color = mix(color, u_highlightColor, 0.55 + 0.15 * pulse);
  }

  // Aplicar linha azul claro suave se for borda marítima e a câmera estiver perto
  if (isSeaBorder) {
    float dist = length(vViewPosition);
    float borderOpacity = smoothstep(2.2, 1.3, dist);
    color = mix(color, vec3(0.5, 0.8, 1.0), borderOpacity * 0.75);
  }

  // Aplicar bordas diferentes baseado no mapa de cores
  if (isStateBorder) {
    // Borda escura e forte delimitando fronteiras de cores diferentes (países)
    color = mix(color, vec3(0.0, 0.0, 0.0), 0.5);
  } else if (isLandBorder && u_showBorders == 1) {
    // Borda adaptativa para províncias dentro do mesmo país:
    // países claros recebem borda escura, países escuros recebem borda clara
    float dist = length(vViewPosition);
    float borderOpacity = smoothstep(2.2, 1.3, dist);
    float luminance = dot(color, vec3(0.299, 0.587, 0.114));
    vec3 borderColor = luminance > 0.5 ? vec3(0.0, 0.0, 0.0) : vec3(1.0, 1.0, 1.0);
    color = mix(color, borderColor, borderOpacity * 0.3);
  }

  // Aplicar rios por CIMA das fronteiras, usando contraste dinâmico e sub-pixel (mais finos)
  if (u_hasRivers == 1 && u_showRivers == 1) {
    vec4 riverPixel = texture(u_riverTexture, uv);
    // Como voltamos para LinearFilter, o alpha decai nas bordas. 
    // Consideramos apenas pixels com um mínimo de presença de rio.
    if (riverPixel.a > 0.1) {
      float dist = length(vViewPosition);
      // Os rios somem quando afasta
      float riverOpacity = smoothstep(1.5, 0.8, dist);
      
      // Afinamento (Thinning): O alpha central é ~0.78. 
      // Com smoothstep cortamos a borda translúcida e deixamos a linha mais fina.
      float thinMask = smoothstep(0.7, 0.7, riverPixel.a);
      
      // Contraste baseado na cor atual (província + possivelmente a borda)
      float luminance = dot(color, vec3(0.299, 0.587, 0.114));
      // Se a cor por baixo for clara, usamos um azul bem escuro; se for escura, um azul bem claro
      vec3 dynamicRiverColor = luminance > 0.5 ? vec3(0.08, 0.18, 0.35) : vec3(0.45, 0.7, 0.95);
      
      color = mix(color, dynamicRiverColor, riverOpacity * thinMask * 0.95);
    }
  }

  // Iluminação Lambertian simples
  vec3 N = normalize(vNormal);
  vec3 L = normalize(u_lightDir);
  float NdotL = max(dot(N, L), 0.0);
  float diffuse = u_ambientStrength + (1.0 - u_ambientStrength) * NdotL;
  color *= diffuse;

  fragColor = vec4(color, 1.0);
}
