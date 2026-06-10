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