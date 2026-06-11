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
          break;
        } else if (!isSeaProvince && !neighborIsSea) {
          isLandBorder = true;
          break;
        }
      }
    }

    // Highlight de seleção
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

    // Aplicar linha cinza suave se for borda terrestre e a câmera estiver perto
    if (isLandBorder) {
      float dist = length(vViewPosition);
      float borderOpacity = smoothstep(2.2, 1.3, dist);
      color = mix(color, vec3(1, 1, 1), borderOpacity * 0.4);
    }

    // Iluminação Lambertian simples
    vec3 N = normalize(vNormal);
    vec3 L = normalize(u_lightDir);
    float NdotL = max(dot(N, L), 0.0);
    float diffuse = u_ambientStrength + (1.0 - u_ambientStrength) * NdotL;
    color *= diffuse;

    fragColor = vec4(color, 1.0);
  }