import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  inject,
  PLATFORM_ID,
  NgZone,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { provideIcons } from '@ng-icons/core';
import { lucideArrowUpRight } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmIconImports } from '@spartan-ng/helm/icon';
import { SocialSidebar } from '../../../shared/components/social-sidebar/social-sidebar';
import { ScrollIndicatorComponent } from '../../../shared/components/scroll-indicator/scroll-indicator.component';

import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [HlmButtonImports, HlmIconImports, SocialSidebar, ScrollIndicatorComponent],
  templateUrl: './hero.html',
  providers: [
    provideIcons({
      lucideArrowUpRight,
    }),
  ],
  host: {
    class: 'block w-full h-screen overflow-hidden',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Hero implements AfterViewInit, OnDestroy {
  @ViewChild('canvasContainer') canvasContainer!: ElementRef<HTMLDivElement>;

  private platformId = inject(PLATFORM_ID);
  private ngZone = inject(NgZone);
  
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private particles!: THREE.Points;
  private animationId: number | null = null;
  private mouseX = 0;
  private mouseY = 0;

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.initThreeJs();
      this.initAnimations();
    }
  }

  ngOnDestroy() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
    if (this.particles) {
      this.particles.geometry.dispose();
      (this.particles.material as THREE.Material).dispose();
    }
  }

  private initThreeJs() {
    const container = this.canvasContainer.nativeElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.camera.position.z = 4;
    
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(this.renderer.domElement);

    // Particles
    const particlesGeometry = new THREE.BufferGeometry();
    const count = 400;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i+=3) {
        // Random position in a sphere
        // Use higher power to bias particles toward outer shell (fewer in center)
        // minRadius creates a hollow center, power of 0.2 further biases toward outer edge
        const minRadius = 0.6; // Minimum radius - creates hollow center
        const maxRadius = 2.0;
        const r = minRadius + (maxRadius - minRadius) * Math.pow(Math.random(), 0.2);
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos(2 * Math.random() - 1);
        
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);

        positions[i] = x;
        positions[i+1] = y;
        positions[i+2] = z;

        // Color variation with Gradient (Pink to Cyan)
        // Pink: 1, 0, 1 (Magenta-ish)
        // Cyan: 0, 1, 1
        
        // Normalize x from roughly -1.8 to 1.8 to 0-1 range for blending
        const mix = (x / 2.0 + 1) / 2;
        const clampedMix = Math.max(0, Math.min(1, mix));

        // Base colors
        const color1 = new THREE.Color('#3185FF'); // Pink
        const color2 = new THREE.Color('#FC413E'); // Blue

        // Lerp
        const color = color1.clone().lerp(color2, clampedMix);

        colors[i] = color.r;
        colors[i+1] = color.g;
        colors[i+2] = color.b;

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
        const outerRadius = 15; // Slightly less than 16 to avoid clipping
        const innerRadius = 4;  // Sharpness of the star

        for(let i = 0; i < 4; i++) {
            // Outer point
            const angle = (i * Math.PI) / 2;
            if (i === 0) ctx.moveTo(cx + Math.cos(angle) * outerRadius, cy + Math.sin(angle) * outerRadius);
            else ctx.lineTo(cx + Math.cos(angle) * outerRadius, cy + Math.sin(angle) * outerRadius);
            
            // Inner point
            const nextAngle = angle + (Math.PI / 4); 
            ctx.lineTo(cx + Math.cos(nextAngle) * innerRadius, cy + Math.sin(nextAngle) * innerRadius);
        }
        ctx.closePath();
        
        ctx.fillStyle = '#ffffff';
        ctx.fill();
    }
    const circleTexture = new THREE.CanvasTexture(canvas);

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.1, // Increased size
      map: circleTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
      alphaTest: 0.5 // Discard black/transparent pixels
    });

    this.particles = new THREE.Points(particlesGeometry, particlesMaterial);
    this.scene.add(this.particles);

    this.ngZone.runOutsideAngular(() => {
      const animate = (time: number) => {
        this.animationId = requestAnimationFrame(animate);
        
        const t = time * 0.0005;
        // Rotate the entire cloud
        this.particles.rotation.y = t * 0.2;
        this.particles.rotation.x = t * 0.05;

        // Gentle mouse parallax
        // Lerp would be smoother but direct mapping is fine for simple effect
        this.particles.rotation.x += this.mouseY * 0.05;
        this.particles.rotation.y += this.mouseX * 0.05;

        this.renderer.render(this.scene, this.camera);
      };
      animate(0);
    });

    // Handle resize
    window.addEventListener('resize', () => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      this.camera.aspect = newWidth / newHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(newWidth, newHeight);
    });
    
    // Track mouse
    window.addEventListener('mousemove', (event) => {
        this.mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    });
  }

  private initAnimations() {
    gsap.to('.hero-text-reveal', {
      y: 0,
      opacity: 1,
      duration: 1.5,
      stagger: 0.2,
      ease: 'power4.out',
    });
    
    gsap.to(this.canvasContainer.nativeElement, {
        scale: 1,
        opacity: 1,
        duration: 2,
        ease: 'power2.out'
    });
  }
}
