import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import * as fs from "fs";
import * as path from "path";

// Polyfill complete FileReader for CLI environment
(globalThis as any).FileReader = class FileReader {
  onload: any;
  readAsArrayBuffer(blob: any) {
    if (blob && typeof blob.arrayBuffer === "function") {
      blob.arrayBuffer().then((buf: ArrayBuffer) => {
        if (this.onload) this.onload({ target: { result: buf } });
      });
    }
  }
  readAsDataURL(blob: any) {
    if (blob && typeof blob.arrayBuffer === "function") {
      blob.arrayBuffer().then((buf: ArrayBuffer) => {
        const base64 = Buffer.from(buf).toString("base64");
        const dataUrl = `data:${blob.type || "application/octet-stream"};base64,${base64}`;
        if (this.onload) this.onload({ target: { result: dataUrl } });
      });
    }
  }
};

async function generateJerseyGLB() {
  console.log("Generating 3D Jersey Mesh with UV mapping...");

  const scene = new THREE.Scene();
  const group = new THREE.Group();
  group.name = "Jersey_Group";

  const widthSegments = 48;
  const heightSegments = 32;
  const torsoGeo = new THREE.CylinderGeometry(
    0.95,
    1.05,
    2.2,
    widthSegments,
    heightSegments,
    true,
  );

  const pos = torsoGeo.attributes.position;
  const uvs = torsoGeo.attributes.uv;

  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);

    z = z * 0.58;

    if (y > 0.3) {
      const t = (y - 0.3) / 0.8;
      x = x * (1 + t * 0.35);
    }

    if (y < 0.2 && y > -0.6) {
      x = x * 0.96;
      z = z * 0.94;
    }

    pos.setXYZ(i, x, y, z);

    const origU = uvs.getX(i);
    const origV = uvs.getY(i);

    if (origU <= 0.5) {
      uvs.setXY(i, origU, 0.5 + origV * 0.5);
    } else {
      uvs.setXY(i, origU, 0.5 + origV * 0.5);
    }
  }

  pos.needsUpdate = true;
  uvs.needsUpdate = true;
  torsoGeo.computeVertexNormals();

  const leftSleeveGeo = new THREE.CylinderGeometry(
    0.38,
    0.34,
    0.9,
    24,
    16,
    true,
  );
  const leftUvs = leftSleeveGeo.attributes.uv;
  for (let i = 0; i < leftUvs.count; i++) {
    const u = leftUvs.getX(i);
    const v = leftUvs.getY(i);
    leftUvs.setXY(i, u * 0.5, v * 0.5);
  }
  leftUvs.needsUpdate = true;
  leftSleeveGeo.computeVertexNormals();

  const rightSleeveGeo = new THREE.CylinderGeometry(
    0.38,
    0.34,
    0.9,
    24,
    16,
    true,
  );
  const rightUvs = rightSleeveGeo.attributes.uv;
  for (let i = 0; i < rightUvs.count; i++) {
    const u = rightUvs.getX(i);
    const v = rightUvs.getY(i);
    rightUvs.setXY(i, 0.5 + u * 0.5, v * 0.5);
  }
  rightUvs.needsUpdate = true;
  rightSleeveGeo.computeVertexNormals();

  const collarGeo = new THREE.TorusGeometry(0.48, 0.05, 16, 32);
  collarGeo.rotateX(Math.PI / 2 - 0.1);

  const defaultMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.6,
    metalness: 0.1,
    name: "DefaultMaterial",
  });

  const torsoMesh = new THREE.Mesh(torsoGeo, defaultMat);
  torsoMesh.name = "Jersey_Mesh";
  group.add(torsoMesh);

  const leftSleeveMesh = new THREE.Mesh(leftSleeveGeo, defaultMat);
  leftSleeveMesh.name = "Left_Sleeve_Mesh";
  leftSleeveMesh.position.set(-1.12, 0.62, 0);
  leftSleeveMesh.rotation.z = Math.PI / 3.8;
  leftSleeveMesh.rotation.x = 0.08;
  group.add(leftSleeveMesh);

  const rightSleeveMesh = new THREE.Mesh(rightSleeveGeo, defaultMat);
  rightSleeveMesh.name = "Right_Sleeve_Mesh";
  rightSleeveMesh.position.set(1.12, 0.62, 0);
  rightSleeveMesh.rotation.z = -Math.PI / 3.8;
  rightSleeveMesh.rotation.x = 0.08;
  group.add(rightSleeveMesh);

  const collarMesh = new THREE.Mesh(collarGeo, defaultMat);
  collarMesh.name = "Collar_Mesh";
  collarMesh.position.set(0, 1.02, 0.02);
  group.add(collarMesh);

  scene.add(group);

  const outputDir = path.resolve(process.cwd(), "public/models");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, "tshirt.glb");
  const exporter = new GLTFExporter();

  await new Promise<void>((resolve, reject) => {
    exporter.parse(
      scene,
      (gltf) => {
        try {
          if (gltf instanceof ArrayBuffer) {
            fs.writeFileSync(outputPath, Buffer.from(gltf));
            console.log(
              `✅ Successfully generated 3D Jersey GLB at: ${outputPath} (${fs.statSync(outputPath).size} bytes)`,
            );
          } else {
            fs.writeFileSync(outputPath, JSON.stringify(gltf, null, 2));
            console.log(
              `✅ Successfully generated 3D Jersey GLTF at: ${outputPath}`,
            );
          }
          resolve();
        } catch (e) {
          reject(e);
        }
      },
      (err) => {
        console.error("Failed to export GLB:", err);
        reject(err);
      },
      { binary: false, embedImages: false },
    );
  });
}

generateJerseyGLB()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
