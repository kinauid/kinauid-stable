import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { Agent, Division } from '~/schemas/office.schema';
import { DIVISION_CONFIG, AGENT_STATUS_CONFIG } from './types';

export interface OfficeMeshBuildResult {
  floorWidth: number;
  floorDepth: number;
}

/**
 * Builds the entire 3D virtual office environment:
 * - Broken white floor slab & trim
 * - Glass perimeter railings
 * - 3D GLB models for tables, chairs, monitors, partition walls, and sitting agents
 * - Plant pots & decor
 */
export async function buildOfficeEnvironment(
  officeGroup: THREE.Group,
  agents: Agent[]
): Promise<OfficeMeshBuildResult> {
  const floorWidth = 34;
  const floorDepth = 28;

  // 1. Main Broken White Glossy Floor Slab
  const floorGeo = new THREE.BoxGeometry(floorWidth, 0.75, floorDepth);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0xfaf8f5,
    roughness: 0.32,
    metalness: 0.02,
  });
  const floorMesh = new THREE.Mesh(floorGeo, floorMat);
  floorMesh.position.y = -0.375;
  floorMesh.receiveShadow = true;
  officeGroup.add(floorMesh);

  // 2. Subtle Base Bevel / Platform Trim
  const baseGeo = new THREE.BoxGeometry(floorWidth + 0.5, 0.35, floorDepth + 0.5);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0xeeece8, roughness: 0.5 });
  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  baseMesh.position.y = -0.55;
  officeGroup.add(baseMesh);

  // 3. Floor Grid Lines (Soft warm grey)
  const gridHelper = new THREE.GridHelper(32, 32, 0xe2ddd5, 0xf0ece6);
  gridHelper.position.y = 0.01;
  officeGroup.add(gridHelper);

  // 4. Glass Perimeter Railings around the whole office
  const createGlassRailing = (x: number, z: number, w: number, d: number, h: number = 1.35) => {
    const geo = new THREE.BoxGeometry(w, h, d);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xcfd8dc,
      transparent: true,
      opacity: 0.3,
      roughness: 0.05,
      transmission: 0.9,
      thickness: 0.25,
    });
    const glass = new THREE.Mesh(geo, glassMat);
    glass.position.set(x, h / 2, z);
    glass.castShadow = true;
    glass.receiveShadow = true;
    officeGroup.add(glass);

    const capGeo = new THREE.BoxGeometry(w + (d > w ? 0.06 : 0), 0.05, d + (w > d ? 0.06 : 0));
    const capMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.8, roughness: 0.2 });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.set(x, h + 0.025, z);
    officeGroup.add(cap);
  };

  createGlassRailing(0, -floorDepth / 2 + 0.1, floorWidth - 0.4, 0.08);
  createGlassRailing(0, floorDepth / 2 - 0.1, floorWidth - 0.4, 0.08);
  createGlassRailing(-floorWidth / 2 + 0.1, 0, 0.08, floorDepth - 0.4);
  createGlassRailing(floorWidth / 2 - 0.1, 0, 0.08, floorDepth - 0.4);

  // 5. Load GLTF 3D Models
  const gltfLoader = new GLTFLoader();
  const loadGLTF = (path: string): Promise<THREE.Group> => {
    return new Promise((resolve) => {
      gltfLoader.load(
        path,
        (gltf) => {
          const model = gltf.scene || gltf.scenes[0];
          resolve(model);
        },
        undefined,
        (err) => {
          console.warn(`Could not load ${path}:`, err);
          resolve(new THREE.Group());
        }
      );
    });
  };

  try {
    const [tableModel, chairModel, manModel, monitorModel, wallModel] = await Promise.all([
      loadGLTF('/models/table.glb'),
      loadGLTF('/models/chair-desk.glb'),
      loadGLTF('/models/man-sitting.glb'),
      loadGLTF('/models/monitor.glb'),
      loadGLTF('/models/wall.glb'),
    ]);

    // Standard materials for models
    const lightBrownTableMat = new THREE.MeshStandardMaterial({
      color: 0xc49a6c,
      roughness: 0.42,
      metalness: 0.05,
    });
    const greyChairMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.65,
      metalness: 0.15,
    });
    const darkNavyMonitorMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.25,
      metalness: 0.6,
    });
    const glassWallMat = new THREE.MeshPhysicalMaterial({
      color: 0xcfd8dc,
      transparent: true,
      opacity: 0.35,
      roughness: 0.08,
      transmission: 0.88,
      thickness: 0.4,
    });

    tableModel.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).material = lightBrownTableMat;
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    chairModel.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).material = greyChairMat;
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    monitorModel.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).material = darkNavyMonitorMat;
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    wallModel.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).material = glassWallMat;
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    manModel.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // Partition walls
    const placeWall = (x: number, z: number, rotY: number = 0) => {
      const wallClone = wallModel.clone(true);
      wallClone.scale.set(1.25, 1.15, 1.25);
      wallClone.position.set(x, 0, z);
      wallClone.rotation.y = rotY;
      officeGroup.add(wallClone);
    };

    placeWall(-9.5, -4.5, 0);
    placeWall(-9.5, 3.5, 0);
    placeWall(4.5, -5.0, 0);
    placeWall(4.5, 2.5, 0);
    placeWall(0, 0, Math.PI / 2);
    placeWall(12.0, 0, Math.PI / 2);

    // Spawn agent workstations
    const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.76, 8);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7, roughness: 0.3 });
    const hairGeo = new THREE.SphereGeometry(0.165, 16, 16);
    hairGeo.scale(1.0, 0.78, 1.12);
    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.85,
      metalness: 0.1,
    });
    const statusRingGeo = new THREE.RingGeometry(0.7, 0.85, 32);
    const orbGeo = new THREE.SphereGeometry(0.09, 16, 16);
    const rippleGeo = new THREE.RingGeometry(0.25, 0.42, 32);

    agents.forEach((agent) => {
      const deskGroup = new THREE.Group();
      deskGroup.position.set(agent.position[0], 0, agent.position[2]);
      deskGroup.rotation.y = agent.rotationY;
      deskGroup.userData = { agentId: agent.id, isAgent: true };

      // Table
      const table = tableModel.clone(true);
      table.scale.set(2.4, 2.4, 2.4);
      table.position.set(1.01, 0, -0.538);
      deskGroup.add(table);

      // Table Legs Accent
      [[-0.85, -0.4], [0.85, -0.4], [-0.85, 0.4], [0.85, 0.4]].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(legGeo, legMat);
        leg.position.set(lx, 0.38, lz);
        leg.castShadow = true;
        deskGroup.add(leg);
      });

      // Monitor
      const monitor = monitorModel.clone(true);
      monitor.scale.set(1.0, 1.0, 1.0);
      monitor.position.set(0, 0.785, 0.15);
      monitor.rotation.y = 0;
      deskGroup.add(monitor);

      // Chair
      const chair = chairModel.clone(true);
      chair.scale.set(1.5, 1.5, 1.5);
      chair.rotation.y = Math.PI;
      chair.position.set(-0.251, 0, -0.48);
      deskGroup.add(chair);

      // Agent 3D Character
      const man = manModel.clone(true);
      man.scale.set(0.42, 0.42, 0.42);
      man.position.set(0, 0.05, -0.40);

      const divConfig = DIVISION_CONFIG[agent.division];
      const shirtMat = new THREE.MeshStandardMaterial({
        color: divConfig?.color ?? '#0284c7',
        roughness: 0.65,
      });
      const pantsMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        roughness: 0.85,
      });
      const shoesMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.4,
      });

      man.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (mesh.name === 'mesh_0_1' || mesh.name.includes('Shirt')) {
            mesh.material = shirtMat;
          } else if (mesh.name === 'mesh_0_2' || mesh.name.includes('Pants')) {
            mesh.material = pantsMat;
          } else if (mesh.name === 'mesh_0_3' || mesh.name.includes('Shoes')) {
            mesh.material = shoesMat;
          }
        }
      });
      deskGroup.add(man);

      // Hair
      const hairMesh = new THREE.Mesh(hairGeo, hairMat);
      hairMesh.position.set(0, 1.25, -0.69);
      hairMesh.castShadow = true;
      deskGroup.add(hairMesh);

      // Interactive Ring on floor
      const statusConfig = AGENT_STATUS_CONFIG[agent.status];
      const statusRingMat = new THREE.MeshBasicMaterial({
        color: statusConfig.ringColor,
        side: THREE.DoubleSide,
      });
      const statusRing = new THREE.Mesh(statusRingGeo, statusRingMat);
      statusRing.rotation.x = -Math.PI / 2;
      statusRing.position.set(0, 0.02, -0.45);
      statusRing.visible = false;
      deskGroup.add(statusRing);

      // Floating Orb
      const orbMat = new THREE.MeshBasicMaterial({ color: statusConfig.ringColor });
      const orb = new THREE.Mesh(orbGeo, orbMat);
      orb.position.set(0, 1.85, -0.45);
      orb.visible = false;
      deskGroup.add(orb);

      // Shockwave ripple
      const rippleMat = new THREE.MeshBasicMaterial({
        color: statusConfig.ringColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const clickRipple = new THREE.Mesh(rippleGeo, rippleMat);
      clickRipple.rotation.x = -Math.PI / 2;
      clickRipple.position.set(0, 0.03, -0.45);
      clickRipple.visible = false;
      deskGroup.add(clickRipple);

      deskGroup.userData = {
        agentId: agent.id,
        isAgent: true,
        statusRing,
        statusOrb: orb,
        clickRipple,
        manMesh: man,
        agentData: agent,
      };

      officeGroup.add(deskGroup);
    });

    // Potted plants along aisles
    const potGeo = new THREE.CylinderGeometry(0.32, 0.22, 0.7, 16);
    const potMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const plantGeo = new THREE.DodecahedronGeometry(0.48, 1);
    const plantMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.8 });

    const createPlant = (x: number, z: number) => {
      const pot = new THREE.Mesh(potGeo, potMat);
      pot.position.set(x, 0.35, z);
      pot.castShadow = true;

      const plant = new THREE.Mesh(plantGeo, plantMat);
      plant.position.set(x, 0.9, z);
      plant.castShadow = true;

      officeGroup.add(pot);
      officeGroup.add(plant);
    };

    createPlant(-14.5, -11.5);
    createPlant(-14.5, 11.5);
    createPlant(0, -11.5);
    createPlant(0, 11.5);
    createPlant(14.5, -11.5);
    createPlant(14.5, 11.5);
    createPlant(-4.0, 0);
    createPlant(9.5, 0);
  } catch (err) {
    console.warn('Error loading 3D assets:', err);
  }

  return { floorWidth, floorDepth };
}
