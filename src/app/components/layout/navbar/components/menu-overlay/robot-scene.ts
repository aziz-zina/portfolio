import { NgZone } from '@angular/core';
import type * as THREE from 'three';
import type { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class RobotScene {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private robot!: THREE.Group;
  private animationId: number | null = null;
  private targetRotationX = 0;
  private targetRotationY = 0;
  private currentRotationX = 0;
  private currentRotationY = 0;
  private resizeListener: () => void;
  private mouseMoveListener: (event: MouseEvent) => void;
  private gltfLoader!: GLTFLoader;

  constructor(
    private container: HTMLDivElement,
    private ngZone: NgZone,
    private THREE: typeof import('three'),
    private GLTFLoaderClass: typeof GLTFLoader,
    private onLoaded?: () => void
  ) {
    this.resizeListener = this.onResize.bind(this);
    this.mouseMoveListener = this.onMouseMove.bind(this);
    this.init();
  }

  private init() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.scene = new this.THREE.Scene();

    this.camera = new this.THREE.PerspectiveCamera(35, width / height, 0.1, 1000);
    this.camera.position.set(0, 0, 8);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new this.THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = this.THREE.SRGBColorSpace;
    this.renderer.toneMapping = this.THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.container.appendChild(this.renderer.domElement);

    this.gltfLoader = new this.GLTFLoaderClass();
    
    this.loadRobotModel();
    this.addLights();
    this.startAnimation();
    this.addEventListeners();
  }

  private loadRobotModel() {
    // Create placeholder group while loading
    this.robot = new this.THREE.Group();
    this.scene.add(this.robot);

    this.gltfLoader.load(
      '/robot_2.0.glb',
      (gltf: GLTF) => {
        console.log('Robot model loaded successfully!');
        
        const model = gltf.scene;
        
        // Get original bounding box
        const box = new this.THREE.Box3().setFromObject(model);
        const size = box.getSize(new this.THREE.Vector3());
        const center = box.getCenter(new this.THREE.Vector3());
        
        console.log('Model size:', size.x, size.y, size.z);
        console.log('Model center:', center.x, center.y, center.z);
        
        // Scale to fit nicely in view (target ~2.5 units)
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2.5 / maxDim;
        
        // Apply scale first
        model.scale.setScalar(scale);
        
        // Update the model's matrix
        model.updateMatrixWorld(true);
        
        // Recalculate bounding box after scaling
        const scaledBox = new this.THREE.Box3().setFromObject(model);
        const scaledCenter = scaledBox.getCenter(new this.THREE.Vector3());
        
        console.log('Scaled center:', scaledCenter.x, scaledCenter.y, scaledCenter.z);
        
        // Position model so its center is at origin
        model.position.set(-scaledCenter.x, -scaledCenter.y, -scaledCenter.z);
        
        // Enhance emissive materials for eyes (if any exist in the model)
        model.traverse((child) => {
          if (child instanceof this.THREE.Mesh && child.material) {
            const material = child.material as THREE.MeshStandardMaterial;
            // Boost emissive intensity for any glowing parts
            if (material.emissive && material.emissiveIntensity !== undefined) {
              material.emissiveIntensity = Math.max(material.emissiveIntensity, 2);
            }
          }
        });
        
        console.log('Applied scale:', scale);
        
        this.robot.add(model);
        
        // Signal loading complete
        if (this.onLoaded) {
          this.onLoaded();
        }
      },
      (progress) => {
        // Loading progress
        if (progress.total > 0) {
          console.log('Loading robot:', (progress.loaded / progress.total * 100).toFixed(0) + '%');
        }
      },
      (error) => {
        console.error('Error loading robot model:', error);
        // Create fallback sphere on error
        this.createFallbackRobot();
      }
    );
  }

  private createFallbackRobot() {
    const geometry = new this.THREE.SphereGeometry(0.5, 32, 32);
    const material = new this.THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.3,
      roughness: 0.4
    });
    const sphere = new this.THREE.Mesh(geometry, material);
    this.robot.add(sphere);
  }

  private addLights() {
    const THREE = this.THREE;

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    // Main directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(3, 3, 5);
    this.scene.add(directionalLight);

    // Rim light for depth
    const rimLight = new THREE.DirectionalLight(0x00ffff, 0.5);
    rimLight.position.set(-3, 2, -3);
    this.scene.add(rimLight);

    // Bottom fill light
    const fillLight = new THREE.DirectionalLight(0x4444ff, 0.3);
    fillLight.position.set(0, -3, 2);
    this.scene.add(fillLight);
  }

  private startAnimation() {
    this.ngZone.runOutsideAngular(() => {
      const animate = () => {
        this.animationId = requestAnimationFrame(animate);

        if (this.robot) {
          // Smooth interpolation for head rotation
          const lerpFactor = 0.08;
          this.currentRotationX += (this.targetRotationX - this.currentRotationX) * lerpFactor;
          this.currentRotationY += (this.targetRotationY - this.currentRotationY) * lerpFactor;

          this.robot.rotation.x = this.currentRotationX;
          this.robot.rotation.y = this.currentRotationY;

          // Subtle idle animation
          const time = Date.now() * 0.001;
          this.robot.position.y = Math.sin(time * 1.5) * 0.05;
        }

        this.renderer.render(this.scene, this.camera);
      };
      animate();
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
    // Calculate normalized mouse position (-1 to 1)
    const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

    // Set target rotation (limited range for natural look)
    this.targetRotationY = mouseX * 0.5; // Max ~30 degrees left/right
    this.targetRotationX = -mouseY * 0.25; // Max ~15 degrees up/down
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

    // Dispose model resources
    if (this.robot) {
      this.robot.traverse((object) => {
        if (object instanceof this.THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach(m => m.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
    }
  }
}
