export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface KeyControls {
  w: boolean;
  a: boolean;
  s: boolean;
  d: boolean;
}

export interface InputState {
  keys: KeyControls;
  dragDeltaX: number; // Movimento do mouse no eixo X quando clicado
  dragDeltaY: number; // Movimento do mouse no eixo Y quando clicado
  zoomDelta: number;  // Movimento da roda do mouse (scroll)
}

export class OrbitControl {
  private radius: number;
  private theta: number = 0;
  private phi: number = Math.PI / 2;

  private readonly minRadius = 1.5;
  private readonly maxRadius = 15;
  private readonly minPhi = 0.05;
  private readonly maxPhi = Math.PI - 0.05;
  
  // Velocidades ajustadas para diferentes tipos de input
  private readonly zoomSpeed = 0.002;
  private readonly keyOrbitSpeed = 0.03;
  private readonly mouseOrbitSpeed = 0.005;

  constructor(initialRadius = 5) {
    this.radius = initialRadius;
  }

  public updatePosition(input: InputState, multiplier: number = 1): Position3D {
    const keySpeed = this.keyOrbitSpeed * multiplier;

    // 1. Rotação via Teclado
    if (input.keys.a) this.theta -= keySpeed;
    if (input.keys.d) this.theta += keySpeed;
    if (input.keys.w) this.phi -= keySpeed;
    if (input.keys.s) this.phi += keySpeed;

    // 2. Rotação via Mouse (Drag)
    if (input.dragDeltaX !== 0) {
      this.theta -= input.dragDeltaX * this.mouseOrbitSpeed;
    }
    if (input.dragDeltaY !== 0) {
      this.phi -= input.dragDeltaY * this.mouseOrbitSpeed;
    }

    // 3. Zoom via Mouse (Wheel)
    if (input.zoomDelta !== 0) {
      this.radius += input.zoomDelta * this.zoomSpeed;
      this.radius = Math.max(this.minRadius, Math.min(this.maxRadius, this.radius));
    }

    // Limitar o ângulo polar (phi) para a câmera não dar "cambalhota"
    this.phi = Math.max(this.minPhi, Math.min(this.maxPhi, this.phi));

    // Calcular a nova posição
    const { radius: r, theta, phi } = this;
    return {
      x: r * Math.sin(phi) * Math.sin(theta),
      y: r * Math.cos(phi),
      z: r * Math.sin(phi) * Math.cos(theta),
    };
  }
}
