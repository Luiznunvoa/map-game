in vec3 vNormal;
out vec4 fragColor;

void main() {
  float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
  fragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
}
