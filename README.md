# AETHERIA.EXE — Build 1102

Jeu d'action-aventure 3D Open World low-poly procédural (React, TypeScript, Three.js, Tailwind CSS, Web Audio API) à fins multiples, collision multiverselle et rupture du 4ème mur, conçu pour tourner en autonome ou embarqué dans les PC virtuels `CielOsDesktop` d'**Atelier CIEL 3D**.

## Installation & Commandes

```bash
cd frontend
npm install
npm run dev
```

### Build de production

```bash
cd frontend
npm run build
```

### Build embarqué pour Atelier CIEL 3D (`CielOsDesktop`)

```bash
cd frontend
VITE_CIEL_EMBED=true npm run build
```

Le mode embarqué utilise des chemins relatifs (`./assets/...`), compile Tailwind localement sans CDN externe, désactive les outils de debug et communique avec l'hôte via `postMessage` sécurisé (`frontend/utils/cielBridge.ts`).
