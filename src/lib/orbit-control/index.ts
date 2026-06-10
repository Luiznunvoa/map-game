// orbit-control.ts

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

export class OrbitControl {
  private radius: number;
  private theta: number = 0;
  private phi: number = Math.PI / 2;

  private readonly minRadius = 1.5;
  private readonly maxRadius = 15;
  private readonly minPhi = 0.05;
  private readonly maxPhi = Math.PI - 0.05;
  private readonly zoomSpeed = 0.002;
  private readonly orbitSpeed = 0.03;

  private handleWheel: (e: WheelEvent) => void;

  constructor(initialRadius = 5) {
    this.radius = initialRadius;

    this.handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      this.radius += e.deltaY * this.zoomSpeed;
      this.radius = Math.max(this.minRadius, Math.min(this.maxRadius, this.radius));
    };

    window.addEventListener('wheel', this.handleWheel, { passive: false });
  }

  public updatePosition(keys: KeyControls, multiplier: number = 1): Position3D {
    const speed = this.orbitSpeed * multiplier;

    if (keys.a) this.theta -= speed;
    if (keys.d) this.theta += speed;
    if (keys.w) this.phi -= speed;
    if (keys.s) this.phi += speed;

    this.phi = Math.max(this.minPhi, Math.min(this.maxPhi, this.phi));

    const { radius: r, theta, phi } = this;
    return {
      x: r * Math.sin(phi) * Math.sin(theta),
      y: r * Math.cos(phi),
      z: r * Math.sin(phi) * Math.cos(theta),
    };
  }

  public dispose(): void {
    window.removeEventListener('wheel', this.handleWheel);
  }
}
