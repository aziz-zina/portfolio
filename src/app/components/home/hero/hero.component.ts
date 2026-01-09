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
import {
  lucideArrowUpRight,
  lucideGithub,
  lucideLinkedin,
  lucideMessageCircle,
  lucideChevronDown,
} from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmIconImports } from '@spartan-ng/helm/icon';
import * as THREE from 'three';
import { gsap } from 'gsap';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [HlmButtonImports, HlmIconImports],
  templateUrl: './hero.html',
  providers: [
    provideIcons({
      lucideArrowUpRight,
      lucideGithub,
      lucideLinkedin,
      lucideMessageCircle,
      lucideChevronDown,
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
  private blob!: THREE.Mesh;
  private animationId: number | null = null;

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
    if (this.blob) {
      this.blob.geometry.dispose();
      if (Array.isArray(this.blob.material)) {
        this.blob.material.forEach(m => m.dispose());
      } else {
        (this.blob.material as THREE.Material).dispose();
      }
    }
  }

  private initThreeJs() {
    const container = this.canvasContainer.nativeElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.camera.position.z = 4.5;
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    container.appendChild(this.renderer.domElement);
    const geometry = new THREE.IcosahedronGeometry(2, 30);
    const originalPositions = geometry.attributes['position'].array.slice();
    const material = new THREE.MeshPhysicalMaterial({
      roughness: 0.15,
      metalness: 0.1,
      transmission: 1,
      thickness: 2,
      ior: 1.45,
      reflectivity: 0.9,
      iridescence: 1,
      iridescenceIOR: 1.3,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      color: 0xffffff,
      side: THREE.DoubleSide,
    });

    this.blob = new THREE.Mesh(geometry, material);
    this.scene.add(this.blob);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 2);
    mainLight.position.set(10, 10, 10);
    this.scene.add(mainLight);
    
    const pinkLight = new THREE.PointLight(0xff00ff, 3, 20);
    pinkLight.position.set(-5, 5, 5);
    this.scene.add(pinkLight);

    const blueLight = new THREE.PointLight(0x00ffff, 3, 20);
    blueLight.position.set(5, -5, 5);
    this.scene.add(blueLight);

    this.ngZone.runOutsideAngular(() => {
      const animate = (time: number) => {
        this.animationId = requestAnimationFrame(animate);
        
        const t = time * 0.001;
        this.blob.rotation.x = t * 0.1;
        this.blob.rotation.y = t * 0.15;
        const positionAttribute = geometry.attributes['position'];
        const positions = positionAttribute.array as Float32Array;
        
        for (let i = 0; i < positions.length; i += 3) {
          const x = originalPositions[i];
          const y = originalPositions[i + 1];
          const z = originalPositions[i + 2];
          
          const vector = new THREE.Vector3(x, y, z);
          const length = vector.length();
          const dir = vector.normalize();
          
          const displacement = 
            Math.sin(x * 1.5 + t * 1.2) * 0.3 + 
            Math.cos(y * 1.5 + t * 1.5) * 0.3 + 
            Math.sin(z * 1.5 + t * 0.8) * 0.3;
            
          const scale = 1 + displacement * 0.2;
          
          positions[i] = dir.x * length * scale;
          positions[i + 1] = dir.y * length * scale;
          positions[i + 2] = dir.z * length * scale;
        }
        
        positionAttribute.needsUpdate = true;
        geometry.computeVertexNormals();

        this.renderer.render(this.scene, this.camera);
      };
      animate(0);
    });

    window.addEventListener('resize', () => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      this.camera.aspect = newWidth / newHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(newWidth, newHeight);
    });
    
    window.addEventListener('mousemove', (event) => {
        const x = (event.clientX / window.innerWidth) * 2 - 1;
        const y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        gsap.to(this.blob.rotation, {
            x: this.blob.rotation.x + y * 0.2,
            y: this.blob.rotation.y + x * 0.2,
            duration: 1.5,
            ease: 'power2.out'
        });
    });
  }

  private initAnimations() {
    gsap.from('.hero-text-reveal', {
      y: 100,
      opacity: 0,
      duration: 1.5,
      stagger: 0.2,
      ease: 'power4.out',
      delay: 0.5
    });
    
    gsap.from(this.canvasContainer.nativeElement, {
        scale: 0.8,
        opacity: 0,
        duration: 2,
        ease: 'power2.out'
    });
  }
}
