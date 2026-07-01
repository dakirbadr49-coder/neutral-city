(function () {
  /* ── Zones de la ville (4 quartiers, un par grande techno) ──
     Chaque zone regroupe les technos liées (ex: JS/React/jQuery ensemble
     dans le quartier Web) au lieu d'être éparpillées dans toute la ville. */
  const ZONES = {
    web:     { name: "Secteur Web / Frontend", color: 0x00f0ff },
    backend: { name: "Secteur Backend",        color: 0xff44cc },
    data:    { name: "Secteur Data / IA",      color: 0x00f0ff },
    systeme: { name: "Secteur Système",        color: 0x00f0ff },
  };

  /* ── Données métiers, chacune rattachée à sa zone ── */
  const JOBS = [
    { name: "JavaScript",  color: 0xf7df1e, sub: "Secteur Web",       count: "3,241", trend: "↑ +18%", zone: "Zone Alpha",   icon: "JS",  zoneId: "web"     },
    { name: "TypeScript",  color: 0x3178c6, sub: "Secteur Web",       count: "2,230", trend: "↑ +22%", zone: "Zone Alpha",   icon: "TS",  zoneId: "web"     },
    { name: "React",       color: 0x61dafb, sub: "Secteur Frontend",  count: "3,890", trend: "↑ +19%", zone: "Zone Alpha",   icon: "⚛",  zoneId: "web"     },
    { name: "jQuery",      color: 0x0769ad, sub: "Secteur Web",       count: "1,120", trend: "→ +1%",  zone: "Zone Alpha",   icon: "jQ",  zoneId: "web"     },
    { name: "HTML",        color: 0xe34f26, sub: "Secteur Web",       count: "2,010", trend: "↑ +5%",  zone: "Zone Alpha",   icon: "HTM", zoneId: "web"     },
    { name: "CSS",         color: 0x2965f1, sub: "Secteur Style",     count: "2,102", trend: "↑ +11%", zone: "Zone Alpha",   icon: "CSS", zoneId: "web"     },
    { name: "PHP",         color: 0x8892be, sub: "Secteur Backend",   count: "987",   trend: "→ +2%",  zone: "Zone Delta",   icon: "PHP", zoneId: "backend" },
    { name: "Java",        color: 0xea2d2e, sub: "Secteur Enterprise",count: "1,742", trend: "↓ -3%",  zone: "Zone Delta",   icon: "JV",  zoneId: "backend" },
    { name: "Node.js",     color: 0x3c873a, sub: "Secteur Backend",   count: "2,410", trend: "↑ +16%", zone: "Zone Delta",   icon: "ND",  zoneId: "backend" },
    { name: "Python",      color: 0x3776ab, sub: "Secteur Data/IA",   count: "4,580", trend: "↑ +24%", zone: "Zone Beta",    icon: "PY",  zoneId: "data"    },
    { name: "SQL",         color: 0x4479a1, sub: "Secteur Data",      count: "2,847", trend: "↑ +12%", zone: "Zone Beta",    icon: "DB",  zoneId: "data"    },
    { name: "C++",         color: 0x00599c, sub: "Secteur Système",   count: "1,450", trend: "↑ +7%",  zone: "Zone Gamma",   icon: "C++", zoneId: "systeme" },
    { name: "Docker",      color: 0x2496ed, sub: "Secteur Système",   count: "1,680", trend: "↑ +14%", zone: "Zone Gamma",   icon: "DK",  zoneId: "systeme" },
  ];

  const JOBS_BY_ZONE = {};
  Object.keys(ZONES).forEach(zid => { JOBS_BY_ZONE[zid] = JOBS.filter(j => j.zoneId === zid); });

  // Quadrant → zone : Web (x>0,z>0) / Backend (x<0,z>0) / Data (x<0,z<0) / Système (x>0,z<0)
  function zoneIdForPosition(x, z) {
    if (x >= 0 && z >= 0) return 'web';
    if (x <  0 && z >= 0) return 'backend';
    if (x <  0 && z <  0) return 'data';
    return 'systeme';
  }
  function randomJobForPosition(x, z) {
    const list = JOBS_BY_ZONE[zoneIdForPosition(x, z)];
    return list[Math.floor(Math.random() * list.length)];
  }

  /* ── Peuple la section "Stack Technique" avec les mêmes données ── */
  const stackGrid = document.getElementById('stack-grid');
  if (stackGrid) {
    JOBS.forEach(job => {
      const card = document.createElement('div');
      card.className = 'glass-panel tilt-card rounded-xl p-4 flex flex-col gap-2 cursor-pointer';
      card.innerHTML = `
        <div class="flex justify-between items-start">
          <span class="font-mono text-[9px] tracking-widest" style="color:#${job.color.toString(16).padStart(6,'0')}">${job.icon}</span>
        </div>
        <h3 class="font-bold text-[#dbfcff] text-base">${job.name}</h3>
        <p class="text-[9px] uppercase tracking-tighter text-[#849495]">${job.sub}</p>
        <div class="h-[2px] bg-[#00f0ff]/20 w-full mt-1">
          <div class="h-full" style="width:${40 + Math.random()*55}%; background:#${job.color.toString(16).padStart(6,'0')}"></div>
        </div>`;
      card.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        const btn = document.querySelector(`#side-nav button[data-job="${job.name}"]`);
        if (btn) setTimeout(() => btn.click(), 500);
      });
      stackGrid.appendChild(card);
    });
  }

  /* ── Scene setup ── */
  const canvas = document.getElementById('city-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: window.devicePixelRatio < 1.5, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setClearColor(0x121b30, 1);
  // Les ombres dynamiques sont désactivées : avec autant de bâtiments/lumières
  // c'est ce qui faisait le plus ramer le site. Le rendu reste lisible sans.
  renderer.shadowMap.enabled = false;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x121b30, 0.013);

  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 300);
  camera.position.set(28, 30, 32);
  camera.lookAt(0, 0, 0);

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  /* ── Lumières ── */
  const ambient = new THREE.AmbientLight(0x24406e, 1.1);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0x00f0ff, 0.6);
  sun.position.set(20, 40, 15);
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0x440088, 0.4);
  fill.position.set(-20, 10, -15);
  scene.add(fill);

  /* Point lights colorées dans la ville */
  const ptColors = [0x00f0ff, 0x00f0ff, 0x00f0ff, 0xff44cc];
  ptColors.forEach((c, i) => {
    const pt = new THREE.PointLight(c, 1.2, 25);
    pt.position.set(
      Math.cos(i / ptColors.length * Math.PI * 2) * 8,
      3,
      Math.sin(i / ptColors.length * Math.PI * 2) * 8
    );
    scene.add(pt);
  });

  /* ── Sol ──
     Pas de GridHelper holographique ici : avec le vrai réseau de routes,
     trottoirs et marquages déjà modélisés plus bas, une grille en plus
     par-dessus tout ne faisait qu'ajouter un quadrillage façon papier
     millimétré sur toute la ville. */

  // Plan sol — volontairement énorme (bien au-delà de ce que le brouillard
  // laisse voir) pour qu'on ne tombe jamais sur un bord visible : la ville
  // doit sembler infinie, pas s'arrêter net.
  const groundGeo = new THREE.PlaneGeometry(6000, 6000);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x0a1020, roughness: 0.9, metalness: 0.1
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  /* Routes — réseau complet aligné sur la grille de bâtiments */
  const roadMat = new THREE.MeshStandardMaterial({
    color: 0x0d1520, roughness: 1,
    polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1
  });
  const sidewalkMat = new THREE.MeshStandardMaterial({
    color: 0x1a2233, roughness: 0.95,
    polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1
  });

  function addRoad(x, z, w, d) {
    const geo = new THREE.PlaneGeometry(w, d);
    const mesh = new THREE.Mesh(geo, roadMat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.03, z);
    mesh.receiveShadow = true;
    scene.add(mesh);
  }
  function addSidewalk(x, z, w, d) {
    const geo = new THREE.PlaneGeometry(w, d);
    const mesh = new THREE.Mesh(geo, sidewalkMat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.04, z);
    mesh.receiveShadow = true;
    scene.add(mesh);
  }
  function addStreetLamp(x, z) {
    const group = new THREE.Group();
    const poleGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.2);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x222831, roughness: 0.6, metalness: 0.6 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 1.1;
    group.add(pole);
    const lampGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const lampMat = new THREE.MeshStandardMaterial({
      color: 0xffe8b0, emissive: 0xffcf70, emissiveIntensity: 1.2
    });
    const lamp = new THREE.Mesh(lampGeo, lampMat);
    lamp.position.y = 2.25;
    group.add(lamp);
    // Pas de vraie PointLight ici : avec ~40 lampadaires ça faisait ramer
    // le rendu. Le glow émissif suffit visuellement.
    group.position.set(x, 0, z);
    scene.add(group);
  }

  // Grandes avenues (axes principaux) — anneau extérieur ajouté pour
  // les nouveaux quartiers (école, parcs) sans densifier le centre
  [0, 16, -16, 32, -32, 44, -44].forEach(pos => {
    addRoad(0, pos, 140, pos === 0 ? 2.4 : 1.4);
    addRoad(pos, 0, pos === 0 ? 2.4 : 1.4, 140);
  });
  // Rues secondaires plus fines, une par rangée de bâtiments (STEP = 4.6)
  for (let k = -4; k <= 4; k++) {
    const p = k * 4.6;
    if ([0, 16, -16, 32, -32, 44, -44].some(v => Math.abs(v - p) < 0.5)) continue;
    addRoad(0, p, 140, 0.55);
    addRoad(p, 0, 0.55, 140);
  }
  // Trottoirs le long des grandes avenues
  [16, -16, 32, -32, 44, -44].forEach(pos => {
    addSidewalk(0, pos + 1.05, 140, 0.55);
    addSidewalk(0, pos - 1.05, 140, 0.55);
    addSidewalk(pos + 1.05, 0, 0.55, 140);
    addSidewalk(pos - 1.05, 0, 0.55, 140);
  });
  addSidewalk(0, 1.55, 140, 0.5);
  addSidewalk(0, -1.55, 140, 0.5);
  addSidewalk(1.55, 0, 0.5, 140);
  addSidewalk(-1.55, 0, 0.5, 140);

  /* Marquage au sol : ligne centrale en pointillés sur les grandes avenues
     (des tirets espacés, comme un vrai marquage routier, au lieu d'un
     trait plein continu qui écrasait visuellement chaque avenue) */
  const laneMat = new THREE.MeshBasicMaterial({
    color: 0xffe27a, transparent: true, opacity: 0.35,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2
  });
  const DASH_LEN = 2, DASH_GAP = 2.6, DASH_SPAN = DASH_LEN + DASH_GAP;
  function addLaneMarking(fixedCoord, axis, length) {
    const count = Math.floor(length / DASH_SPAN);
    for (let i = 0; i < count; i++) {
      const pos = -length / 2 + i * DASH_SPAN + DASH_LEN / 2;
      const w = axis === 'x' ? DASH_LEN : 0.08;
      const d = axis === 'x' ? 0.08 : DASH_LEN;
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), laneMat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(axis === 'x' ? pos : fixedCoord, 0.05, axis === 'x' ? fixedCoord : pos);
      scene.add(mesh);
    }
  }
  [0, 16, -16, 32, -32, 44, -44].forEach(pos => {
    addLaneMarking(pos, 'x', 140);
    addLaneMarking(pos, 'z', 140);
  });

  /* Passages piétons aux grands carrefours */
  const crosswalkCanvas = document.createElement('canvas');
  crosswalkCanvas.width = 128; crosswalkCanvas.height = 128;
  const cwCtx = crosswalkCanvas.getContext('2d');
  cwCtx.clearRect(0, 0, 128, 128);
  cwCtx.fillStyle = 'rgba(220,225,251,0.6)';
  for (let x = 6; x < 128; x += 18) cwCtx.fillRect(x, 8, 10, 112);
  const crosswalkTex = new THREE.CanvasTexture(crosswalkCanvas);
  const crosswalkMat = new THREE.MeshBasicMaterial({
    map: crosswalkTex, transparent: true, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2
  });
  function addCrosswalk(x, z, rotZ) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), crosswalkMat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.rotation.z = rotZ;
    mesh.position.set(x, 0.06, z);
    scene.add(mesh);
  }
  [[0, 16, 0], [0, -16, 0], [16, 0, Math.PI / 2], [-16, 0, Math.PI / 2],
   [0, 32, 0], [0, -32, 0], [32, 0, Math.PI / 2], [-32, 0, Math.PI / 2]].forEach(([cx, cz, rot]) => {
    addCrosswalk(cx, cz, rot);
  });

  // Lampadaires le long des grandes avenues
  for (let k = -40; k <= 40; k += 8) {
    if (Math.abs(k) < 3) continue;
    addStreetLamp(k, 17.3);
    addStreetLamp(k, -17.3);
    addStreetLamp(17.3, k);
    addStreetLamp(-17.3, k);
  }

  /* ── Bâtiments ── */
  const buildings = [];
  const buildingGroup = new THREE.Group();
  scene.add(buildingGroup);

  // Cache partagé pour les fenêtres : une seule géométrie, et un seul
  // matériau par (couleur de job × allumée/éteinte) au lieu d'un par fenêtre.
  let sharedWindowGeo = null;
  function getWindowGeo() {
    if (!sharedWindowGeo) sharedWindowGeo = new THREE.PlaneGeometry(0.25, 0.3);
    return sharedWindowGeo;
  }
  const windowMatCache = new Map();
  function getWindowMat(job, lit) {
    const key = job.color + '_' + (lit ? 1 : 0);
    if (windowMatCache.has(key)) return windowMatCache.get(key);
    const mat = new THREE.MeshStandardMaterial({
      color: lit ? job.color : 0x0a1020,
      emissive: lit ? new THREE.Color(job.color) : new THREE.Color(0x000000),
      emissiveIntensity: lit ? 0.9 : 0,
      transparent: true, opacity: lit ? 0.85 : 0.3
    });
    windowMatCache.set(key, mat);
    return mat;
  }

  function createBuilding(x, z, job, h) {
    const group = new THREE.Group();

    // Corps principal
    const bGeo = new THREE.BoxGeometry(1.8, h, 1.8);
    const bMat = new THREE.MeshStandardMaterial({
      color: 0x0d1828,
      roughness: 0.6,
      metalness: 0.4,
      emissive: new THREE.Color(job.color),
      emissiveIntensity: 0.04,
    });
    const body = new THREE.Mesh(bGeo, bMat);
    body.position.y = h / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Arêtes lumineuses
    const edgesGeo = new THREE.EdgesGeometry(bGeo);
    const edgesMat = new THREE.LineBasicMaterial({
      color: job.color, transparent: true, opacity: 0.5
    });
    const edges = new THREE.LineSegments(edgesGeo, edgesMat);
    edges.position.y = h / 2;
    group.add(edges);

    // Toit plat lumineux
    const roofGeo = new THREE.PlaneGeometry(1.85, 1.85);
    const roofMat = new THREE.MeshStandardMaterial({
      color: job.color, emissive: new THREE.Color(job.color),
      emissiveIntensity: 0.6, transparent: true, opacity: 0.7
    });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.rotation.x = -Math.PI / 2;
    roof.position.y = h + 0.01;
    group.add(roof);

    // Antenne
    if (h > 6) {
      const antGeo = new THREE.CylinderGeometry(0.02, 0.02, h * 0.25);
      const antMat = new THREE.MeshStandardMaterial({
        color: job.color, emissive: new THREE.Color(job.color), emissiveIntensity: 0.8
      });
      const ant = new THREE.Mesh(antGeo, antMat);
      ant.position.y = h + h * 0.125;
      group.add(ant);
    }

    // Fenêtres (rangées de petits cubes émissifs)
    // Géométrie + matériaux partagés entre tous les bâtiments (au lieu d'en
    // recréer un par fenêtre) : ça évite des centaines d'objets dupliqués
    // qui faisaient ramer le rendu.
    const floors = Math.floor(h / 1.5);
    for (let f = 0; f < floors; f += 2) {
      for (let s = 0; s < 2; s++) {
        const lit = Math.random() > 0.35;
        const win = new THREE.Mesh(getWindowGeo(), getWindowMat(job, lit));
        const side = s === 0 ? 0.91 : -0.91;
        win.position.set(side, 1.0 + f * 1.4, 0.4);
        if (s === 1) { win.position.x = 0.4; win.position.z = side; win.rotation.y = Math.PI / 2; }
        group.add(win);
      }
    }

    group.position.set(x, 0, z);
    group.userData = { job, originalEmissive: 0.04, body, edges, edgesMat, roof };
    buildingGroup.add(group);
    buildings.push(group);
    return group;
  }

  // Grille de bâtiments (9×9 = 81) — chaque quadrant = une zone,
  // les bâtiments du quadrant piochent uniquement dans les technos de cette zone
  const GRID = 9, STEP = 4.6;
  for (let i = 0; i < GRID; i++) {
    for (let j = 0; j < GRID; j++) {
      const x = (i - 4) * STEP;
      const z = (j - 4) * STEP;
      // Skip les axes de routes
      if (Math.abs(x) < 1.5 || Math.abs(z) < 1.5) continue;
      const job = randomJobForPosition(x, z);
      const h = 2.5 + Math.random() * 9;
      createBuilding(x, z, job, h);
    }
  }

  /* Quelques tours emblématiques (skyline en bordure), une par zone —
     on garde une référence vers la plus haute de chaque zone pour y
     accrocher la pub façon "grand panneau publicitaire" */
  const towerWeb      = createBuilding(22, 0,   randomJobForPosition(22, 0),   18);
  createBuilding(22, 4.6, randomJobForPosition(22, 4.6), 16);
  createBuilding(-22, 0,  randomJobForPosition(-22, 0),  16);
  const towerBackend  = createBuilding(-22, 4.6,randomJobForPosition(-22, 4.6),20);
  createBuilding(-22, -4.6,randomJobForPosition(-22, -4.6),14);
  const towerData      = createBuilding(-22, -9.2,randomJobForPosition(-22, -9.2),15);
  const towerSysteme   = createBuilding(22, -4.6, randomJobForPosition(22, -4.6), 17);
  createBuilding(22, -9.2, randomJobForPosition(22, -9.2), 13);

  /* ── Habillage visuel des 4 zones : une petite balise lumineuse
     (pas de grand cercle au sol) + un panneau publicitaire géant accroché
     sur la plus haute tour de la zone, comme un vrai skyline de ville. ── */
  function addZoneBeacon(qx, qz, color) {
    // Petit noyau lumineux
    const coreGeo = new THREE.SphereGeometry(0.22, 12, 12);
    const coreMat = new THREE.MeshStandardMaterial({
      color, emissive: color, emissiveIntensity: 1.4
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.set(qx, 6.5, qz);
    scene.add(core);

    // Faisceau vertical fin (glow) au-dessus/dessous du noyau, purement visuel
    const beamGeo = new THREE.CylinderGeometry(0.015, 0.015, 13, 6, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.set(qx, 6.5, qz);
    scene.add(beam);

    // Petit halo doux au sol (bien plus discret qu'un cercle plein)
    const haloGeo = new THREE.SphereGeometry(0.55, 10, 10);
    const haloMat = new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.position.set(qx, 6.5, qz);
    scene.add(halo);
  }

  // Grand panneau publicitaire accroché sur la façade d'une tour (comme
  // les pubs géantes sur les buildings d'un vrai centre-ville / Times Square)
  function attachZoneAd(x, z, h, title, sub, color, facingRotY) {
    const c = document.createElement('canvas');
    c.width = 560; c.height = 300;
    const ctx = c.getContext('2d');
    const hex = '#' + color.toString(16).padStart(6, '0');
    ctx.fillStyle = '#050a14';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = hex;
    ctx.lineWidth = 5;
    ctx.shadowColor = hex;
    ctx.shadowBlur = 16;
    ctx.strokeRect(12, 12, c.width - 24, c.height - 24);
    ctx.textAlign = 'center';
    ctx.font = 'bold 46px "Space Mono", monospace';
    ctx.fillStyle = hex;
    ctx.shadowBlur = 22;
    ctx.fillText(title, c.width / 2, 118);
    ctx.font = '24px "Space Mono", monospace';
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(220,225,251,0.75)';
    ctx.fillText(sub, c.width / 2, 178);

    const tex = new THREE.CanvasTexture(c);
    const panelW = 5.6, panelH = panelW * (c.height / c.width);
    const panel = new THREE.Mesh(
      new THREE.PlaneGeometry(panelW, panelH),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true })
    );
    const offset = 0.95; // juste devant la façade
    panel.position.set(x + Math.sin(facingRotY) * offset, h * 0.6, z + Math.cos(facingRotY) * offset);
    panel.rotation.y = facingRotY;
    scene.add(panel);
  }

  addZoneBeacon(15, 15,   ZONES.web.color);
  addZoneBeacon(-15, 15,  ZONES.backend.color);
  addZoneBeacon(-15, -15, ZONES.data.color);
  addZoneBeacon(15, -15,  ZONES.systeme.color);
  attachZoneAd(22, 0,    18, "SECTEUR WEB",     "JS · TS · REACT · JQUERY", ZONES.web.color,     -Math.PI / 2);
  attachZoneAd(-22, 4.6, 20, "SECTEUR BACKEND", "PHP · JAVA · NODE.JS",     ZONES.backend.color,  Math.PI / 2);
  attachZoneAd(-22, -9.2, 15, "SECTEUR DATA",   "PYTHON · SQL",             ZONES.data.color,     Math.PI / 2);
  attachZoneAd(22, -4.6, 17, "SECTEUR SYSTÈME", "C++ · DOCKER",             ZONES.systeme.color, -Math.PI / 2);


  /* ── Magasins de rue (petits commerces avec enseigne néon) ── */
  function makeSignTexture(text, color) {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 64;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#050a14';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Réduit la taille de police si le texte est plus long que d'habitude
    // (évite que les enseignes plus longues type "METRO_LIGNE_01" débordent)
    let fontSize = 34;
    ctx.font = `bold ${fontSize}px "Space Mono", monospace`;
    while (ctx.measureText(text).width > c.width - 24 && fontSize > 16) {
      fontSize -= 2;
      ctx.font = `bold ${fontSize}px "Space Mono", monospace`;
    }
    ctx.shadowColor = color;
    ctx.shadowBlur = 18;
    ctx.fillStyle = color;
    ctx.fillText(text, c.width / 2, c.height / 2);
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  }

  const SHOP_TYPES = [
    { label: "NOODLE_BAR",  color: "#00f0ff" },
    { label: "CYBER_TECH",  color: "#00f0ff" },
    { label: "RAMEN_08",    color: "#ff44cc" },
    { label: "ARCADE",      color: "#00f0ff" },
    { label: "DATA_CAFE",   color: "#00f0ff" },
    { label: "IMPLANTS",    color: "#ff44cc" },
    { label: "MARKET_24",   color: "#00f0ff" },
    { label: "SUSHI_NET",   color: "#00f0ff" },
    { label: "PAWN_SHOP",   color: "#ff44cc" },
    { label: "SYNTH_BAR",   color: "#00f0ff" },
  ];

  const shops = [];
  function createShop(x, z, rotY, type) {
    const group = new THREE.Group();

    // Corps bas du commerce
    const w = 2.0, h = 1.7, depth = 1.6;
    const bodyGeo = new THREE.BoxGeometry(w, h, depth);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x141c2c, roughness: 0.7, metalness: 0.2
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = h / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Vitrine éclairée en façade
    const glassGeo = new THREE.PlaneGeometry(w * 0.8, h * 0.55);
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0xffdca0, emissive: 0xffb040, emissiveIntensity: 0.7,
      transparent: true, opacity: 0.8
    });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.set(0, h * 0.42, depth / 2 + 0.01);
    group.add(glass);

    // Auvent
    const awningGeo = new THREE.BoxGeometry(w + 0.3, 0.08, 0.55);
    const awningMat = new THREE.MeshStandardMaterial({ color: 0x1c2436, roughness: 0.8 });
    const awning = new THREE.Mesh(awningGeo, awningMat);
    awning.position.set(0, h * 0.78, depth / 2 + 0.3);
    group.add(awning);

    // Enseigne néon (texte généré sur canvas)
    const signTex = makeSignTexture(type.label, type.color);
    const signMat = new THREE.MeshBasicMaterial({ map: signTex, transparent: true });
    const signGeo = new THREE.PlaneGeometry(1.7, 0.42);
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, h + 0.32, depth / 2 - 0.15);
    group.add(sign);
    const signBack = sign.clone();
    signBack.rotation.y = Math.PI;
    group.add(signBack);

    // (Pas de vraie PointLight par magasin : l'enseigne et la vitrine
    // émissives suffisent, et ça évite d'ajouter ~20 lumières dynamiques.)

    group.position.set(x, 0, z);
    group.rotation.y = rotY;
    scene.add(group);
    shops.push(group);
    return group;
  }

  // Aligne les magasins le long des trottoirs des grandes avenues
  // (deux anneaux : ±16 et ±32) pour que la ville se sente plus vivante,
  // sans toucher à la grille dense du centre (risque de collision + perf)
  const shopSpots = [];
  [17.9, 33.9].forEach(offset => {
    for (let k = -38; k <= 38; k += 4.3) {
      if (Math.abs(k) < 3) continue;
      shopSpots.push({ x: k, z: offset,  ry: Math.PI });
      shopSpots.push({ x: k, z: -offset, ry: 0 });
      shopSpots.push({ x: offset,  z: k, ry: -Math.PI / 2 });
      shopSpots.push({ x: -offset, z: k, ry: Math.PI / 2 });
    }
  });
  const LANDMARK_EXCLUSIONS = [
    [-38, 8], [38, 8], [-8, -38],  // école, parc, parc
    [8, 38], [38, -8],             // gare, stade
  ];
  shopSpots.forEach((spot, i) => {
    if (Math.random() > 0.5) return; // ville dense mais pas surchargée
    const tooClose = LANDMARK_EXCLUSIONS.some(([lx, lz]) =>
      Math.hypot(spot.x - lx, spot.z - lz) < 7
    );
    if (tooClose) return;
    createShop(spot.x, spot.z, spot.ry, SHOP_TYPES[i % SHOP_TYPES.length]);
  });

  /* ── École / Campus + Parcs ──
     Placés dans le nouvel anneau extérieur (au-delà de l'avenue ±32),
     donc ça agrandit la ville sans densifier le centre. Géométries et
     matériaux des arbres partagés entre tous les parcs (comme les
     fenêtres des bâtiments) pour ne pas ajouter de coût inutile. */
  function createSchool(x, z, rotY) {
    const group = new THREE.Group();

    const bodyGeo = new THREE.BoxGeometry(9, 4.2, 5.5);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1b2334, roughness: 0.75, metalness: 0.15 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 2.1;
    group.add(body);

    // Colonnes de façade (peu nombreuses, pas de souci de perf)
    const colGeo = new THREE.CylinderGeometry(0.16, 0.16, 4.2, 8);
    const colMat = new THREE.MeshStandardMaterial({ color: 0x2e3447, roughness: 0.6 });
    [-3.6, -1.8, 0, 1.8, 3.6].forEach(cx => {
      const col = new THREE.Mesh(colGeo, colMat);
      col.position.set(cx, 2.1, 2.85);
      group.add(col);
    });

    // Auvent d'entrée
    const roofGeo = new THREE.BoxGeometry(9.6, 0.2, 1.4);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 0.35 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(0, 4.3, 2.85);
    group.add(roof);

    // Enseigne
    const signTex = makeSignTexture('CAMPUS_CODE', '#00f0ff');
    const signMat = new THREE.MeshBasicMaterial({ map: signTex, transparent: true });
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.85), signMat);
    sign.position.set(0, 5.1, 2.76);
    group.add(sign);

    group.position.set(x, 0, z);
    group.rotation.y = rotY;
    scene.add(group);
  }

  // Géométrie/matériaux d'arbre partagés — un seul jeu réutilisé partout
  const treeTrunkGeo = new THREE.CylinderGeometry(0.09, 0.13, 1.1, 6);
  const treeTrunkMat = new THREE.MeshStandardMaterial({ color: 0x2a1d14, roughness: 0.9 });
  const treeLeafGeo  = new THREE.ConeGeometry(0.75, 1.7, 7);
  const treeLeafMat  = new THREE.MeshStandardMaterial({ color: 0x0f3d24, emissive: 0x0a5c2e, emissiveIntensity: 0.25, roughness: 0.8 });

  function createTree(x, z) {
    const trunk = new THREE.Mesh(treeTrunkGeo, treeTrunkMat);
    trunk.position.set(x, 0.55, z);
    scene.add(trunk);
    const leaf = new THREE.Mesh(treeLeafGeo, treeLeafMat);
    leaf.position.set(x, 1.65, z);
    scene.add(leaf);
  }

  function createPark(x, z) {
    const grassGeo = new THREE.PlaneGeometry(9, 9);
    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x0e2417, roughness: 1,
      polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1
    });
    const grass = new THREE.Mesh(grassGeo, grassMat);
    grass.rotation.x = -Math.PI / 2;
    grass.position.set(x, 0.025, z);
    scene.add(grass);

    // Petite balise verte pour repérer le parc de loin (pas de PointLight, juste émissif)
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), new THREE.MeshStandardMaterial({
      color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 1.1
    }));
    beacon.position.set(x, 3, z);
    scene.add(beacon);

    // Quelques arbres répartis aléatoirement dans le parc (nombre limité)
    for (let i = 0; i < 7; i++) {
      createTree(x + (Math.random() - 0.5) * 6.5, z + (Math.random() - 0.5) * 6.5);
    }
  }

  // Une école + deux parcs dans le nouvel anneau extérieur (±38/±44),
  // hors des avenues, donc aucun risque de collision avec les routes
  createSchool(-38, 8, Math.PI / 2);
  createPark(38, 8);
  createPark(-8, -38);

  /* ── Ligne de métro aérienne : deux stations reliées par un seul rail
     continu (au lieu d'un unique segment isolé), avec une rame qui
     parcourt toute la ligne en va-et-vient. ── */
  const movingTrains = [];
  const METRO_COLOR = 0x2496ed;

  function createMetroPlatform(x, z, label) {
    const group = new THREE.Group();
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x2e3447, roughness: 0.6, metalness: 0.3 });

    const platGeo = new THREE.BoxGeometry(8, 0.4, 3);
    const platMat = new THREE.MeshStandardMaterial({ color: 0x1c2436, roughness: 0.8 });
    const plat = new THREE.Mesh(platGeo, platMat);
    plat.position.y = 0.2;
    group.add(plat);

    const canopyGeo = new THREE.BoxGeometry(8.4, 0.15, 3.4);
    const canopyMat = new THREE.MeshStandardMaterial({ color: METRO_COLOR, emissive: METRO_COLOR, emissiveIntensity: 0.3 });
    const canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.y = 3;
    group.add(canopy);

    const poleGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.8, 6);
    [[-3.8, -1.3], [3.8, -1.3], [-3.8, 1.3], [3.8, 1.3]].forEach(([px, pz]) => {
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(px, 1.6, pz);
      group.add(pole);
    });

    const signTex = makeSignTexture(label, '#2496ed');
    const signMat = new THREE.MeshBasicMaterial({ map: signTex, transparent: true });
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.85), signMat);
    sign.position.set(0, 3.7, 1.75);
    group.add(sign);
    const signBack = sign.clone();
    signBack.rotation.y = Math.PI;
    signBack.position.z = -1.75;
    group.add(signBack);

    group.position.set(x, 0, z);
    scene.add(group);
  }

  // Rail continu + pylônes entre deux points alignés sur le même axe
  // (x1===x2 → ligne verticale, z1===z2 → ligne horizontale), avec une
  // rame qui parcourt toute la distance entre les deux stations.
  const metroRailMat = new THREE.MeshStandardMaterial({ color: 0x333844, metalness: 0.7, roughness: 0.3 });
  const metroPillarMat = new THREE.MeshStandardMaterial({ color: 0x2e3447, roughness: 0.6, metalness: 0.3 });
  const metroPillarGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.4, 6);
  function createMetroTrack(x1, z1, x2, z2) {
    const horizontal = z1 === z2;
    const length = horizontal ? Math.abs(x2 - x1) : Math.abs(z2 - z1);
    const midX = (x1 + x2) / 2, midZ = (z1 + z2) / 2;

    const railGeo = new THREE.BoxGeometry(horizontal ? length : 0.3, 0.15, horizontal ? 0.3 : length);
    [-0.5, 0.5].forEach(side => {
      const rail = new THREE.Mesh(railGeo, metroRailMat);
      rail.position.set(midX + (horizontal ? 0 : side), 1.4, midZ + (horizontal ? side : 0));
      scene.add(rail);
    });
    for (let d = -length / 2; d <= length / 2; d += 5) {
      const pillar = new THREE.Mesh(metroPillarGeo, metroPillarMat);
      pillar.position.set(midX + (horizontal ? d : 0), 0.7, midZ + (horizontal ? 0 : d));
      scene.add(pillar);
    }

    // Rame qui glisse d'un bout à l'autre de la ligne (pas de lumière, juste émissif)
    const train = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.85, 0.85),
      new THREE.MeshStandardMaterial({ color: METRO_COLOR, emissive: METRO_COLOR, emissiveIntensity: 0.5, metalness: 0.4, roughness: 0.4 })
    );
    train.position.set(midX, 1.85, midZ);
    scene.add(train);
    const range = length / 2 - 1.5;
    movingTrains.push({
      mesh: train, centerX: midX, centerZ: midZ,
      rangeX: horizontal ? range : 0, rangeZ: horizontal ? 0 : range,
      phase: Math.random() * Math.PI * 2
    });
  }

  createMetroPlatform(8, 38, 'STATION_EST');
  createMetroPlatform(-26, 38, 'STATION_OUEST');
  createMetroTrack(-26, 38, 22, 38);

  /* ── Stade e-sport ── */
  function createStadium(x, z) {
    const group = new THREE.Group();
    const wall = new THREE.Mesh(
      new THREE.CylinderGeometry(5, 5.6, 2.6, 24, 1, true),
      new THREE.MeshStandardMaterial({ color: 0x14203a, roughness: 0.7, side: THREE.DoubleSide })
    );
    wall.position.y = 1.3;
    group.add(wall);

    const roof = new THREE.Mesh(
      new THREE.RingGeometry(3.2, 5.8, 24),
      new THREE.MeshStandardMaterial({ color: 0x0d1424, roughness: 0.6, side: THREE.DoubleSide })
    );
    roof.rotation.x = -Math.PI / 2;
    roof.position.y = 2.65;
    group.add(roof);

    const screenTex = makeSignTexture('ESPORT_ARENA', '#ff44cc');
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(4, 1), new THREE.MeshBasicMaterial({ map: screenTex, transparent: true }));
    screen.position.set(0, 2, 5.3);
    group.add(screen);

    // Fine bande lumineuse à la base (accent néon du stade, pas un halo de zone)
    const baseRing = new THREE.Mesh(
      new THREE.RingGeometry(5.5, 5.65, 24),
      new THREE.MeshBasicMaterial({ color: 0xff44cc, transparent: true, opacity: 0.6, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    baseRing.rotation.x = -Math.PI / 2;
    baseRing.position.y = 0.04;
    group.add(baseRing);

    group.position.set(x, 0, z);
    scene.add(group);
  }
  createStadium(38, -8);

  /* ── Panneaux publicitaires holographiques ── */
  const BILLBOARD_ADS = [
    { text: 'REACT_PRO', color: '#00f0ff' },
    { text: 'DOCKER++',  color: '#00f0ff' },
    { text: 'PY_DATA',   color: '#ff44cc' },
    { text: 'NODE_X',    color: '#00f0ff' },
  ];
  function createBillboard(x, z, rotY, ad) {
    const tex = makeSignTexture(ad.text, ad.color);
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(3.4, 0.9),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide })
    );
    plane.position.set(x, 6.4, z);
    plane.rotation.y = rotY;
    scene.add(plane);
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 6.3, 6),
      new THREE.MeshStandardMaterial({ color: 0x222831 })
    );
    pole.position.set(x, 3.15, z);
    scene.add(pole);
  }
  const billboardSpots = [[10, 32, 0], [-10, -32, Math.PI], [32, -10, Math.PI / 2], [-32, 10, -Math.PI / 2]];
  BILLBOARD_ADS.forEach((ad, i) => createBillboard(...billboardSpots[i], ad));

  /* ── Rivière + pont, en bordure de ville (au-delà de l'anneau ±44) ── */
  function createRiver() {
    const river = new THREE.Mesh(
      new THREE.PlaneGeometry(140, 9),
      new THREE.MeshStandardMaterial({
        color: 0x02121e, emissive: 0x005468, emissiveIntensity: 0.3,
        roughness: 0.4, metalness: 0.4, transparent: true, opacity: 0.92,
        polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1
      })
    );
    river.rotation.x = -Math.PI / 2;
    river.position.set(0, 0.03, 54);
    scene.add(river);

    // Berges lumineuses sur toute la longueur, pour bien voir où est l'eau
    const bankGeo = new THREE.BoxGeometry(140, 0.1, 0.15);
    const bankMat = new THREE.MeshStandardMaterial({ color: 0x00c4e0, emissive: 0x00c4e0, emissiveIntensity: 0.7 });
    [4.6, -4.6].forEach(offset => {
      const bank = new THREE.Mesh(bankGeo, bankMat);
      bank.position.set(0, 0.08, 54 + offset);
      scene.add(bank);
    });

    const bridge = new THREE.Mesh(
      new THREE.PlaneGeometry(3, 11),
      new THREE.MeshStandardMaterial({
        color: 0x1a2233, roughness: 0.8,
        polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2
      })
    );
    bridge.rotation.x = -Math.PI / 2;
    bridge.position.set(0, 0.045, 54);
    scene.add(bridge);

    const railGeo = new THREE.BoxGeometry(3.2, 0.12, 0.06);
    const railMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 0.7 });
    [4.6, -4.6].forEach(offset => {
      const rail = new THREE.Mesh(railGeo, railMat);
      rail.position.set(0, 0.5, 54 + offset);
      scene.add(rail);
    });
  }
  createRiver();
  // Petite route de raccord entre la dernière avenue (±44) et le pont (54)
  addRoad(0, 49, 2.4, 10);

  /* ── Montagnes lointaines (silhouette à l'horizon, tout autour de la
     ville) — juste des cônes low-poly partageant un seul matériau, dont
     la couleur suit le cycle jour/nuit. Elles se fondent dans le
     brouillard, ce qui donne justement l'effet "paysage au loin". ── */
  const mountainMat = new THREE.MeshBasicMaterial({ color: 0x16233e, fog: true });
  const mountainGroup = new THREE.Group();
  for (let i = 0; i < 28; i++) {
    const ang = (i / 28) * Math.PI * 2 + (Math.random() - 0.5) * 0.15;
    const dist = 160 + Math.random() * 60;
    const h = 28 + Math.random() * 32;
    const r = 22 + Math.random() * 18;
    const peak = new THREE.Mesh(new THREE.ConeGeometry(r, h, 5), mountainMat);
    peak.position.set(Math.cos(ang) * dist, h / 2 - 2, Math.sin(ang) * dist);
    peak.rotation.y = Math.random() * Math.PI;
    mountainGroup.add(peak);
  }
  scene.add(mountainGroup);

  /* ── Monument central (rond-point au croisement des avenues) ── */
  let monumentGroup = null;
  function createMonument() {
    const group = new THREE.Group();
    [[0x00f0ff, 0], [0x00f0ff, 1], [0xff44cc, 2]].forEach(([c, i]) => {
      const torus = new THREE.Mesh(
        new THREE.TorusGeometry(1.1 - i * 0.25, 0.05, 8, 32),
        new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.9 })
      );
      torus.position.y = 3 + i * 1.1;
      torus.rotation.x = Math.PI / 2 + i * 0.3;
      group.add(torus);
    });
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(1.3, 1.5, 0.6, 16),
      new THREE.MeshStandardMaterial({ color: 0x1c2436, roughness: 0.7 })
    );
    base.position.y = 0.3;
    group.add(base);
    group.position.set(0, 0, 0);
    scene.add(group);
    monumentGroup = group;
  }
  createMonument();

  /* ── Particules atmosphériques ── */
  const PARTICLE_COUNT = 350;
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    pPos[i * 3]     = (Math.random() - 0.5) * 90;
    pPos[i * 3 + 1] = Math.random() * 30;
    pPos[i * 3 + 2] = (Math.random() - 0.5) * 90;
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const pMat = new THREE.PointsMaterial({ color: 0x00f0ff, size: 0.08, transparent: true, opacity: 0.5 });
  const particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  /* ── Nuages (visibles uniquement en mode jour) ──
     Un seul matériau/texture partagé pour tous les sprites — coût quasi
     nul. Ils dérivent lentement et réapparaissent de l'autre côté, donc
     ça ne s'arrête jamais (comme la ville, ça doit sembler infini). ── */
  function makeCloudTexture() {
    const c = document.createElement('canvas');
    c.width = 128; c.height = 64;
    const ctx = c.getContext('2d');
    const grad = ctx.createRadialGradient(64, 32, 4, 64, 32, 60);
    grad.addColorStop(0, 'rgba(255,255,255,0.9)');
    grad.addColorStop(0.6, 'rgba(255,255,255,0.35)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(64, 32, 60, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    return new THREE.CanvasTexture(c);
  }
  const cloudMat = new THREE.SpriteMaterial({ map: makeCloudTexture(), transparent: true, opacity: 0, depthWrite: false });
  const clouds = [];
  for (let i = 0; i < 12; i++) {
    const spr = new THREE.Sprite(cloudMat);
    const s = 16 + Math.random() * 12;
    spr.scale.set(s, s * 0.45, 1);
    spr.position.set((Math.random() - 0.5) * 320, 42 + Math.random() * 22, (Math.random() - 0.5) * 320);
    scene.add(spr);
    clouds.push({ sprite: spr, speed: 0.12 + Math.random() * 0.15 });
  }

  /* ── Oiseaux (idem, uniquement en mode jour) — silhouette simple en
     forme de "M", tournent en cercle au-dessus de la ville ── */
  function makeBirdTexture() {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 32;
    const ctx = c.getContext('2d');
    ctx.strokeStyle = 'rgba(15,20,28,0.85)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(4, 20);
    ctx.quadraticCurveTo(18, 4, 32, 15);
    ctx.quadraticCurveTo(46, 4, 60, 20);
    ctx.stroke();
    return new THREE.CanvasTexture(c);
  }
  const birdMat = new THREE.SpriteMaterial({ map: makeBirdTexture(), transparent: true, opacity: 0, depthWrite: false });
  const BIRD_COUNT = 7;
  const birds = [];
  for (let i = 0; i < BIRD_COUNT; i++) {
    const spr = new THREE.Sprite(birdMat);
    spr.scale.set(2.2, 1.1, 1);
    scene.add(spr);
    // Phase répartie uniformément sur le cercle (+ un peu d'aléatoire) et
    // rayon/hauteur/sens de rotation qui varient par bande, pour que les
    // oiseaux restent bien séparés au lieu de se regrouper par hasard.
    const evenPhase = (i / BIRD_COUNT) * Math.PI * 2;
    const band = i % 3;
    birds.push({
      sprite: spr,
      radius: 14 + band * 12 + Math.random() * 5,
      height: 16 + band * 5 + Math.random() * 3,
      speed: (0.55 + Math.random() * 0.35) * (i % 2 === 0 ? 1 : -1),
      phase: evenPhase + (Math.random() - 0.5) * 0.4,
      flapPhase: Math.random() * Math.PI * 2
    });
  }

  /* ── Orbite caméra pilotée par la souris ── */
  const orbit = {
    theta: Math.PI / 4,
    phi:   0.95,
    radius: 44,
  };
  const DEFAULT_RADIUS = 44;
  const orbitSmooth = { theta: orbit.theta, phi: orbit.phi, radius: orbit.radius };
  const THETA_RANGE = Math.PI * 2.0;
  const PHI_RANGE   = Math.PI * 0.55;

  // Point regardé par la caméra (glisse vers un bâtiment quand on "voyage" vers lui)
  const focusTarget       = new THREE.Vector3(0, 2, 0);
  const focusTargetSmooth = new THREE.Vector3(0, 2, 0);
  let focused = false; // tant que true, la souris ne pilote plus l'angle

  window.addEventListener('mousemove', (e) => {
    if (focused) return;
    const nx = e.clientX / window.innerWidth;
    const ny = e.clientY / window.innerHeight;
    orbit.theta = nx * THETA_RANGE;
    orbit.phi   = 0.35 + ny * PHI_RANGE;
  });

  /* ── Raycasting (hover + click) ── */
  const raycaster = new THREE.Raycaster();
  const mouse     = new THREE.Vector2(-9999, -9999);
  const tooltip   = document.getElementById('tooltip-3d');
  let hoveredBuilding = null;
  let selectedBuilding = null;

  // Mesh bodies pour raycasting
  const bodyMeshes = buildings.map(g => g.userData.body);

  function setTooltip(group, px, py) {
    const job = group.userData.job;
    document.getElementById('tt-id').textContent   = `ID: ${job.name.toUpperCase().replace(' ', '_')}_${Math.floor(Math.random()*99).toString().padStart(2,'0')}`;
    document.getElementById('tt-icon').textContent = job.icon;
    document.getElementById('tt-name').textContent = job.name;
    document.getElementById('tt-sub').textContent  = job.sub;
    document.getElementById('tt-bar').style.width  = (40 + Math.random() * 50) + '%';
    tooltip.style.left    = px + 'px';
    tooltip.style.top     = py + 'px';
    tooltip.style.display = 'block';
  }

  canvas.addEventListener('mousemove', (e) => {
    if (document.body.classList.contains('hud-hidden')) {
      tooltip.style.display = 'none';
      return;
    }
    mouse.x =  (e.clientX / window.innerWidth)  * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    // Tilt CSS subtil des panneaux (jamais sur la sidebar : son "transform"
    // sert aussi à la fermer/l'ouvrir, l'écraser ici la faisait ressortir
    // dès qu'on survolait la ville)
    const nx2 = (e.clientX / window.innerWidth)  * 2 - 1;
    const ny2 = (e.clientY / window.innerHeight) * 2 - 1;
    document.querySelectorAll('.glass-panel:not(#left-sidebar)').forEach(p => {
      p.style.transform = `perspective(900px) rotateY(${nx2 * 2}deg) rotateX(${-ny2 * 1.5}deg)`;
    });

    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(bodyMeshes);

    if (hits.length) {
      const idx = bodyMeshes.indexOf(hits[0].object);
      const grp = buildings[idx];
      if (hoveredBuilding !== grp) {
        if (hoveredBuilding && hoveredBuilding !== selectedBuilding) resetHighlight(hoveredBuilding);
        hoveredBuilding = grp;
        highlightBuilding(grp, 0.25);
        canvas.style.cursor = 'pointer';
      }
      setTooltip(grp, e.clientX, e.clientY);
    } else {
      if (hoveredBuilding && hoveredBuilding !== selectedBuilding) resetHighlight(hoveredBuilding);
      hoveredBuilding = null;
      tooltip.style.display = 'none';
      canvas.style.cursor = 'default';
    }
  });

  canvas.addEventListener('click', (e) => {
    if (document.body.classList.contains('hud-hidden')) return;
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(bodyMeshes);
    if (hits.length) {
      const idx = bodyMeshes.indexOf(hits[0].object);
      const grp = buildings[idx];
      focusOnBuilding(grp);
      window.dispatchEvent(new CustomEvent('buildingSelected', { detail: { job: grp.userData.job } }));
    } else {
      unfocus();
    }
  });

  function highlightBuilding(grp, intensity) {
    grp.userData.body.material.emissiveIntensity = intensity;
    grp.userData.edgesMat.opacity = 1.0;
  }
  function resetHighlight(grp) {
    grp.userData.body.material.emissiveIntensity = 0.04;
    grp.userData.edgesMat.opacity = 0.5;
  }

  // Convertit la position locale d'un bâtiment en position monde (tient compte de la rotation auto de la ville)
  function worldPosOf(grp) {
    const ry = buildingGroup.rotation.y;
    const x = grp.position.x, z = grp.position.z;
    return {
      x: x * Math.cos(ry) + z * Math.sin(ry),
      z: -x * Math.sin(ry) + z * Math.cos(ry),
    };
  }

  // Envoie la caméra "voyager" jusqu'à un bâtiment précis
  function focusOnBuilding(grp) {
    if (!grp) return;
    if (selectedBuilding && selectedBuilding !== grp) resetHighlight(selectedBuilding);
    selectedBuilding = grp;
    highlightBuilding(grp, 0.9);
    focused = true;

    const wp = worldPosOf(grp);
    const dist = Math.sqrt(wp.x * wp.x + wp.z * wp.z);
    const h = grp.userData.body.geometry.parameters.height;

    // Angle de base qui regarde le bâtiment, + décalage aléatoire pour arriver
    // sous un angle 3/4 différent à chaque fois (jamais la même vue du dessus)
    const baseTheta   = Math.atan2(wp.x, wp.z);
    const cornerSign  = Math.random() > 0.5 ? 1 : -1;
    const cornerAngle = (Math.PI / 5) + Math.random() * (Math.PI / 6); // 36°→~65°
    orbit.theta  = baseTheta + cornerSign * cornerAngle;
    orbit.phi    = 0.48 + Math.random() * 0.16; // vue plus horizontale, pas plongeante
    orbit.radius = dist + 7 + h * 0.18;
    focusTarget.set(wp.x, h * 0.35, wp.z);
  }

  // Reprend le contrôle libre de la souris
  function unfocus() {
    if (selectedBuilding) resetHighlight(selectedBuilding);
    selectedBuilding = null;
    focused = false;
    orbit.radius = DEFAULT_RADIUS;
    focusTarget.set(0, 2, 0);
  }

  /* ── Effets liés au scroll : fondu du HUD + caméra qui décolle ── */
  let scrollZoom = 0; // 0 → en haut, 1 → scrollé au maximum de l'effet
  window.addEventListener('scroll', () => {
    const vh = window.innerHeight;
    const p = Math.min(1, window.scrollY / (vh * 0.9));
    scrollZoom = p;
    document.body.classList.toggle('hud-hidden', p > 0.5);
    document.querySelectorAll('.hud-fade').forEach(el => { el.style.opacity = 1 - p; });
  }, { passive: true });

  /* ── Révélation 3D des sections au scroll ── */
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('in-view');
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal-3d').forEach(el => sectionObserver.observe(el));

  /* ── Mode Jour / Nuit : basculé manuellement via un bouton, transition
     douce (~2s) entre les deux ambiances. Contraste volontairement fort
     pour que la différence se voie vraiment (contrairement à l'ancien
     cycle automatique, trop subtil). ── */
  let dayMode = false;
  let dayFactor = 0; // 0 = nuit, 1 = jour — interpolé en douceur, pilote l'opacité nuages/oiseaux
  const NIGHT_FOG = new THREE.Color(0x121b30);
  const DAY_FOG   = new THREE.Color(0x8fd0f0);
  const NIGHT_AMBIENT = new THREE.Color(0x24406e);
  const DAY_AMBIENT   = new THREE.Color(0xeaf6ff);
  const NIGHT_SUN = new THREE.Color(0x00f0ff);
  const DAY_SUN   = new THREE.Color(0xfff2d0);
  const NIGHT_FOG_DENSITY = 0.013, DAY_FOG_DENSITY = 0.006;
  const NIGHT_AMBIENT_INTENSITY = 1.1, DAY_AMBIENT_INTENSITY = 1.3;
  const NIGHT_SUN_INTENSITY = 0.85, DAY_SUN_INTENSITY = 1.15;
  const NIGHT_MOUNTAIN = new THREE.Color(0x16233e);
  const DAY_MOUNTAIN   = new THREE.Color(0x6f97ba);

  /* ── Mini-carte ── */
  const minimapCanvas = document.getElementById('minimap-canvas');
  const minimapCtx = minimapCanvas ? minimapCanvas.getContext('2d') : null;
  const MINIMAP_ZONES = [
    [15, 15, '#00f0ff'], [-15, 15, '#ff44cc'], [-15, -15, '#00f0ff'], [15, -15, '#00f0ff']
  ];
  function drawMinimap() {
    const W = minimapCanvas.width, H = minimapCanvas.height;
    const scale = W / 150; // couvre environ -75..75 en X/Z
    minimapCtx.clearRect(0, 0, W, H);
    minimapCtx.fillStyle = 'rgba(12,19,36,0.5)';
    minimapCtx.fillRect(0, 0, W, H);

    // Zones
    MINIMAP_ZONES.forEach(([zx, zz, col]) => {
      minimapCtx.fillStyle = col;
      minimapCtx.beginPath();
      minimapCtx.arc(W / 2 + zx * scale, H / 2 + zz * scale, 4, 0, Math.PI * 2);
      minimapCtx.fill();
    });

    // Position actuelle de la caméra dans la ville
    const camPx = Math.max(3, Math.min(W - 3, W / 2 + camera.position.x * scale));
    const camPy = Math.max(3, Math.min(H - 3, H / 2 + camera.position.z * scale));
    minimapCtx.fillStyle = '#dbfcff';
    minimapCtx.beginPath();
    minimapCtx.arc(camPx, camPy, 3.5, 0, Math.PI * 2);
    minimapCtx.fill();
    minimapCtx.strokeStyle = 'rgba(219,252,255,0.35)';
    minimapCtx.beginPath();
    minimapCtx.arc(camPx, camPy, 6, 0, Math.PI * 2);
    minimapCtx.stroke();
  }
  let frameCount = 0;

  /* ── Animation loop ── */
  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    t += 0.01;

    // Transition douce vers le mode jour ou nuit (lerp à chaque frame)
    const targetFog    = dayMode ? DAY_FOG    : NIGHT_FOG;
    const targetAmb     = dayMode ? DAY_AMBIENT : NIGHT_AMBIENT;
    const targetSunCol  = dayMode ? DAY_SUN    : NIGHT_SUN;
    const targetFogDensity  = dayMode ? DAY_FOG_DENSITY  : NIGHT_FOG_DENSITY;
    const targetAmbInt      = dayMode ? DAY_AMBIENT_INTENSITY : NIGHT_AMBIENT_INTENSITY;
    const targetSunInt      = dayMode ? DAY_SUN_INTENSITY : NIGHT_SUN_INTENSITY;
    const T = 0.025;
    scene.fog.color.lerp(targetFog, T);
    scene.fog.density += (targetFogDensity - scene.fog.density) * T;
    renderer.setClearColor(scene.fog.color, 1);
    ambient.color.lerp(targetAmb, T);
    ambient.intensity += (targetAmbInt - ambient.intensity) * T;
    sun.color.lerp(targetSunCol, T);
    sun.intensity += (targetSunInt - sun.intensity) * T;
    mountainMat.color.lerp(dayMode ? DAY_MOUNTAIN : NIGHT_MOUNTAIN, T);
    dayFactor += ((dayMode ? 1 : 0) - dayFactor) * T;

    // Nuages : dérive lente, réapparaissent de l'autre côté (jamais de fin)
    cloudMat.opacity = dayFactor * 0.85;
    if (dayFactor > 0.01) {
      clouds.forEach(c => {
        c.sprite.position.x += c.speed * 0.04;
        if (c.sprite.position.x > 170) c.sprite.position.x = -170;
      });
    }

    // Oiseaux : tournent en cercle au-dessus de la ville, à vitesse bien visible
    birdMat.opacity = dayFactor;
    if (dayFactor > 0.01) {
      birds.forEach(b => {
        const ang = t * b.speed + b.phase;
        b.sprite.position.set(Math.cos(ang) * b.radius, b.height + Math.sin(t * 3 + b.flapPhase) * 0.4, Math.sin(ang) * b.radius);
        // Petit "battement d'ailes" : la silhouette s'aplatit puis s'étire
        const flap = 1 + Math.sin(t * 9 + b.flapPhase) * 0.25;
        b.sprite.scale.set(2.2, 1.1 * flap, 1);
      });
    }

    // Orbite sphérique lissée (LERP faible = mouvement plus long/fluide)
    const LERP = 0.02;
    const FOCUS_LERP = 0.035;
    // Cible du rayon : s'éloigne + prend de la hauteur quand on scroll (sauf en mode focus)
    const scrollRadiusTarget = focused ? orbit.radius : DEFAULT_RADIUS + scrollZoom * 55;
    const scrollPhiTarget    = focused ? orbit.phi    : Math.max(0.2, orbit.phi - scrollZoom * 0.35);
    // Lerp angulaire (gestion du wrap 0/2π pour éviter le saut)
    let dt = orbit.theta - orbitSmooth.theta;
    if (dt >  Math.PI) dt -= Math.PI * 2;
    if (dt < -Math.PI) dt += Math.PI * 2;
    orbitSmooth.theta += dt * (focused ? FOCUS_LERP : LERP);
    orbitSmooth.phi   += (scrollPhiTarget    - orbitSmooth.phi)   * (focused ? FOCUS_LERP : 0.035);
    orbitSmooth.radius += (scrollRadiusTarget - orbitSmooth.radius) * (focused ? FOCUS_LERP : 0.035);
    focusTargetSmooth.lerp(focusTarget, FOCUS_LERP);

    camera.position.x = orbitSmooth.radius * Math.sin(orbitSmooth.phi) * Math.sin(orbitSmooth.theta);
    camera.position.y = orbitSmooth.radius * Math.cos(orbitSmooth.phi);
    camera.position.z = orbitSmooth.radius * Math.sin(orbitSmooth.phi) * Math.cos(orbitSmooth.theta);
    camera.lookAt(focusTargetSmooth);

    // La ville ne tourne plus sur elle-même : les bâtiments restent à leur
    // place (les particules gardent une légère rotation, purement décorative).
    particles.rotation.y += 0.0003;

    // Clignotement toits
    buildings.forEach((g, i) => {
      const roof = g.userData.roof;
      if (roof) roof.material.emissiveIntensity = 0.4 + 0.3 * Math.sin(t * 1.5 + i * 0.7);
    });

    // Particules flottantes
    const pp = pGeo.attributes.position.array;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pp[i * 3 + 1] += 0.008;
      if (pp[i * 3 + 1] > 25) pp[i * 3 + 1] = 0;
    }
    pGeo.attributes.position.needsUpdate = true;

    // Rame(s) de métro (va-et-vient sur toute la ligne)
    movingTrains.forEach(tr => {
      const s = Math.sin(t * 0.4 + tr.phase);
      tr.mesh.position.x = tr.centerX + s * tr.rangeX;
      tr.mesh.position.z = tr.centerZ + s * tr.rangeZ;
    });

    // Rotation lente du monument central
    if (monumentGroup) monumentGroup.rotation.y += 0.003;

    // Mini-carte (canvas 2D, une frame sur 4 seulement — inutile de la
    // redessiner à 60fps pour un simple point qui bouge doucement)
    frameCount++;
    if (minimapCtx && frameCount % 4 === 0) drawMinimap();

    renderer.render(scene, camera);
  }
  animate();

  /* ── Réaction événements UI ── */
  window.addEventListener('buildingSelected', (e) => {
    const job = e.detail.job;

    // Titre panneau
    const titleEl = document.getElementById('main-panel-title');
    titleEl.textContent = job.name.toUpperCase() + '_LINK';
    titleEl.classList.add('animate-pulse');
    setTimeout(() => titleEl.classList.remove('animate-pulse'), 1200);

    // Syncing
    const sync = document.getElementById('syncing-indicator');
    sync.classList.remove('hidden');
    setTimeout(() => sync.classList.add('hidden'), 2200);

    // Panneau sélection
    document.getElementById('sel-job').textContent   = job.name;
    document.getElementById('sel-count').textContent = job.count;
    document.getElementById('sel-trend').textContent = job.trend;
    document.getElementById('sel-zone').textContent  = job.zone;

    // Onglet sidebar
    document.querySelectorAll('#side-nav button').forEach(btn => {
      const label = btn.dataset.label || '';
      const match = job.name.toLowerCase() === label.toLowerCase();
      if (match) setActiveButton(btn);
      else if (btn.classList.contains('nav-btn-active')) {
        btn.className = btn.className.replace('nav-btn-active', 'nav-btn-idle');
        const s = btn.querySelector('.ml-auto'); if (s) s.remove();
      }
    });
  });

  function setActiveButton(btn) {
    document.querySelectorAll('#side-nav button').forEach(b => {
      b.className = 'nav-btn-idle w-full flex items-center gap-3 px-3 py-2.5 font-mono text-[11px] uppercase tracking-widest transition-all duration-200';
      const s = b.querySelector('.ml-auto'); if (s) s.remove();
    });
    btn.className = 'nav-btn-active w-full flex items-center gap-3 px-3 py-2.5 font-mono text-[11px] uppercase tracking-widest transition-all duration-200';
    const tag = document.createElement('span');
    tag.className = 'ml-auto text-[8px] opacity-50';
    tag.textContent = 'ACTIVE';
    btn.appendChild(tag);
  }

  document.querySelectorAll('#side-nav button').forEach(btn => {
    btn.addEventListener('click', () => {
      setActiveButton(btn);
      const jobName = btn.dataset.job;
      const job = JOBS.find(j => j.name === jobName) || { name: jobName, count: '—', trend: '—', zone: '—', icon: '◈' };
      document.getElementById('sel-job').textContent   = job.name;
      document.getElementById('sel-count').textContent = job.count;
      document.getElementById('sel-trend').textContent = job.trend;
      document.getElementById('sel-zone').textContent  = job.zone;
      document.getElementById('main-panel-title').textContent = job.name.toUpperCase() + '_LINK';

      // La caméra se déplace vers un bâtiment de ce secteur
      const candidates = buildings.filter(g => g.userData.job.name === job.name);
      if (candidates.length) {
        const grp = candidates[Math.floor(Math.random() * candidates.length)];
        focusOnBuilding(grp);
      }
      closeMobileMenu();
    });
  });

  // Latence aléatoire pour le fun
  setInterval(() => {
    document.getElementById('latency').textContent = (8 + Math.floor(Math.random() * 20)) + 'ms';
  }, 2000);

  // Hover glasspanels
  document.querySelectorAll('.glass-panel, aside').forEach(el => {
    el.addEventListener('mouseenter', () => {
      el.style.borderColor = 'rgba(0,240,255,0.45)';
      el.style.boxShadow   = '0 0 18px rgba(0,240,255,0.12)';
    });
    el.addEventListener('mouseleave', () => {
      el.style.borderColor = '';
      el.style.boxShadow   = '';
    });
  });

  /* ── Menu (tiroir) : caché par défaut, s'ouvre au tap sur ☰,
     se referme via le bouton ✕, le fond noir, ou un nouveau tap sur ☰ ── */
  const leftSidebar     = document.getElementById('left-sidebar');
  const sidebarBackdrop = document.getElementById('sidebar-backdrop');
  const menuToggle      = document.getElementById('menu-toggle');
  const sidebarClose    = document.getElementById('sidebar-close');
  let sidebarIsOpen = false;
  let sidebarOpenedAt = 0;

  function openMobileMenu() {
    sidebarIsOpen = true;
    sidebarOpenedAt = Date.now();
    leftSidebar.style.transform = 'translateX(0)';
    sidebarBackdrop.classList.remove('hidden');
  }
  function closeMobileMenu() {
    sidebarIsOpen = false;
    leftSidebar.style.transform = 'translateX(-150%)';
    sidebarBackdrop.classList.add('hidden');
  }
  function toggleMobileMenu(e) {
    if (e) e.stopPropagation();
    if (sidebarIsOpen) closeMobileMenu(); else openMobileMenu();
  }
  if (menuToggle) menuToggle.addEventListener('click', toggleMobileMenu);
  if (sidebarClose) sidebarClose.addEventListener('click', (e) => {
    e.stopPropagation();
    closeMobileMenu();
  });
  if (sidebarBackdrop) sidebarBackdrop.addEventListener('click', (e) => {
    e.stopPropagation();
    // Ignore un clic "fantôme" qui suivrait à moins de 300ms l'ouverture :
    // c'est ce qui faisait se refermer le menu juste après l'avoir ouvert
    // sur certains mobiles (double événement tactile).
    if (Date.now() - sidebarOpenedAt < 300) return;
    closeMobileMenu();
  });
  if (leftSidebar) leftSidebar.addEventListener('click', (e) => e.stopPropagation());

  /* ── Vue ville seule : cache toute l'UI, ne garde que la 3D ── */
  const cityViewToggle = document.getElementById('city-view-toggle');
  const eyeIcon    = document.getElementById('city-view-icon-eye');
  const eyeOffIcon = document.getElementById('city-view-icon-eye-off');
  if (cityViewToggle) {
    cityViewToggle.addEventListener('click', () => {
      const active = document.body.classList.toggle('city-only-view');
      eyeIcon.classList.toggle('hidden', active);
      eyeOffIcon.classList.toggle('hidden', !active);
      if (active) closeMobileMenu();
    });
  }

  /* ── Mode Jour / Nuit ── */
  const daynightToggle = document.getElementById('daynight-toggle');
  const moonIcon = document.getElementById('daynight-icon-moon');
  const sunIcon  = document.getElementById('daynight-icon-sun');
  if (daynightToggle) {
    daynightToggle.addEventListener('click', () => {
      dayMode = !dayMode;
      moonIcon.classList.toggle('hidden', dayMode);
      sunIcon.classList.toggle('hidden', !dayMode);
    });
  }

  /* ── Support tactile : tap sur un bâtiment = sélection ──
     (le drag/scroll normal du doigt n'est jamais bloqué : écouteurs "passive") */
  let touchStart = null;
  canvas.addEventListener('touchstart', (e) => {
    const t = e.changedTouches[0];
    touchStart = { x: t.clientX, y: t.clientY };
  }, { passive: true });

  canvas.addEventListener('touchend', (e) => {
    if (!touchStart) return;
    if (document.body.classList.contains('hud-hidden')) { touchStart = null; return; }
    const t = e.changedTouches[0];
    const moved = Math.hypot(t.clientX - touchStart.x, t.clientY - touchStart.y);
    touchStart = null;
    if (moved > 12) return; // c'était un scroll, pas un tap

    mouse.x =  (t.clientX / window.innerWidth)  * 2 - 1;
    mouse.y = -(t.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(bodyMeshes);
    if (hits.length) {
      const idx = bodyMeshes.indexOf(hits[0].object);
      const grp = buildings[idx];
      focusOnBuilding(grp);
      window.dispatchEvent(new CustomEvent('buildingSelected', { detail: { job: grp.userData.job } }));
    } else {
      unfocus();
    }
  }, { passive: true });
})();
