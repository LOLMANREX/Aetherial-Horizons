import * as THREE from 'three';

function disposeMaterial(mat: THREE.Material): void {
  const anyMat = mat as unknown as Record<string, unknown>;
  for (const key of Object.keys(anyMat)) {
    const val = anyMat[key];
    if (val && typeof val === 'object' && 'isTexture' in (val as object)) {
      (val as THREE.Texture).dispose();
    }
  }
  mat.dispose();
}

export function disposeObject3D(root: THREE.Object3D | null | undefined): void {
  if (!root) return;
  root.traverse((obj) => {
    const renderable = obj as THREE.Mesh & THREE.Line & THREE.Points;
    if (renderable.geometry && typeof renderable.geometry.dispose === 'function') {
      renderable.geometry.dispose();
    }
    const mat = renderable.material;
    if (Array.isArray(mat)) {
      mat.forEach((m) => {
        if (m) disposeMaterial(m);
      });
    } else if (mat) {
      disposeMaterial(mat);
    }
  });
}
