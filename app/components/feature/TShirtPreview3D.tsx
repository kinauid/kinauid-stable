import React, { useRef, useEffect, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Icon } from "~/builder";

export interface TShirtModelProps {
  textureCanvas?: HTMLCanvasElement | null;
  canvasSource?: HTMLCanvasElement | null;
  textureVersion?: number;
  autoRotate?: boolean;
  autoRotateDefault?: boolean;
  className?: string;
}

export function TShirtPreview3D({
  textureCanvas,
  canvasSource,
  textureVersion = 0,
  autoRotate = false,
  autoRotateDefault = false,
  className = "",
}: TShirtModelProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const textureRef = useRef<THREE.CanvasTexture | null>(null);
  const meshesRef = useRef<THREE.Mesh[]>([]);

  const activeCanvas = textureCanvas || canvasSource || null;
  const [isAutoRotate, setIsAutoRotate] = useState(
    autoRotate || autoRotateDefault,
  );
  const [isWireframe, setIsWireframe] = useState(false);
  const [studioTheme, setStudioTheme] = useState<
    "studio-dark" | "clean-light" | "gradient"
  >("studio-dark");
  const [modelLoaded, setModelLoaded] = useState(false);

  // Initialize Three.js Scene, Camera, Lighting, Controls & GLTFLoader
  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof window === "undefined") return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 520;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera — tighter FOV for flattering product shot
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    camera.position.set(0, 0.1, 4.8);
    cameraRef.current = camera;

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.replaceChildren(renderer.domElement);
    rendererRef.current = renderer;

    // 4. OrbitControls — constrained for product view
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 2.2;
    controls.maxDistance = 7.5;
    controls.maxPolarAngle = Math.PI * 0.72; // don't let camera go below waist
    controls.minPolarAngle = Math.PI * 0.15; // don't go too high
    controls.target.set(0, 0.0, 0);
    controlsRef.current = controls;

    // 5. Studio Lighting — 3-point fabric lighting setup
    const ambientLight = new THREE.AmbientLight(0xfaf9f7, 0.7);
    scene.add(ambientLight);

    // Key light (top-left-front — main illumination)
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(3.5, 6.0, 5.0);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.1;
    keyLight.shadow.camera.far = 20;
    keyLight.shadow.camera.left = -4;
    keyLight.shadow.camera.right = 4;
    keyLight.shadow.camera.top = 4;
    keyLight.shadow.camera.bottom = -4;
    keyLight.shadow.bias = -0.00015;
    scene.add(keyLight);

    // Fill light (right-back — soft bounce)
    const fillLight = new THREE.DirectionalLight(0xdce8ff, 0.9);
    fillLight.position.set(-4.5, 2.5, -3.0);
    scene.add(fillLight);

    // Rim / backlight (gives fabric separation from background)
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.75);
    rimLight.position.set(0.5, 4.0, -5.5);
    scene.add(rimLight);

    // Bottom fill (prevents pitch-black underside)
    const bottomFill = new THREE.DirectionalLight(0xb0c8ff, 0.35);
    bottomFill.position.set(0, -4, 2);
    scene.add(bottomFill);

    // Hemisphere sky/ground
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 0.5);
    scene.add(hemiLight);

    // 6. Subtle ground shadow disc
    const shadowGeo = new THREE.CircleGeometry(2.0, 64);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.18,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -1.55;
    scene.add(shadowMesh);

    // 7. Load real anatomical jersey GLB
    const modelGroup = new THREE.Group();
    modelGroupRef.current = modelGroup;
    scene.add(modelGroup);

    const loader = new GLTFLoader();
    loader.load(
      "/models/tshirt.glb",
      (gltf) => {
        const loadedScene = gltf.scene || gltf.scenes?.[0];
        if (loadedScene) {
          // Auto-center & scale model
          const box = new THREE.Box3().setFromObject(loadedScene);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const targetHeight = 3.2;
          const scaleFactor = targetHeight / maxDim;

          loadedScene.scale.setScalar(scaleFactor);
          loadedScene.position.set(
            -center.x * scaleFactor,
            -center.y * scaleFactor,
            -center.z * scaleFactor,
          );

          const foundMeshes: THREE.Mesh[] = [];
          loadedScene.traverse((child: any) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              foundMeshes.push(child);

              // Fabric-look PBR material
              const mat = new THREE.MeshStandardMaterial({
                roughness: 0.82, // matte fabric
                metalness: 0.0,
                side: THREE.DoubleSide,
                color: 0xffffff,
                envMapIntensity: 0.5,
              });
              child.material = mat;
            }
          });

          meshesRef.current = foundMeshes;
          modelGroup.add(loadedScene);
          setModelLoaded(true);

          if (activeCanvas) {
            updateMeshesTexture(activeCanvas);
          }
        }
      },
      undefined,
      (error) => {
        console.warn("GLB load error:", error);
      },
    );

    // 8. Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (isAutoRotate && modelGroupRef.current) {
        modelGroupRef.current.rotation.y += 0.007;
      }
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // 9. Resize handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      if (textureRef.current) textureRef.current.dispose();
    };
  }, []);

  // Helper to update texture across all jersey meshes
  const updateMeshesTexture = useCallback((canvas: HTMLCanvasElement) => {
    if (!canvas) return;

    if (!textureRef.current) {
      const tex = new THREE.CanvasTexture(canvas);
      tex.flipY = false; // Mencegah pola/logo terbalik vertikal
      tex.colorSpace = THREE.SRGBColorSpace; // Warna cerah pantone
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = true;
      tex.needsUpdate = true;
      textureRef.current = tex;

      meshesRef.current.forEach((mesh) => {
        if (mesh.material instanceof THREE.MeshStandardMaterial) {
          mesh.material.map = tex;
          mesh.material.needsUpdate = true;
        }
      });
    } else {
      textureRef.current.image = canvas;
      textureRef.current.needsUpdate = true;
      meshesRef.current.forEach((mesh) => {
        if (mesh.material instanceof THREE.MeshStandardMaterial) {
          mesh.material.map = textureRef.current;
          mesh.material.needsUpdate = true;
        }
      });
    }
  }, []);

  // Update texture whenever canvas content changes (textureVersion bumps on every redraw)
  useEffect(() => {
    if (activeCanvas) {
      updateMeshesTexture(activeCanvas);
    }
  }, [activeCanvas, updateMeshesTexture, modelLoaded, textureVersion]);

  // Update wireframe state
  useEffect(() => {
    meshesRef.current.forEach((mesh) => {
      if (mesh.material instanceof THREE.MeshStandardMaterial) {
        mesh.material.wireframe = isWireframe;
        mesh.material.needsUpdate = true;
      }
    });
  }, [isWireframe]);

  // View Preset Camera Angles
  const setCameraView = (view: "front" | "back" | "left" | "right" | "iso") => {
    const controls = controlsRef.current;
    const camera = cameraRef.current;
    const model = modelGroupRef.current;
    if (!controls || !camera || !model) return;

    setIsAutoRotate(false);
    model.rotation.y = 0;

    if (view === "front") {
      camera.position.set(0, 0.2, 5.2);
    } else if (view === "back") {
      camera.position.set(0, 0.2, -5.2);
    } else if (view === "left") {
      camera.position.set(-5.2, 0.2, 0);
    } else if (view === "right") {
      camera.position.set(5.2, 0.2, 0);
    } else if (view === "iso") {
      camera.position.set(3.6, 2.2, 4.0);
    }
    controls.target.set(0, -0.2, 0);
    controls.update();
  };

  // Zoom control
  const handleZoom = (delta: number) => {
    const camera = cameraRef.current;
    if (!camera) return;
    const newDist = THREE.MathUtils.clamp(
      camera.position.length() + delta,
      2.5,
      8.5,
    );
    camera.position.setLength(newDist);
  };

  // Capture High-Res Render Snapshot
  const captureSnapshot = () => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (!renderer || !scene || !camera) return;

    renderer.render(scene, camera);
    const dataUrl = renderer.domElement.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `mockup-3d-jersey-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  const getBgStyle = () => {
    if (studioTheme === "studio-dark") {
      return "bg-gradient-to-b from-slate-900 via-slate-950 to-black";
    }
    if (studioTheme === "clean-light") {
      return "bg-gradient-to-b from-slate-100 via-slate-200 to-slate-300";
    }
    return "bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950";
  };

  return (
    <div
      className={`w-full h-full relative min-h-[440px] md:min-h-[520px] rounded-2xl overflow-hidden border border-slate-200/80 shadow-md flex flex-col ${getBgStyle()} ${className}`}
    >
      {/* 3D WebGL Canvas Container */}
      <div
        ref={containerRef}
        className="w-full h-[440px] md:h-[520px] cursor-grab active:cursor-grabbing"
      />

      {/* Floating Top Header */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-white text-xs shadow-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold tracking-wide text-[11px]">
            3D GLB VIEWPORT
          </span>
        </div>

        <div className="flex items-center gap-1.5 pointer-events-auto bg-black/60 backdrop-blur-md p-1 rounded-xl border border-white/10">
          <button
            type="button"
            title="Studio Dark"
            onClick={() => setStudioTheme("studio-dark")}
            className={`w-6 h-6 rounded-lg bg-slate-900 border ${studioTheme === "studio-dark" ? "border-blue-400 scale-110" : "border-white/20"}`}
          />
          <button
            type="button"
            title="Clean Light"
            onClick={() => setStudioTheme("clean-light")}
            className={`w-6 h-6 rounded-lg bg-slate-100 border ${studioTheme === "clean-light" ? "border-blue-400 scale-110" : "border-white/20"}`}
          />
          <button
            type="button"
            title="Cyber Gradient"
            onClick={() => setStudioTheme("gradient")}
            className={`w-6 h-6 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 border ${studioTheme === "gradient" ? "border-blue-400 scale-110" : "border-white/20"}`}
          />
        </div>
      </div>

      {/* Floating Left Camera Angle Presets */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 bg-black/60 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shadow-lg">
        <button
          type="button"
          onClick={() => setCameraView("front")}
          className="px-2.5 py-1.5 rounded-xl text-[10px] font-bold text-white/90 hover:bg-white/20 transition-all text-center"
        >
          Depan
        </button>
        <button
          type="button"
          onClick={() => setCameraView("back")}
          className="px-2.5 py-1.5 rounded-xl text-[10px] font-bold text-white/90 hover:bg-white/20 transition-all text-center"
        >
          Belakang
        </button>
        <button
          type="button"
          onClick={() => setCameraView("left")}
          className="px-2.5 py-1.5 rounded-xl text-[10px] font-bold text-white/90 hover:bg-white/20 transition-all text-center"
        >
          Kiri
        </button>
        <button
          type="button"
          onClick={() => setCameraView("right")}
          className="px-2.5 py-1.5 rounded-xl text-[10px] font-bold text-white/90 hover:bg-white/20 transition-all text-center"
        >
          Kanan
        </button>
        <button
          type="button"
          onClick={() => setCameraView("iso")}
          className="px-2.5 py-1.5 rounded-xl text-[10px] font-bold text-white/90 hover:bg-white/20 transition-all text-center"
        >
          3D Angle
        </button>
      </div>

      {/* Floating Bottom Toolbar: Controls & Snapshot */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2 py-1.5 rounded-xl border border-white/10 shadow-md">
          <button
            type="button"
            title="Auto Rotate 360°"
            onClick={() => setIsAutoRotate(!isAutoRotate)}
            className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
              isAutoRotate
                ? "bg-blue-600 text-white"
                : "text-white/80 hover:bg-white/10"
            }`}
          >
            {Icon("RotateCw", {
              className: `w-3.5 h-3.5 ${isAutoRotate ? "animate-spin" : ""}`,
            })}
            <span className="hidden sm:inline text-[10px]">Putar 360°</span>
          </button>
          <button
            type="button"
            title="Wireframe Mesh"
            onClick={() => setIsWireframe(!isWireframe)}
            className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
              isWireframe
                ? "bg-indigo-600 text-white"
                : "text-white/80 hover:bg-white/10"
            }`}
          >
            {Icon("Box", { className: "w-3.5 h-3.5" })}
          </button>
          <button
            type="button"
            title="Zoom In"
            onClick={() => handleZoom(-0.5)}
            className="p-1.5 rounded-lg text-white/80 hover:bg-white/10 transition-colors"
          >
            {Icon("ZoomIn", { className: "w-3.5 h-3.5" })}
          </button>
          <button
            type="button"
            title="Zoom Out"
            onClick={() => handleZoom(0.5)}
            className="p-1.5 rounded-lg text-white/80 hover:bg-white/10 transition-colors"
          >
            {Icon("ZoomOut", { className: "w-3.5 h-3.5" })}
          </button>
        </div>

        <button
          type="button"
          onClick={captureSnapshot}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-lg transition-all active:scale-95 cursor-pointer"
        >
          {Icon("Camera", { className: "w-3.5 h-3.5" })}
          <span>Download Foto 3D</span>
        </button>
      </div>
    </div>
  );
}
