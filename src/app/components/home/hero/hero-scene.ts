import { NgZone } from '@angular/core';
import type * as THREE from 'three';

export class HeroScene {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private particles!: THREE.Points;
  private animationId: number | null = null;
  private mouseX = 0;
  private mouseY = 0;
  private resizeListener: () => void;
  private mouseMoveListener: (event: MouseEvent) => void;

  constructor(
    private container: HTMLDivElement,
    private ngZone: NgZone,
    private THREE: typeof import('three')
  ) {
    this.resizeListener = this.onResize.bind(this);
    this.mouseMoveListener = this.onMouseMove.bind(this);
    this.init();
  }

  private init() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.scene = new this.THREE.Scene();

    this.camera = new this.THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.camera.position.z = 4;

    this.renderer = new this.THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);

    this.createParticles();
    this.startAnimation();
    this.addEventListeners();
  }

  private createParticles() {
    const THREE = this.THREE;
    const particlesGeometry = new THREE.BufferGeometry();
    const count = 400;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i += 3) {
      // Random position in a sphere
      const minRadius = 0.6; // Minimum radius - creates hollow center
      const maxRadius = 2.0;
      const r = minRadius + (maxRadius - minRadius) * Math.pow(Math.random(), 0.2);
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      positions[i] = x;
      positions[i + 1] = y;
      positions[i + 2] = z;

      // Color variation with Gradient (Pink to Cyan)
      const mix = (x / 2.0 + 1) / 2;
      const clampedMix = Math.max(0, Math.min(1, mix));

      const color1 = new THREE.Color('#3185FF'); // Pink
      const color2 = new THREE.Color('#FC413E'); // Blue

      const color = color1.clone().lerp(color2, clampedMix);

      colors[i] = color.r;
      colors[i + 1] = color.g;
      colors[i + 2] = color.b;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Create a circular texture
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Draw Diamond Star
      ctx.beginPath();
      const cx = 16;
      const cy = 16;
      const outerRadius = 15;
      const innerRadius = 4;

      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2;
        if (i === 0) ctx.moveTo(cx + Math.cos(angle) * outerRadius, cy + Math.sin(angle) * outerRadius);
        else ctx.lineTo(cx + Math.cos(angle) * outerRadius, cy + Math.sin(angle) * outerRadius);

        const nextAngle = angle + (Math.PI / 4);
        ctx.lineTo(cx + Math.cos(nextAngle) * innerRadius, cy + Math.sin(nextAngle) * innerRadius);
      }
      ctx.closePath();

      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }
    const circleTexture = new THREE.CanvasTexture(canvas);

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.1,
      map: circleTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
      alphaTest: 0.5
    });

    this.particles = new THREE.Points(particlesGeometry, particlesMaterial);
    this.scene.add(this.particles);
  }

  private startAnimation() {
    this.ngZone.runOutsideAngular(() => {
      const animate = (time: number) => {
        this.animationId = requestAnimationFrame(animate);

        const t = time * 0.0005;
        this.particles.rotation.y = t * 0.2;
        this.particles.rotation.x = t * 0.05;

        this.particles.rotation.x += this.mouseY * 0.05;
        this.particles.rotation.y += this.mouseX * 0.05;

        this.renderer.render(this.scene, this.camera);
      };
      animate(0);
    });
  }

  private addEventListeners() {
    window.addEventListener('resize', this.resizeListener);
    window.addEventListener('mousemove', this.mouseMoveListener);
  }

  private onResize() {
    const newWidth = this.container.clientWidth;
    const newHeight = this.container.clientHeight;
    this.camera.aspect = newWidth / newHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(newWidth, newHeight);
  }

  private onMouseMove(event: MouseEvent) {
    this.mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  public dispose() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }

    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
    }
    if (this.mouseMoveListener) {
      window.removeEventListener('mousemove', this.mouseMoveListener);
    }

    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentNode === this.container) {
          this.container.removeChild(this.renderer.domElement);
      }
    }
    if (this.particles) {
      this.particles.geometry.dispose();
      (this.particles.material as any).dispose();
    }
  }
}
