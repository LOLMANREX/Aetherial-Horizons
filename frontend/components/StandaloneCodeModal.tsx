import React, { useState } from 'react';
import { X, Copy, Check, Download, Code } from 'lucide-react';

interface StandaloneCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StandaloneCodeModal: React.FC<StandaloneCodeModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Code autonome complet en un seul fichier index.html (respectant toutes les spécifications)
  const standaloneHtmlCode = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Aetherial Horizons - Prototype 3D Open World</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; }
    body, html { width: 100%; height: 100%; overflow: hidden; background: #060913; font-family: system-ui, -apple-system, sans-serif; color: #f8fafc; }
    #canvas-container { position: fixed; inset: 0; z-index: 1; }
    #hud { position: fixed; inset: 0; z-index: 10; pointer-events: none; display: flex; flex-direction: column; justify-content: space-between; padding: 20px; }
    .glass { background: rgba(9, 14, 28, 0.78); backdrop-filter: blur(10px); border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 16px; padding: 14px 18px; box-shadow: 0 12px 32px rgba(0,0,0,0.45); }
    .top-bar { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
    .bottom-bar { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; }
    .title-sm { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; font-weight: 700; margin-bottom: 4px; }
    .orb-count { font-size: 26px; font-weight: 800; color: #34d399; }
    .compass-box { min-width: 280px; text-align: center; }
    .compass-heading { font-size: 15px; font-weight: 700; color: #fbbf24; font-family: monospace; }
    .coords { font-size: 12px; font-family: monospace; color: #cbd5e1; margin-top: 4px; }
    .stamina-box { width: 280px; }
    .bar-bg { width: 100%; height: 10px; background: #1e293b; border-radius: 999px; overflow: hidden; margin-top: 6px; }
    .bar-fill { height: 100%; width: 100%; background: linear-gradient(90deg, #10b981, #22d3ee); transition: width 0.08s linear; }
    #crosshair { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.9); box-shadow: 0 0 8px #fff; z-index: 12; pointer-events: none; }
    #overlay { position: fixed; inset: 0; z-index: 20; display: flex; align-items: center; justify-content: center; background: rgba(4, 7, 17, 0.72); backdrop-filter: blur(6px); }
    .modal { max-width: 460px; text-align: center; pointer-events: auto; padding: 30px; }
    .btn { margin-top: 18px; padding: 12px 24px; border: none; border-radius: 12px; background: linear-gradient(90deg, #10b981, #06b6d4); color: #020617; font-weight: 800; font-size: 14px; cursor: pointer; }
  </style>
  <script type="importmap">
    {
      "imports": {
        "three": "https://www.gstatic.com/agent-platform/modules/v1/three@^0.185.0"
      }
    }
  </script>
</head>
<body>
  <div id="canvas-container"></div>
  <div id="crosshair"></div>

  <div id="hud">
    <div class="top-bar">
      <div class="glass">
        <div class="title-sm">Orbes Aethériques</div>
        <div class="orb-count"><span id="orb-val">0</span> / 10</div>
        <div id="nearest-orb" class="coords">Proche: -- m</div>
      </div>

      <div class="glass compass-box">
        <div class="compass-heading" id="compass-text">N • 0°</div>
        <div class="coords" id="coords-text">X: 0 | ALT: 0m | Z: 0</div>
      </div>

      <div class="glass">
        <div class="title-sm">Cycle Solaire</div>
        <div class="compass-heading" id="time-text">10:00</div>
        <div class="coords">V: Vue 1P/3P</div>
      </div>
    </div>

    <div class="bottom-bar">
      <div class="glass stamina-box">
        <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:700;">
          <span>ENDURANCE (SHIFT)</span>
          <span id="stamina-text">100%</span>
        </div>
        <div class="bar-bg"><div class="bar-fill" id="stamina-bar"></div></div>
      </div>
    </div>
  </div>

  <div id="overlay">
    <div class="glass modal">
      <h1 style="font-size:24px;margin-bottom:8px;">AETHERIAL HORIZONS</h1>
      <p style="font-size:13px;color:#94a3b8;line-height:1.5;">
        Explorez l'Open World 3D procédural.<br/>
        <b>ZQSD / WASD</b> : Se déplacer • <b>ESPACE</b> : Sauter • <b>SHIFT</b> : Sprinter • <b>V</b> : Caméra 1P/3P
      </p>
      <button class="btn" id="start-btn">Cliquer pour Jouer</button>
    </div>
  </div>

  <script type="module">
    import * as THREE from 'three';

    // 1. Bruit Simplex / Perlin 2D pur JS
    const perm = new Uint8Array(512);
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    let seed = 42069;
    for (let i = 255; i > 0; i--) {
      seed = (seed * 16807) % 2147483647;
      const j = seed % (i + 1);
      const t = p[i]; p[i] = p[j]; p[j] = t;
    }
    for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
    const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
    const lerp = (t, a, b) => a + t * (b - a);
    const grad = (h, x, y) => {
      const g = h & 7;
      const u = g < 4 ? x : y;
      const v = g < 4 ? y : x;
      return ((g & 1) ? -u : u) + ((g & 2) ? -2 * v : 2 * v);
    };
    function noise2D(x, y) {
      const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
      x -= Math.floor(x); y -= Math.floor(y);
      const u = fade(x), v = fade(y);
      const A = perm[X] + Y, B = perm[X + 1] + Y;
      return 0.5 * lerp(v, lerp(u, grad(perm[A], x, y), grad(perm[B], x - 1, y)),
                           lerp(u, grad(perm[A + 1], x, y - 1), grad(perm[B + 1], x - 1, y - 1)));
    }

    const WORLD_SIZE = 700;
    function getTerrainHeight(x, z) {
      let h = noise2D(x * 0.0045, z * 0.0045) * 38 + noise2D(x * 0.015 + 100, z * 0.015 + 100) * 11 + noise2D(x * 0.045, z * 0.045) * 2.5;
      const dist = Math.sqrt(x * x + z * z);
      const flat = Math.min(1, Math.max(0, (dist - 12) / 35));
      return h * flat + 2.5 * (1 - flat);
    }

    // 2. Initialisation Scène, Caméra, Renderer
    const container = document.getElementById('canvas-container');
    const scene = new THREE.Scene();
    const fog = new THREE.FogExp2(0x87ceeb, 0.0028);
    scene.fog = fog;

    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 900);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 3. Lumières
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 0.55);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffbeb, 1.6);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(2048, 2048);
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 450;
    const d = 160;
    sunLight.shadow.camera.left = -d; sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d; sunLight.shadow.camera.bottom = -d;
    scene.add(sunLight);

    // 4. Terrain Procédural avec couleurs par sommet
    const terrainGeo = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, 220, 220);
    terrainGeo.rotateX(-Math.PI / 2);
    const posAttr = terrainGeo.attributes.position;
    const colors = new Float32Array(posAttr.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i), vz = posAttr.getZ(i);
      const vy = getTerrainHeight(vx, vz);
      posAttr.setY(i, vy);
      if (vy < -4) c.setHex(0xc2b280);
      else if (vy < 12) c.setHex(0x2d6a4f);
      else if (vy < 26) c.setHex(0x52796f);
      else c.setHex(0xe2e8f0);
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }
    terrainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    terrainGeo.computeVertexNormals();
    const terrainMesh = new THREE.Mesh(terrainGeo, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.9 }));
    terrainMesh.receiveShadow = true;
    scene.add(terrainMesh);

    // 5. Végétation & Rochers via InstancedMesh
    const treeCount = 850, rockCount = 500;
    const trunkMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.28, 0.45, 2.4, 6), new THREE.MeshStandardMaterial({ color: 0x5c4033, flatShading: true }), treeCount);
    const leavesMesh = new THREE.InstancedMesh(new THREE.ConeGeometry(1.9, 4.8, 7), new THREE.MeshStandardMaterial({ color: 0x1b4332, flatShading: true }), treeCount);
    const rockMesh = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1.2, 0), new THREE.MeshStandardMaterial({ color: 0x64748b, flatShading: true, roughness: 0.85 }), rockCount);
    trunkMesh.castShadow = leavesMesh.castShadow = rockMesh.castShadow = true;
    trunkMesh.receiveShadow = leavesMesh.receiveShadow = rockMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    for (let i = 0; i < treeCount; i++) {
      const tx = (Math.random() - 0.5) * (WORLD_SIZE - 80);
      const tz = (Math.random() - 0.5) * (WORLD_SIZE - 80);
      if (Math.hypot(tx, tz) < 18) { i--; continue; }
      const ty = getTerrainHeight(tx, tz);
      const s = 0.75 + Math.random() * 0.9;
      dummy.position.set(tx, ty + 1.1 * s, tz);
      dummy.scale.set(s, s, s);
      dummy.rotation.set(0, Math.random() * Math.PI, 0);
      dummy.updateMatrix();
      trunkMesh.setMatrixAt(i, dummy.matrix);
      dummy.position.set(tx, ty + 3.4 * s, tz);
      dummy.updateMatrix();
      leavesMesh.setMatrixAt(i, dummy.matrix);
    }
    for (let i = 0; i < rockCount; i++) {
      const rx = (Math.random() - 0.5) * (WORLD_SIZE - 60);
      const rz = (Math.random() - 0.5) * (WORLD_SIZE - 60);
      const ry = getTerrainHeight(rx, rz);
      const s = 0.5 + Math.random() * 1.8;
      dummy.position.set(rx, ry + 0.3 * s, rz);
      dummy.scale.set(s, s * 0.7, s);
      dummy.rotation.set(Math.random(), Math.random(), Math.random());
      dummy.updateMatrix();
      rockMesh.setMatrixAt(i, dummy.matrix);
    }
    scene.add(trunkMesh, leavesMesh, rockMesh);

    // 6. Orbes Lumineuses (10 Objectifs)
    const orbs = [];
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2 + Math.random() * 0.4;
      const dist = 45 + Math.random() * 210;
      const ox = Math.cos(angle) * dist, oz = Math.sin(angle) * dist;
      const oy = getTerrainHeight(ox, oz) + 2.2;
      const group = new THREE.Group();
      group.position.set(ox, oy, oz);
      const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.95, 1), new THREE.MeshStandardMaterial({ color: 0x22d3ee, emissive: 0x06b6d4, emissiveIntensity: 2.2, wireframe: false }));
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.08, 8, 24), new THREE.MeshBasicMaterial({ color: 0x67e8f9 }));
      const light = new THREE.PointLight(0x22d3ee, 4, 18);
      group.add(core, ring, light);
      scene.add(group);
      orbs.push({ group, ring, x: ox, y: oy, z: oz, collected: false });
    }

    // 7. Joueur & Contrôles
    const playerMesh = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.45, 1.0, 4, 8), new THREE.MeshStandardMaterial({ color: 0x38bdf8 }));
    body.castShadow = true;
    playerMesh.add(body);
    scene.add(playerMesh);

    const keys = {};
    let yaw = 0, pitch = 0, isThirdPerson = false, isLocked = false, isDragging = false;
    const playerPos = new THREE.Vector3(0, getTerrainHeight(0, 0) + 2, 0);
    const velocity = new THREE.Vector3();
    let stamina = 100, orbsCollected = 0, timeOfDay = 9.5;

    window.addEventListener('keydown', e => {
      keys[e.code] = true;
      if (e.code === 'KeyV') isThirdPerson = !isThirdPerson;
    });
    window.addEventListener('keyup', e => keys[e.code] = false);
    document.getElementById('start-btn').addEventListener('click', () => {
      document.getElementById('overlay').style.display = 'none';
      try {
        const p = renderer.domElement.requestPointerLock();
        if (p && p.catch) p.catch(() => {});
      } catch (err) {}
    });
    document.addEventListener('pointerlockchange', () => {
      isLocked = document.pointerLockElement === renderer.domElement;
      document.getElementById('overlay').style.display = isLocked ? 'none' : 'flex';
    });
    renderer.domElement.addEventListener('mousedown', () => isDragging = true);
    window.addEventListener('mouseup', () => isDragging = false);
    document.addEventListener('mousemove', e => {
      if (!isLocked && !isDragging) return;
      yaw -= e.movementX * 0.0022;
      pitch = Math.max(-1.4, Math.min(1.4, pitch - e.movementY * 0.0022));
    });

    // 8. Boucle Principale
    let lastTime = performance.now();
    function animate(now) {
      requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Cycle Jour/Nuit
      timeOfDay = (timeOfDay + dt * 0.25) % 24;
      const sunAngle = ((timeOfDay - 6) / 24) * Math.PI * 2;
      sunLight.position.set(playerPos.x + Math.cos(sunAngle) * 180, Math.sin(sunAngle) * 180, playerPos.z + 60);
      const dayFactor = Math.max(0, Math.sin(sunAngle));
      scene.background = new THREE.Color().setHSL(0.58, 0.55, 0.06 + dayFactor * 0.62);
      fog.color.copy(scene.background);
      sunLight.intensity = 0.15 + dayFactor * 1.65;

      // Physique Joueur
      const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
      const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
      const move = new THREE.Vector3();
      if (keys['KeyW'] || keys['KeyZ'] || keys['ArrowUp']) move.add(forward);
      if (keys['KeyS'] || keys['ArrowDown']) move.sub(forward);
      if (keys['KeyD'] || keys['ArrowRight']) move.add(right);
      if (keys['KeyA'] || keys['KeyQ'] || keys['ArrowLeft']) move.sub(right);
      if (move.lengthSq() > 0) move.normalize();

      const sprinting = (keys['ShiftLeft'] || keys['ShiftRight']) && move.lengthSq() > 0 && stamina > 5;
      if (sprinting) stamina = Math.max(0, stamina - 24 * dt);
      else stamina = Math.min(100, stamina + 16 * dt);

      const speed = sprinting ? 19 : 11;
      velocity.x = lerp(dt * 10, velocity.x, move.x * speed);
      velocity.z = lerp(dt * 10, velocity.z, move.z * speed);
      velocity.y -= 28 * dt;

      playerPos.addScaledVector(velocity, dt);
      const groundY = getTerrainHeight(playerPos.x, playerPos.z);
      if (playerPos.y <= groundY + 1.8) {
        playerPos.y = groundY + 1.8;
        velocity.y = 0;
        if (keys['Space']) velocity.y = 12.5;
      }

      playerMesh.position.set(playerPos.x, playerPos.y - 0.8, playerPos.z);
      playerMesh.rotation.y = yaw;
      playerMesh.visible = isThirdPerson;

      if (isThirdPerson) {
        const camOffset = new THREE.Vector3(Math.sin(yaw) * 6.5, 2.5 - Math.sin(pitch) * 3, Math.cos(yaw) * 6.5);
        camera.position.copy(playerPos).add(camOffset);
        camera.lookAt(playerPos.x, playerPos.y + 0.5, playerPos.z);
      } else {
        camera.position.copy(playerPos);
        camera.rotation.order = 'YXZ';
        camera.rotation.y = yaw;
        camera.rotation.x = pitch;
      }

      // Animation et Collecte des Orbes
      let minDist = Infinity;
      orbs.forEach(o => {
        if (o.collected) return;
        o.group.rotation.y += dt * 1.8;
        o.ring.rotation.x += dt * 2.4;
        o.group.position.y = o.y + Math.sin(now * 0.003) * 0.45;
        const d = playerPos.distanceTo(o.group.position);
        if (d < minDist) minDist = d;
        if (d < 3.4) {
          o.collected = true;
          o.group.visible = false;
          orbsCollected++;
          document.getElementById('orb-val').textContent = orbsCollected;
        }
      });

      // Mise à jour HUD
      const deg = Math.round(((-yaw * 180 / Math.PI) % 360 + 360) % 360);
      document.getElementById('compass-text').textContent = \`CAP \${deg}°\`;
      document.getElementById('coords-text').textContent = \`X: \${Math.round(playerPos.x)} | ALT: \${Math.round(playerPos.y)}m | Z: \${Math.round(playerPos.z)}\`;
      document.getElementById('stamina-text').textContent = \`\${Math.round(stamina)}%\`;
      document.getElementById('stamina-bar').style.width = \`\${stamina}%\`;
      document.getElementById('nearest-orb').textContent = minDist < Infinity ? \`Proche: \${Math.round(minDist)} m\` : 'Toutes collectées !';
      const hh = Math.floor(timeOfDay).toString().padStart(2, '0');
      const mm = Math.floor((timeOfDay % 1) * 60).toString().padStart(2, '0');
      document.getElementById('time-text').textContent = \`\${hh}:\${mm}\`;

      renderer.render(scene, camera);
    }
    requestAnimationFrame(animate);

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  </script>
</body>
</html>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(standaloneHtmlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([standaloneHtmlCode], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-lg flex items-center justify-center p-4 pointer-events-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <Code className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">
              Fichier Unique Autonome <code className="text-emerald-400">index.html</code>
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  Copié !
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copier le HTML
                </>
              )}
            </button>
            <button
              onClick={handleDownload}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-4 h-4" />
              Télécharger index.html
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 overflow-y-auto font-mono text-xs text-slate-300 bg-slate-950 flex-1 select-all">
          <pre className="whitespace-pre-wrap break-words">{standaloneHtmlCode}</pre>
        </div>
      </div>
    </div>
  );
};
