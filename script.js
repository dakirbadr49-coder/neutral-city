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
    { name: "Docker",      color: 0x2496ed, sub: "Secteur Système",   count: "1,680", trend: "↑ +14%", zone: "Zone Gamma",   icon: "DK",  zoneId: "systeme" },
  ];

  const JOBS_BY_ZONE = {};
  Object.keys(ZONES).forEach(zid => { JOBS_BY_ZONE[zid] = JOBS.filter(j => j.zoneId === zid); });

  /* ── Simulation de ville jouable ──
     État séparé de JOBS/la grille tech (qui reste 100% portfolio, jamais
     touchée par la simulation). Argent, population, satisfaction,
     pollution, énergie/eau, persistés en localStorage. */
  const SIM_VERSION = 1;
  const SIM_STORAGE_KEY = 'neuralCitySim.v1';
  const SIM_TICK_MS = 2000;

  const SIM_BUILDING_TYPES = {
    residential: { label: 'Résidentiel',      cost: 400,  color: 0x8fd0f0, population: 40, jobsMoney: 0,  energyUse: 8,  waterUse: 6,  energySupply: 0,  waterSupply: 0,  pollution: 2,   satisfactionBase: 0,  upkeep: 5  },
    commercial:  { label: 'Commercial',       cost: 600,  color: 0xffe27a, population: 0,  jobsMoney: 25, energyUse: 10, waterUse: 4,  energySupply: 0,  waterSupply: 0,  pollution: 4,   satisfactionBase: 2,  upkeep: 8  },
    industrial:  { label: 'Industriel',       cost: 800,  color: 0xff8a44, population: 0,  jobsMoney: 60, energyUse: 18, waterUse: 10, energySupply: 0,  waterSupply: 0,  pollution: 14,  satisfactionBase: -4, upkeep: 12 },
    power:       { label: 'Centrale Énergie', cost: 1200, color: 0x00f0ff, population: 0,  jobsMoney: 0,  energyUse: 0,  waterUse: 2,  energySupply: 60, waterSupply: 0,  pollution: 10,  satisfactionBase: -2, upkeep: 20 },
    water:       { label: "Station d'Eau",    cost: 900,  color: 0x44ccff, population: 0,  jobsMoney: 0,  energyUse: 6,  waterUse: 0,  energySupply: 0,  waterSupply: 50, pollution: 1,   satisfactionBase: 1,  upkeep: 15 },
    park:        { label: 'Parc',             cost: 300,  color: 0x0f3d24, population: 0,  jobsMoney: 0,  energyUse: 0,  waterUse: 3,  energySupply: 0,  waterSupply: 0,  pollution: -6,  satisfactionBase: 6,  upkeep: 3  },
  };

  function defaultSimState() {
    return {
      version: SIM_VERSION,
      money: 5000, population: 0, satisfaction: 70, pollution: 0,
      energyCap: 0, energyUse: 0, waterCap: 0, waterUse: 0,
      lastTickAt: Date.now(),
      buildings: [], // [{ id, type, lotId, x, z, builtAt }]
      nextBuildingId: 1,
    };
  }

  function loadSim() {
    try {
      const raw = localStorage.getItem(SIM_STORAGE_KEY);
      if (!raw) return defaultSimState();
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== SIM_VERSION || !Array.isArray(parsed.buildings)) {
        return defaultSimState();
      }
      const numeric = ['money', 'population', 'satisfaction', 'pollution', 'energyCap', 'energyUse', 'waterCap', 'waterUse', 'lastTickAt', 'nextBuildingId'];
      if (numeric.some(k => !Number.isFinite(parsed[k]))) return defaultSimState();
      parsed.satisfaction = Math.min(100, Math.max(0, parsed.satisfaction));
      parsed.pollution = Math.min(100, Math.max(0, parsed.pollution));
      return parsed;
    } catch (e) {
      return defaultSimState();
    }
  }

  function saveSim() {
    try {
      localStorage.setItem(SIM_STORAGE_KEY, JSON.stringify(sim));
    } catch (e) {
      // quota dépassée / navigation privée : la simulation continue,
      // simplement sans persistance pour cette session.
    }
  }

  let sim = loadSim();
  let simTickCount = 0;

  // Recalcule les agrégats (population/énergie/eau/pollution cible/argent)
  // depuis sim.buildings — fonction pure, appelée par runSimTick().
  function computeSimAggregates() {
    let population = 0, energyCap = 0, energyUse = 0, waterCap = 0, waterUse = 0;
    let pollutionSum = 0, satisfactionSum = 0, incomeMoney = 0, upkeepMoney = 0;
    sim.buildings.forEach(b => {
      const t = SIM_BUILDING_TYPES[b.type];
      if (!t) return;
      population += t.population || 0;
      energyCap += t.energySupply || 0;
      energyUse += t.energyUse || 0;
      waterCap += t.waterSupply || 0;
      waterUse += t.waterUse || 0;
      pollutionSum += t.pollution || 0;
      satisfactionSum += t.satisfactionBase || 0;
      incomeMoney += t.jobsMoney || 0;
      upkeepMoney += t.upkeep || 0;
    });
    return { population, energyCap, energyUse, waterCap, waterUse, pollutionSum, satisfactionSum, incomeMoney, upkeepMoney };
  }

  function runSimTick() {
    const agg = computeSimAggregates();
    sim.population = agg.population;
    sim.energyCap = agg.energyCap;
    sim.energyUse = agg.energyUse;
    sim.waterCap = agg.waterCap;
    sim.waterUse = agg.waterUse;

    const energyDeficitRatio = Math.max(0, agg.energyUse - agg.energyCap) / Math.max(1, agg.energyUse);
    const waterDeficitRatio = Math.max(0, agg.waterUse - agg.waterCap) / Math.max(1, agg.waterUse);

    const pollutionTarget = Math.min(100, Math.max(0, agg.pollutionSum));
    sim.pollution += (pollutionTarget - sim.pollution) * 0.15;

    const satisfactionTarget = Math.min(100, Math.max(0,
      60 + agg.satisfactionSum - sim.pollution * 0.4
      - energyDeficitRatio * 30 - waterDeficitRatio * 30
      + Math.min(10, sim.population * 0.02)
    ));
    sim.satisfaction += (satisfactionTarget - sim.satisfaction) * 0.1;

    const satisfactionFactor = 0.5 + sim.satisfaction / 100;
    const income = agg.incomeMoney * satisfactionFactor;
    sim.money = Math.max(0, sim.money + income - agg.upkeepMoney);

    sim.lastTickAt = Date.now();
    updateSimUI();

    simTickCount++;
    if (simTickCount % 5 === 0) saveSim();
  }

  // Rattrapage hors-ligne : rejoue les ticks manqués depuis la dernière
  // visite (plafonné pour ne pas laisser filer les stats après plusieurs
  // jours d'absence), avant le premier rendu visible.
  (function catchUpOfflineTicks() {
    const elapsed = Date.now() - sim.lastTickAt;
    const missedTicks = Math.min(240, Math.floor(elapsed / SIM_TICK_MS));
    for (let i = 0; i < missedTicks; i++) runSimTick();
  })();
  updateSimUI(); // reflète l'état chargé même si aucun tick n'a été rattrapé
  setInterval(runSimTick, SIM_TICK_MS);

  function formatSimNumber(n) {
    return Math.floor(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function updateSimUI() {
    const moneyEl = document.getElementById('sim-money');
    if (!moneyEl) return; // panneau pas encore dans le DOM au tout premier appel
    moneyEl.textContent = formatSimNumber(sim.money);
    document.getElementById('sim-population').textContent = formatSimNumber(sim.population);
    document.getElementById('sim-satisfaction').textContent = Math.round(sim.satisfaction) + '%';
    document.getElementById('sim-pollution').textContent = Math.round(sim.pollution) + '%';
    document.getElementById('sim-energy').textContent = formatSimNumber(sim.energyUse) + '/' + formatSimNumber(sim.energyCap);
    document.getElementById('sim-water').textContent = formatSimNumber(sim.waterUse) + '/' + formatSimNumber(sim.waterCap);
    // Le style "abordable/pas abordable" du menu de construction se
    // rafraîchit uniquement depuis les points d'interaction (toggle,
    // choix de type, pose d'un bâtiment) — pas ici : ce fichier définit
    // buildMode/selectedBuildType/le menu bien plus bas, et le tout premier
    // appel à updateSimUI() (rattrapage hors-ligne) arrive avant, donc les
    // référencer ici planterait (TDZ) sur ce premier appel.
  }

  window.addEventListener('beforeunload', saveSim);

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
     millimétré sur toute la ville.
     Le sol est composé de 4 bandes (au lieu d'un seul grand plan) pour
     laisser un trou rectangulaire ouvert au-dessus d'un vrai parking
     souterrain — un niveau -1 qu'on découvre en regardant vers le bas,
     pas juste une texture peinte sur le sol. */
  const PIT_X = -8, PIT_Z = -26, PIT_W = 10, PIT_D = 8, PIT_DEPTH = 3;
  const pitXMin = PIT_X - PIT_W / 2, pitXMax = PIT_X + PIT_W / 2;
  const pitZMin = PIT_Z - PIT_D / 2, pitZMax = PIT_Z + PIT_D / 2;

  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x0a1020, roughness: 0.9, metalness: 0.1
  });
  // Volontairement énorme (bien au-delà de ce que le brouillard laisse
  // voir) pour qu'on ne tombe jamais sur un bord visible : la ville doit
  // sembler infinie, pas s'arrêter net.
  const FAR = 3000;
  function addGroundStrip(x, z, w, d) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), groundMat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0, z);
    mesh.receiveShadow = true;
    scene.add(mesh);
  }
  // Bandes sud/nord : toute la largeur, sur ce qui reste de profondeur
  // une fois le trou retiré.
  addGroundStrip(0, (-FAR + pitZMin) / 2, FAR * 2, pitZMin + FAR);
  addGroundStrip(0, (pitZMax + FAR) / 2, FAR * 2, FAR - pitZMax);
  // Bandes ouest/est : seulement sur la profondeur du trou, de part et
  // d'autre de celui-ci.
  addGroundStrip((-FAR + pitXMin) / 2, PIT_Z, pitXMin + FAR, PIT_D);
  addGroundStrip((pitXMax + FAR) / 2, PIT_Z, FAR - pitXMax, PIT_D);

  /* ── Parking souterrain ──
     Vrai volume sous le trou (piliers, murs, néons de bordure, quelques
     véhicules garés) — visible en regardant dans l'ouverture, pas un
     simple décor plaqué au sol. */
  function createUndergroundLevel() {
    const wallMat  = new THREE.MeshStandardMaterial({ color: 0x1c2436, roughness: 0.85, metalness: 0.15 });
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x0a1220, roughness: 0.9, metalness: 0.1 });
    const trimMat  = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.8 });
    const rimMat   = new THREE.MeshBasicMaterial({
      color: 0x00f0ff, transparent: true, opacity: 0.6,
      blending: THREE.AdditiveBlending, depthWrite: false
    });

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(PIT_W, PIT_D), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(PIT_X, -PIT_DEPTH, PIT_Z);
    scene.add(floor);

    // Murs + liseré néon à leur base
    const wallGeoNS  = new THREE.BoxGeometry(PIT_W + 0.3, PIT_DEPTH, 0.3);
    const wallGeoEW  = new THREE.BoxGeometry(0.3, PIT_DEPTH, PIT_D + 0.3);
    const trimGeoNS  = new THREE.BoxGeometry(PIT_W + 0.3, 0.1, 0.34);
    const trimGeoEW  = new THREE.BoxGeometry(0.34, 0.1, PIT_D + 0.3);
    [pitZMin, pitZMax].forEach(z => {
      const wall = new THREE.Mesh(wallGeoNS, wallMat);
      wall.position.set(PIT_X, -PIT_DEPTH / 2, z);
      scene.add(wall);
      const trim = new THREE.Mesh(trimGeoNS, trimMat);
      trim.position.set(PIT_X, -PIT_DEPTH + 0.1, z);
      scene.add(trim);
    });
    [pitXMin, pitXMax].forEach(x => {
      const wall = new THREE.Mesh(wallGeoEW, wallMat);
      wall.position.set(x, -PIT_DEPTH / 2, PIT_Z);
      scene.add(wall);
      const trim = new THREE.Mesh(trimGeoEW, trimMat);
      trim.position.set(x, -PIT_DEPTH + 0.1, PIT_Z);
      scene.add(trim);
    });

    // Liseré lumineux au ras du sol, tout autour de l'ouverture — pour
    // bien repérer le trou en la survolant de haut
    [[PIT_X, pitZMin, PIT_W + 0.4, 0.12], [PIT_X, pitZMax, PIT_W + 0.4, 0.12]].forEach(([x, z, w, d]) => {
      const rim = new THREE.Mesh(new THREE.PlaneGeometry(w, d), rimMat);
      rim.rotation.x = -Math.PI / 2;
      rim.position.set(x, 0.05, z);
      scene.add(rim);
    });
    [[pitXMin, PIT_Z, 0.12, PIT_D + 0.4], [pitXMax, PIT_Z, 0.12, PIT_D + 0.4]].forEach(([x, z, w, d]) => {
      const rim = new THREE.Mesh(new THREE.PlaneGeometry(w, d), rimMat);
      rim.rotation.x = -Math.PI / 2;
      rim.position.set(x, 0.05, z);
      scene.add(rim);
    });

    // Piliers intérieurs, avec un capuchon lumineux
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x2e3447, roughness: 0.6, metalness: 0.4 });
    const pillarGeo = new THREE.CylinderGeometry(0.18, 0.18, PIT_DEPTH, 8);
    const capMat = new THREE.MeshStandardMaterial({ color: 0xff44cc, emissive: 0xff44cc, emissiveIntensity: 1 });
    [[-2.3, -1.6], [2.3, 1.6]].forEach(([dx, dz]) => {
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(PIT_X + dx, -PIT_DEPTH / 2, PIT_Z + dz);
      scene.add(pillar);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), capMat);
      cap.position.set(PIT_X + dx, -0.15, PIT_Z + dz);
      scene.add(cap);
    });

    // Véhicules garés (silhouettes simples, bande émissive façon phares)
    const carBodyMat = new THREE.MeshStandardMaterial({ color: 0x151b2d, roughness: 0.5, metalness: 0.5 });
    const carGlowMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 1 });
    [[-3, -2.4], [-3, 1.6]].forEach(([dx, dz]) => {
      const car = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.5, 0.8), carBodyMat);
      body.position.y = 0.25;
      car.add(body);
      const glow = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.15, 0.75), carGlowMat);
      glow.position.set(0.85, 0.3, 0);
      car.add(glow);
      car.position.set(PIT_X + dx, -PIT_DEPTH, PIT_Z + dz);
      scene.add(car);
    });

    // Enseigne peinte au sol, visible depuis le dessus à travers l'ouverture
    const signTex = makeSignTexture('NIVEAU_-1', '#00f0ff');
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(2.6, 0.65),
      new THREE.MeshBasicMaterial({ map: signTex, transparent: true })
    );
    sign.rotation.x = -Math.PI / 2;
    sign.position.set(PIT_X, -PIT_DEPTH + 0.02, PIT_Z);
    scene.add(sign);
  }
  createUndergroundLevel();

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
  // les nouveaux quartiers (école, parcs) sans densifier le centre.
  // Seule l'avenue centrale (pos=0) franchit la rivière (via le pont,
  // plus bas) : les autres avenues verticales s'arrêtent avant la rive
  // sud (49) au lieu de continuer tout droit dans l'eau — un seul pont,
  // pas une route immergée à chaque avenue.
  [0, 16, -16, 32, -32, 44, -44].forEach(pos => {
    addRoad(0, pos, 140, pos === 0 ? 2.4 : 1.4);
    if (pos === 0) {
      addRoad(0, 0, 2.4, 140);
    } else {
      addRoad(pos, -10.5, 1.4, 119); // z: -70 → 49 (s'arrête à la rive sud)
    }
  });
  // Rues secondaires plus fines, une par rangée de bâtiments (STEP = 4.6)
  for (let k = -4; k <= 4; k++) {
    const p = k * 4.6;
    if ([0, 16, -16, 32, -32, 44, -44].some(v => Math.abs(v - p) < 0.5)) continue;
    addRoad(0, p, 140, 0.55);
    addRoad(p, 0, 0.55, 140);
  }
  // Trottoirs le long des grandes avenues. Ceux qui longent les avenues
  // NON centrales (nord-sud) sont raccourcis comme la route elle-même
  // (s'arrêtent à 49, avant la rivière) : sinon ils continuaient à plat
  // au-dessus de l'eau alors que la route en dessous s'était arrêtée.
  [16, -16, 32, -32, 44, -44].forEach(pos => {
    addSidewalk(0, pos + 1.05, 140, 0.55);
    addSidewalk(0, pos - 1.05, 140, 0.55);
    addSidewalk(pos + 1.05, -10.5, 0.55, 119);
    addSidewalk(pos - 1.05, -10.5, 0.55, 119);
  });
  // Trottoirs de l'avenue centrale : coupés en deux (sud -70→49, nord
  // 59→70) au lieu d'un seul plan continu — le milieu (49→59) est la
  // rivière, où c'est le pont/ses rampes qui prennent le relais, pas un
  // trottoir à plat flottant au-dessus de l'eau.
  [1.55, -1.55].forEach(x => {
    addSidewalk(x, -10.5, 0.5, 119);
    addSidewalk(x, 64.5, 0.5, 11);
  });

  /* Marquage au sol : ligne centrale en pointillés sur les grandes avenues
     (des tirets espacés, comme un vrai marquage routier, au lieu d'un
     trait plein continu qui écrasait visuellement chaque avenue) */
  const laneMat = new THREE.MeshBasicMaterial({
    color: 0xffe27a, transparent: true, opacity: 0.35,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2
  });
  const DASH_LEN = 2, DASH_GAP = 2.6, DASH_SPAN = DASH_LEN + DASH_GAP;
  function addLaneMarking(fixedCoord, axis, length, center) {
    if (center === undefined) center = 0;
    const count = Math.floor(length / DASH_SPAN);
    for (let i = 0; i < count; i++) {
      const pos = center - length / 2 + i * DASH_SPAN + DASH_LEN / 2;
      const w = axis === 'x' ? DASH_LEN : 0.08;
      const d = axis === 'x' ? 0.08 : DASH_LEN;
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), laneMat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(axis === 'x' ? pos : fixedCoord, 0.05, axis === 'x' ? fixedCoord : pos);
      scene.add(mesh);
    }
  }
  // Comme pour les trottoirs : le marquage nord-sud des avenues non
  // centrales s'arrête à la rivière (49) au lieu de continuer dans l'eau.
  [0, 16, -16, 32, -32, 44, -44].forEach(pos => {
    addLaneMarking(pos, 'x', 140);
    if (pos === 0) addLaneMarking(pos, 'z', 140);
    else addLaneMarking(pos, 'z', 119, -10.5);
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
  // Quand k tombe pile sur une avenue perpendiculaire (±16, ±32), le
  // lampadaire atterrissait en plein milieu de cette route (le couloir
  // x/z=±17.3 est parallèle aux avenues, mais k balaie une coordonnée qui
  // les croise) — même famille de bug que les magasins/tours corrigés
  // plus tôt dans la session.
  const LAMP_AVENUES = [0, 16, -16, 32, -32, 44, -44];
  for (let k = -40; k <= 40; k += 8) {
    if (Math.abs(k) < 3) continue;
    if (LAMP_AVENUES.some(a => Math.abs(k - a) < 1.5)) continue;
    addStreetLamp(k, 17.3);
    addStreetLamp(k, -17.3);
    addStreetLamp(17.3, k);
    addStreetLamp(-17.3, k);
  }

  /* ── Feux de circulation + circulation automobile ──
     Un seul cycle de phase global (piloté par l'accumulateur t), partagé
     par tous les feux : quand l'axe X est vert, l'axe Z est rouge, et
     inversement, avec une courte phase orange à la transition. Les
     voitures s'arrêtent réellement au rouge près des carrefours équipés.
     4 feux aux carrefours (0,16)/(0,-16)/(16,0)/(-16,0), décalés vers le
     centre (×0.75) et vers l'extérieur (+2.0) pour rester hors des bandes
     route+trottoir des deux avenues qui se croisent à cet endroit. */
  const TRAFFIC_CYCLE = 6, TRAFFIC_YELLOW = 1;
  function getTrafficPhase(time) {
    const half = TRAFFIC_CYCLE + TRAFFIC_YELLOW;
    const pos = time % (half * 2);
    if (pos < TRAFFIC_CYCLE) return 'X_GREEN';
    if (pos < half) return 'X_YELLOW';
    if (pos < half + TRAFFIC_CYCLE) return 'Z_GREEN';
    return 'Z_YELLOW';
  }
  function trafficAxisState(phase, axisLetter) {
    if (phase[0] !== axisLetter) return 'red';
    return phase.endsWith('YELLOW') ? 'yellow' : 'green';
  }

  const trafficMatOn = {
    red:    new THREE.MeshStandardMaterial({ color: 0xff2a3a, emissive: 0xff2a3a, emissiveIntensity: 1.3 }),
    yellow: new THREE.MeshStandardMaterial({ color: 0xffcc33, emissive: 0xffcc33, emissiveIntensity: 1.3 }),
    green:  new THREE.MeshStandardMaterial({ color: 0x33ff77, emissive: 0x33ff77, emissiveIntensity: 1.3 }),
  };
  const trafficMatOff = new THREE.MeshStandardMaterial({ color: 0x241a1a, emissive: 0x000000, emissiveIntensity: 0 });
  const trafficLampGeo = new THREE.SphereGeometry(0.09, 8, 8);
  const trafficPoleMat = new THREE.MeshStandardMaterial({ color: 0x1c2436, roughness: 0.6, metalness: 0.4 });
  const trafficPoleGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.7, 6);
  const trafficBoxGeo  = new THREE.BoxGeometry(0.4, 0.5, 0.16);

  const trafficLightGroups = [];
  function createTrafficLight(x, z) {
    const group = new THREE.Group();
    const pole = new THREE.Mesh(trafficPoleGeo, trafficPoleMat);
    pole.position.y = 0.85;
    group.add(pole);
    const box = new THREE.Mesh(trafficBoxGeo, trafficPoleMat);
    box.position.y = 1.75;
    group.add(box);

    function lampColumn(dx) {
      return [0.14, 0, -0.14].map(dy => {
        const lamp = new THREE.Mesh(trafficLampGeo, trafficMatOff);
        lamp.position.set(dx, 1.75 + dy, 0.1);
        group.add(lamp);
        return lamp;
      });
    }
    const [xRed, xYellow, xGreen] = lampColumn(-0.11);
    const [zRed, zYellow, zGreen] = lampColumn(0.11);

    group.position.set(x, 0, z);
    scene.add(group);
    trafficLightGroups.push({ xRed, xYellow, xGreen, zRed, zYellow, zGreen });
  }
  // +2.5 (au lieu de +2.0) pour bien dégager le trottoir de l'avenue
  // centrale (bord à 1.8) — 2.0 touchait quasiment le bord du boîtier.
  // Le 5e feu (2.5,2.5) gère le carrefour central (x=0 × z=0) : sans lui,
  // les voitures de l'avenue centrale n'avaient aucune raison de s'arrêter
  // l'une pour l'autre à cet endroit précis et se traversaient.
  [[2.5, 12], [2.5, -12], [12, 2.5], [-12, 2.5], [2.5, 2.5]].forEach(([x, z]) => createTrafficLight(x, z));

  let lastTrafficPhase = null;
  function updateTrafficLights(phase) {
    if (phase === lastTrafficPhase) return; // matériaux déjà à jour, rien à refaire
    lastTrafficPhase = phase;
    const xState = trafficAxisState(phase, 'X');
    const zState = trafficAxisState(phase, 'Z');
    trafficLightGroups.forEach(g => {
      g.xRed.material    = xState === 'red'    ? trafficMatOn.red    : trafficMatOff;
      g.xYellow.material = xState === 'yellow' ? trafficMatOn.yellow : trafficMatOff;
      g.xGreen.material  = xState === 'green'  ? trafficMatOn.green  : trafficMatOff;
      g.zRed.material    = zState === 'red'    ? trafficMatOn.red    : trafficMatOff;
      g.zYellow.material = zState === 'yellow' ? trafficMatOn.yellow : trafficMatOff;
      g.zGreen.material  = zState === 'green'  ? trafficMatOn.green  : trafficMatOff;
    });
  }

  /* Voitures : avenue centrale (×2 axes) + avenues ±16 (×2 axes), une
     voiture par sens, qui roule en boucle et s'arrête au rouge aux
     carrefours équipés d'un feu (stopCoords = coordonnée à ne pas
     franchir tant que l'axe de la voiture n'est pas vert/orange). */
  // Largeur 0.5 (pas 0.85) : les avenues ±16 ne font que 1.4 de large,
  // deux voies de 0.85 s'y seraient chevauchées (et auraient débordé sur
  // le trottoir) — recalculé après coup, gardé étroit pour tenir avec
  // marge dans les deux gabarits d'avenue (1.4 et 2.4).
  const movingCars = [];
  const carBodyGeo2 = new THREE.BoxGeometry(1.4, 0.45, 0.5);
  const carBodyMat2 = new THREE.MeshStandardMaterial({ color: 0x151b2d, roughness: 0.5, metalness: 0.5 });
  const carGlowGeo2 = new THREE.BoxGeometry(0.08, 0.14, 0.46);
  const carGlowMat2 = new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 1 });

  // Hauteur du tablier du pont (voir createRiver) : une voiture sur
  // l'avenue centrale doit suivre ce profil au lieu de rouler à plat
  // "dans" la rivière quand elle traverse.
  function bridgeY(z) {
    if (z < 49 || z > 59) return 0;
    if (z < 51) return ((z - 49) / 2) * 0.65;
    if (z > 57) return ((59 - z) / 2) * 0.65;
    return 0.65;
  }

  function createCar(axis, laneCoord, startPos, speed, stopCoords, wrapMin, wrapMax) {
    const group = new THREE.Group();
    const body = new THREE.Mesh(carBodyGeo2, carBodyMat2);
    body.position.y = 0.28;
    group.add(body);
    const glow = new THREE.Mesh(carGlowGeo2, carGlowMat2);
    glow.position.set(speed >= 0 ? 0.78 : -0.78, 0.3, 0);
    group.add(glow);
    if (axis === 'z') group.rotation.y = Math.PI / 2;
    scene.add(group);
    movingCars.push({
      group, axis, laneCoord, pos: startPos, baseSpeed: speed, speed, stopCoords,
      wrapMin: wrapMin === undefined ? -70 : wrapMin,
      wrapMax: wrapMax === undefined ? 70 : wrapMax,
      // Seule l'avenue centrale (|laneCoord| ~0.85) passe par le pont —
      // les avenues ±16 s'arrêtent avant la rivière, jamais concernées.
      onBridgeAvenue: axis === 'z' && Math.abs(laneCoord) < 1.6,
    });
  }

  // Toutes les voitures partagent la même liste d'arrêt [0,16,-16] : ce
  // sont les 3 coordonnées où existe une avenue perpendiculaire avec du
  // trafic (0 = avenue centrale, ±16). Une voiture sur l'avenue z=16 par
  // exemple croise aussi l'avenue x=16 et x=-16 à ces points (ex: (16,16))
  // — les laisser hors de la liste faisait se traverser les voitures aux
  // 4 coins ±16/±16, pas seulement au centre.
  const CAR_STOPS = [0, 16, -16];
  // Avenue centrale (demi-largeur route 1.2, voies à ±0.85 → bord voiture
  // à 1.10, marge 0.1 avant la route ; trottoir commence à 1.3)
  createCar('x', 0.85,  -30, 0.05,  CAR_STOPS);
  createCar('x', -0.85,  30, -0.05, CAR_STOPS);
  createCar('z', 0.85,  -30, 0.05,  CAR_STOPS);
  createCar('z', -0.85,  30, -0.05, CAR_STOPS);
  // Avenues ±16 (demi-largeur route 0.7, voies à ±0.35 → bord voiture à
  // 0.60, marge 0.1 avant la route)
  createCar('x', 16.35,   10, 0.045,  CAR_STOPS);
  createCar('x', 15.65,  -10, -0.045, CAR_STOPS);
  createCar('x', -15.65,  10, 0.045,  CAR_STOPS);
  createCar('x', -16.35, -10, -0.045, CAR_STOPS);
  // Voitures z (nord-sud) des avenues ±16 : leur route s'arrête maintenant
  // à 49 (avant la rivière, pas de pont ici) — wrapMax=47 pour qu'elles
  // rebroussent chemin avant d'arriver dans l'eau, au lieu de continuer
  // tout droit sur une route qui n'existe plus.
  createCar('z', 16.35,   10, 0.045,  CAR_STOPS, -70, 47);
  createCar('z', 15.65,  -10, -0.045, CAR_STOPS, -70, 47);
  createCar('z', -15.65,  10, 0.045,  CAR_STOPS, -70, 47);
  createCar('z', -16.35, -10, -0.045, CAR_STOPS, -70, 47);

  function updateMovingCars(phase) {
    movingCars.forEach(car => {
      const axisLetter = car.axis === 'x' ? 'X' : 'Z';
      const axisMoving = phase[0] === axisLetter; // vert ou orange pour cet axe
      let targetSpeed = car.baseSpeed;
      if (!axisMoving) {
        const dir = Math.sign(car.baseSpeed);
        const nearRedStop = car.stopCoords.some(c => {
          const d = (c - car.pos) * dir; // distance devant la voiture, dans son sens de marche
          return d > 0 && d < 3;
        });
        if (nearRedStop) targetSpeed = 0;
      }
      car.speed += (targetSpeed - car.speed) * 0.06;
      car.pos += car.speed;
      if (car.pos > car.wrapMax) car.pos = car.wrapMin;
      if (car.pos < car.wrapMin) car.pos = car.wrapMax;
      const y = car.onBridgeAvenue ? bridgeY(car.pos) : 0;
      if (car.axis === 'x') car.group.position.set(car.pos, y, car.laneCoord);
      else car.group.position.set(car.laneCoord, y, car.pos);
    });
  }

  /* ── Piétons ──
     Marchent sur les trottoirs déjà posés — on réutilise TELS QUELS les
     offsets déjà passés à addSidewalk (±1.05 pour ±16/±32) : aucune
     nouvelle coordonnée à vérifier, ils marchent pile sur le trottoir.
     Silhouette articulée (torse/tête/2 jambes/2 bras qui se balancent en
     marchant) plutôt qu'un simple cylindre qui glisse — c'est le
     mouvement de marche, pas juste la forme, qui vendait le "robot". */
  const movingPedestrians = [];
  const pedTorsoGeo = new THREE.CylinderGeometry(0.075, 0.09, 0.22, 6);
  const pedHeadGeo = new THREE.SphereGeometry(0.075, 8, 8);
  const pedLimbGeo = new THREE.CylinderGeometry(0.028, 0.022, 0.2, 5);
  const pedMatA = new THREE.MeshStandardMaterial({ color: 0x8fa0c0, roughness: 0.8 });
  const pedMatB = new THREE.MeshStandardMaterial({ color: 0xc08fa8, roughness: 0.8 });

  function pedLimb(mat, hipY) {
    const pivot = new THREE.Group();
    pivot.position.y = hipY;
    const mesh = new THREE.Mesh(pedLimbGeo, mat);
    mesh.position.y = -0.1;
    pivot.add(mesh);
    return pivot;
  }
  function createPedestrian(axis, lane, startPos, speed) {
    const group = new THREE.Group();
    const mat = Math.random() > 0.5 ? pedMatA : pedMatB;

    const torso = new THREE.Mesh(pedTorsoGeo, mat);
    torso.position.y = 0.33;
    group.add(torso);
    const head = new THREE.Mesh(pedHeadGeo, mat);
    head.position.y = 0.52;
    group.add(head);

    const legL = pedLimb(mat, 0.22); legL.position.x = -0.045; group.add(legL);
    const legR = pedLimb(mat, 0.22); legR.position.x =  0.045; group.add(legR);
    const armL = pedLimb(mat, 0.42); armL.position.x = -0.11;  group.add(armL);
    const armR = pedLimb(mat, 0.42); armR.position.x =  0.11;  group.add(armR);

    scene.add(group);
    movingPedestrians.push({
      group, axis, lane, pos: startPos, speed,
      walkPhase: Math.random() * Math.PI * 2, legL, legR, armL, armR,
    });
  }
  const PEDESTRIAN_STRIPS = [];
  [16, -16, 32, -32].forEach(pos => {
    PEDESTRIAN_STRIPS.push({ axis: 'x', lane: pos + 1.05 });
    PEDESTRIAN_STRIPS.push({ axis: 'x', lane: pos - 1.05 });
    PEDESTRIAN_STRIPS.push({ axis: 'z', lane: pos + 1.05 });
    PEDESTRIAN_STRIPS.push({ axis: 'z', lane: pos - 1.05 });
  });
  PEDESTRIAN_STRIPS.forEach((s, i) => {
    const speed = (0.012 + Math.random() * 0.008) * (i % 2 === 0 ? 1 : -1);
    createPedestrian(s.axis, s.lane, -70 + Math.random() * 140, speed);
  });
  function updateMovingPedestrians() {
    movingPedestrians.forEach(p => {
      p.pos += p.speed;
      // Les trottoirs nord-sud (axis 'z') des avenues ±16/±32 s'arrêtent
      // maintenant à 49 (avant la rivière) : rebrousser chemin à 47 plutôt
      // que 70, sinon le piéton continuerait sur un trottoir qui n'existe
      // plus au-dessus de l'eau.
      const wrapMax = p.axis === 'z' ? 47 : 70;
      if (p.pos > wrapMax) p.pos = -70;
      if (p.pos < -70) p.pos = wrapMax;

      const swing = Math.sin(t * 8 + p.walkPhase) * 0.55;
      p.legL.rotation.x =  swing;
      p.legR.rotation.x = -swing;
      p.armL.rotation.x = -swing;
      p.armR.rotation.x =  swing;
      const bob = Math.abs(Math.cos(t * 8 + p.walkPhase)) * 0.025;

      // Oriente le piéton dans son sens de marche (avant, pas juste "sur l'axe")
      const facing = p.axis === 'x'
        ? (p.speed >= 0 ? Math.PI / 2 : -Math.PI / 2)
        : (p.speed >= 0 ? 0 : Math.PI);
      p.group.rotation.y = facing;

      if (p.axis === 'x') p.group.position.set(p.pos, bob, p.lane);
      else p.group.position.set(p.lane, bob, p.pos);
    });
  }

  /* ── Cyclistes ──
     Les avenues ±16/±32 sont trop étroites pour caser une vraie file
     vélo distincte des voitures sans chevaucher la route ou le trottoir
     (marge réelle < 0.1 unité une fois les voies voiture placées) — les
     cyclistes roulent donc sur les trottoirs de l'avenue ±44, laissés
     libres par les piétons (ci-dessus, limités à ±16/±32), toujours en
     réutilisant les offsets déjà posés pour ces trottoirs. */
  const movingCyclists = [];
  const cycFrameGeo = new THREE.BoxGeometry(0.5, 0.06, 0.06);
  const cycWheelGeo = new THREE.TorusGeometry(0.14, 0.02, 6, 10);
  const cycRiderGeo = new THREE.SphereGeometry(0.11, 6, 6);
  const cycMat = new THREE.MeshStandardMaterial({ color: 0x2e3447, roughness: 0.5, metalness: 0.4 });
  const cycRiderMat = new THREE.MeshStandardMaterial({ color: 0xffe27a, roughness: 0.7 });
  function createCyclist(axis, lane, startPos, speed) {
    const group = new THREE.Group();
    const frame = new THREE.Mesh(cycFrameGeo, cycMat);
    frame.position.y = 0.22;
    group.add(frame);
    [-0.22, 0.22].forEach(dx => {
      const wheel = new THREE.Mesh(cycWheelGeo, cycMat);
      wheel.rotation.y = Math.PI / 2;
      wheel.position.set(dx, 0.14, 0);
      group.add(wheel);
    });
    const rider = new THREE.Mesh(cycRiderGeo, cycRiderMat);
    rider.position.y = 0.42;
    group.add(rider);
    if (axis === 'z') group.rotation.y = Math.PI / 2;
    scene.add(group);
    movingCyclists.push({ group, axis, lane, pos: startPos, speed });
  }
  const CYCLIST_STRIPS = [];
  [44, -44].forEach(pos => {
    CYCLIST_STRIPS.push({ axis: 'x', lane: pos + 1.05 });
    CYCLIST_STRIPS.push({ axis: 'x', lane: pos - 1.05 });
    CYCLIST_STRIPS.push({ axis: 'z', lane: pos + 1.05 });
    CYCLIST_STRIPS.push({ axis: 'z', lane: pos - 1.05 });
  });
  CYCLIST_STRIPS.forEach((s, i) => {
    const speed = (0.022 + Math.random() * 0.01) * (i % 2 === 0 ? 1 : -1);
    createCyclist(s.axis, s.lane, -70 + Math.random() * 140, speed);
  });
  function updateMovingCyclists() {
    movingCyclists.forEach(c => {
      c.pos += c.speed;
      // Même raison que les piétons : le trottoir nord-sud de l'avenue
      // ±44 s'arrête à 49, avant la rivière.
      const wrapMax = c.axis === 'z' ? 47 : 70;
      if (c.pos > wrapMax) c.pos = -70;
      if (c.pos < -70) c.pos = wrapMax;
      if (c.axis === 'x') c.group.position.set(c.pos, 0, c.lane);
      else c.group.position.set(c.lane, 0, c.pos);
    });
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
     accrocher la pub façon "grand panneau publicitaire".
     x=±23 (au lieu de ±22) : ça aligne ces tours sur la même grille STEP=4.6
     que le reste de la ville (colonne juste après ±18.4) au lieu de flotter
     entre deux colonnes. z=9.2 (au lieu de 0) pour towerWeb et sa jumelle
     Backend : elles étaient plantées en plein milieu de l'avenue centrale. */
  const towerWeb      = createBuilding(23, 9.2, randomJobForPosition(23, 9.2), 18);
  createBuilding(23, 4.6, randomJobForPosition(23, 4.6), 16);
  createBuilding(-23, 9.2, randomJobForPosition(-23, 9.2), 16);
  const towerBackend  = createBuilding(-23, 4.6,randomJobForPosition(-23, 4.6),20);
  createBuilding(-23, -4.6,randomJobForPosition(-23, -4.6),14);
  const towerData      = createBuilding(-23, -9.2,randomJobForPosition(-23, -9.2),15);
  const towerSysteme   = createBuilding(23, -4.6, randomJobForPosition(23, -4.6), 17);
  createBuilding(23, -9.2, randomJobForPosition(23, -9.2), 13);

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
  attachZoneAd(23, 9.2,   18, "SECTEUR WEB",     "JS · TS · REACT · JQUERY", ZONES.web.color,     -Math.PI / 2);
  attachZoneAd(-23, 4.6,  20, "SECTEUR BACKEND", "PHP · JAVA · NODE.JS",     ZONES.backend.color,  Math.PI / 2);
  attachZoneAd(-23, -9.2, 15, "SECTEUR DATA",   "PYTHON · SQL",             ZONES.data.color,     Math.PI / 2);
  attachZoneAd(23, -4.6,  17, "SECTEUR SYSTÈME", "DOCKER",                   ZONES.systeme.color, -Math.PI / 2);


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
  // Le "k" qui court le long de l'anneau finit forcément par croiser les
  // avenues perpendiculaires (0, ±16, ±32, ±44) — sans cette exclusion,
  // un magasin (largeur 2.0) planté juste à ce croisement chevauche
  // carrément la route (déjà vu avec ARCADE/NOODLE_BAR).
  const CROSS_AVENUES = [0, 16, -16, 32, -32, 44, -44];
  [18.3, 34.3].forEach(offset => {
    for (let k = -38; k <= 38; k += 4.3) {
      if (Math.abs(k) < 3) continue;
      if (CROSS_AVENUES.some(a => Math.abs(k - a) < 2.9)) continue;
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
    // Réduit de 9×9 à 6.5×6.5 : moins de terrain "vide", plus de place
    // pour des bâtiments/magasins autour.
    const grassGeo = new THREE.PlaneGeometry(6.5, 6.5);
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
    for (let i = 0; i < 5; i++) {
      createTree(x + (Math.random() - 0.5) * 5, z + (Math.random() - 0.5) * 5);
    }
  }

  // Une école + deux parcs dans le nouvel anneau extérieur (±38/±44),
  // hors des avenues, donc aucun risque de collision avec les routes
  createSchool(-38, 8, Math.PI / 2);
  createPark(38, 8);
  createPark(-8, -38);

  /* ── Oiseaux de parc ──
     Remplacent les animaux au sol (préférence utilisateur) : volent bas
     au-dessus de la pelouse en petit cercle, toujours visibles (contrairement
     aux oiseaux de ville plus haut dans le ciel, réservés au mode jour).
     Réutilise la silhouette déjà dessinée pour les oiseaux de ville
     (makeBirdTexture), en plus petit. */
  const parkBirdMat = new THREE.SpriteMaterial({ map: makeBirdTexture(), transparent: true, opacity: 0.85, depthWrite: false });
  const movingParkBirds = [];
  function createParkBird(cx, cz) {
    const spr = new THREE.Sprite(parkBirdMat);
    spr.scale.set(0.9, 0.45, 1);
    scene.add(spr);
    movingParkBirds.push({
      sprite: spr, centerX: cx, centerZ: cz,
      radius: 1.4 + Math.random() * 1.3,
      height: 1.6 + Math.random() * 0.8,
      speed: (0.5 + Math.random() * 0.4) * (Math.random() > 0.5 ? 1 : -1),
      phase: Math.random() * Math.PI * 2,
      flapPhase: Math.random() * Math.PI * 2,
    });
  }
  [[38, 8], [-8, -38]].forEach(([px, pz]) => {
    for (let i = 0; i < 3; i++) createParkBird(px, pz);
  });
  function updateParkBirds() {
    movingParkBirds.forEach(b => {
      const ang = t * b.speed + b.phase;
      b.sprite.position.set(
        b.centerX + Math.cos(ang) * b.radius,
        b.height + Math.sin(t * 3 + b.flapPhase) * 0.15,
        b.centerZ + Math.sin(ang) * b.radius
      );
      const flap = 1 + Math.sin(t * 9 + b.flapPhase) * 0.25;
      b.sprite.scale.set(0.9, 0.45 * flap, 1);
    });
  }

  // Un peu plus de vie commerçante près des parcs, maintenant plus petits
  // (espace vérifié dégagé de la pelouse et de l'avenue la plus proche).
  createShop(33, 8, Math.PI / 2, SHOP_TYPES[0]);
  createShop(-3.275, -38, -Math.PI / 2, SHOP_TYPES[1]);

  /* ── Quartier constructible (simulation) ──
     6 lots dans le coin resté libre entre les avenues -32/-44 (calcul de
     dégagement fait à la main : zone sûre x,z ∈ [-42.675,-33.325], marge
     ≥2 unités gardée de chaque côté) — à l'écart du parc sud (-8,-38) et
     de l'école (-38,8), qui occupent les deux bras de cette zone mais pas
     son coin diagonal. */
  const DISTRICT_X = -38, DISTRICT_Z = -38, LOT_STEP = 2.6;
  const lotMarkerMeshes = [];
  const lotMat = new THREE.MeshBasicMaterial({
    color: 0xffe27a, transparent: true, opacity: 0.35,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
  });
  const lotMatActive = new THREE.MeshBasicMaterial({
    color: 0xffe27a, transparent: true, opacity: 0.8,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
  });
  function buildDistrictLots() {
    let lotId = 0;
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        const x = DISTRICT_X + (col - 1) * LOT_STEP;
        const z = DISTRICT_Z + (row - 0.5) * LOT_STEP;
        const marker = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.0), lotMat);
        marker.rotation.x = -Math.PI / 2;
        marker.position.set(x, 0.05, z);
        marker.userData = { lotId, x, z };
        scene.add(marker);
        lotMarkerMeshes.push(marker);
        lotId++;
      }
    }
    const signTex = makeSignTexture('CHANTIER_MUNICIPAL', '#ffe27a');
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(3.4, 0.85),
      new THREE.MeshBasicMaterial({ map: signTex, transparent: true })
    );
    sign.position.set(DISTRICT_X, 1.2, DISTRICT_Z - LOT_STEP - 0.6);
    scene.add(sign);
    const signBack = sign.clone();
    signBack.rotation.y = Math.PI;
    scene.add(signBack);
  }
  buildDistrictLots();

  // Bâtiment civique (simulation) — même famille visuelle que createBuilding
  // mais coloré/étiqueté depuis SIM_BUILDING_TYPES au lieu de JOBS.
  function createSimBuilding(x, z, type) {
    const info = SIM_BUILDING_TYPES[type];
    const h = 2.5;
    const group = new THREE.Group();

    const bodyGeo = new THREE.BoxGeometry(1.8, h, 1.8);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x0d1828, roughness: 0.6, metalness: 0.4,
      emissive: new THREE.Color(info.color), emissiveIntensity: 0.12,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = h / 2;
    group.add(body);

    const edgesGeo = new THREE.EdgesGeometry(bodyGeo);
    const edges = new THREE.LineSegments(edgesGeo, new THREE.LineBasicMaterial({ color: info.color, transparent: true, opacity: 0.7 }));
    edges.position.y = h / 2;
    group.add(edges);

    const roof = new THREE.Mesh(
      new THREE.PlaneGeometry(1.85, 1.85),
      new THREE.MeshStandardMaterial({ color: info.color, emissive: new THREE.Color(info.color), emissiveIntensity: 0.6, transparent: true, opacity: 0.7 })
    );
    roof.rotation.x = -Math.PI / 2;
    roof.position.y = h + 0.01;
    group.add(roof);

    const hex = '#' + info.color.toString(16).padStart(6, '0');
    const signTex = makeSignTexture(info.label.toUpperCase(), hex);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.42), new THREE.MeshBasicMaterial({ map: signTex, transparent: true }));
    sign.position.set(0, h + 0.32, 0.92);
    group.add(sign);
    const signBack = sign.clone();
    signBack.rotation.y = Math.PI;
    group.add(signBack);

    group.position.set(x, 0, z);
    scene.add(group);
    return group;
  }

  function flashMoneyDenied() {
    const el = document.getElementById('sim-money');
    if (!el) return;
    el.style.color = '#ff4444';
    setTimeout(() => { el.style.color = ''; }, 400);
  }

  function tryPlaceBuilding(lotId, type) {
    const info = SIM_BUILDING_TYPES[type];
    if (!info) return false;
    if (sim.buildings.some(b => b.lotId === lotId)) return false;
    if (sim.money < info.cost) { flashMoneyDenied(); return false; }
    const marker = lotMarkerMeshes.find(m => m.userData.lotId === lotId);
    if (!marker) return false;
    const { x, z } = marker.userData;

    sim.money -= info.cost;
    sim.buildings.push({ id: sim.nextBuildingId++, type, lotId, x, z, builtAt: Date.now() });
    createSimBuilding(x, z, type);
    marker.visible = false; // le bâtiment recouvre désormais le marqueur
    saveSim();
    updateSimUI();
    updateBuildMenu();
    return true;
  }

  // Reconstruit les bâtiments déjà posés (sauvegarde localStorage) au chargement
  function rebuildSimBuildingsFromSave() {
    sim.buildings.forEach(b => {
      createSimBuilding(b.x, b.z, b.type);
      const marker = lotMarkerMeshes.find(m => m.userData.lotId === b.lotId);
      if (marker) marker.visible = false;
    });
  }
  rebuildSimBuildingsFromSave();

  /* ── Ligne de métro aérienne : deux stations reliées par un seul rail
     continu (au lieu d'un unique segment isolé), avec une rame qui
     parcourt toute la ligne en va-et-vient. ── */
  const movingTrains = [];
  const METRO_COLOR = 0x2496ed;

  // Rail continu + pylônes entre deux points alignés sur le même axe
  // (x1===x2 → ligne verticale, z1===z2 → ligne horizontale), avec une
  // rame qui parcourt toute la distance entre les deux stations.
  const metroRailMat = new THREE.MeshStandardMaterial({ color: 0x333844, metalness: 0.7, roughness: 0.3 });
  const metroPillarMat = new THREE.MeshStandardMaterial({ color: 0x2e3447, roughness: 0.6, metalness: 0.3 });
  const metroPillarGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.4, 6);
  function createMetroTrack(x1, z1, x2, z2, withTrain) {
    if (withTrain === undefined) withTrain = true;
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
    if (!withTrain) return; // ligne annulaire : les rames sont gérées à part (updateLoopTrains)

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

  /* Gare (station ouest) : quai allongé + verrière sur toute la longueur
     + bâtiment voyageurs à l'extrémité — plus qu'un simple arrêt, une
     vraie tête de ligne. Centrée à x=-23.3 (pas -26) et volontairement
     pas plus longue : le couloir dégagé entre l'avenue -16 et l'avenue
     -32 ne fait que ~13 unités de large, marges comprises. */
  function createGareStation(x, z, label, hallSide) {
    if (hallSide === undefined) hallSide = -1; // -1 = bâtiment côté ouest, 1 = côté est
    const group = new THREE.Group();
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x2e3447, roughness: 0.6, metalness: 0.3 });
    const hallMat = new THREE.MeshStandardMaterial({ color: 0x1c2436, roughness: 0.75, metalness: 0.2 });

    const platGeo = new THREE.BoxGeometry(10, 0.4, 4);
    const platMat = new THREE.MeshStandardMaterial({ color: 0x1c2436, roughness: 0.8 });
    const plat = new THREE.Mesh(platGeo, platMat);
    plat.position.y = 0.2;
    group.add(plat);

    // Verrière sur toute la longueur, avec beaucoup plus de piliers qu'un
    // simple arrêt — la répétition qui s'estompe dans le brouillard donne
    // l'impression que le quai continue au-delà de ce qu'on voit net.
    const canopyGeo = new THREE.BoxGeometry(10.4, 0.15, 4.4);
    const canopyMat = new THREE.MeshStandardMaterial({
      color: METRO_COLOR, emissive: METRO_COLOR, emissiveIntensity: 0.3, transparent: true, opacity: 0.85
    });
    const canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.y = 3.2;
    group.add(canopy);

    const poleGeo = new THREE.CylinderGeometry(0.07, 0.07, 3, 6);
    for (let px = -4.5; px <= 4.5; px += 2.25) {
      [-1.75, 1.75].forEach(pz => {
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.set(px, 1.7, pz);
        group.add(pole);
      });
    }

    // Bâtiment voyageurs (tête de station) à une extrémité du quai
    const hallX = hallSide * 5.7;
    const hall = new THREE.Mesh(new THREE.BoxGeometry(2.2, 4.2, 4.6), hallMat);
    hall.position.set(hallX, 2.1, 0);
    group.add(hall);
    const hallRoof = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.15, 4.8),
      new THREE.MeshStandardMaterial({ color: METRO_COLOR, emissive: METRO_COLOR, emissiveIntensity: 0.4 })
    );
    hallRoof.position.set(hallX, 4.25, 0);
    group.add(hallRoof);

    const signTex = makeSignTexture(label, '#2496ed');
    const signMat = new THREE.MeshBasicMaterial({ map: signTex, transparent: true });
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.85), signMat);
    sign.position.set(hallX, 2.6, 2.35);
    group.add(sign);
    const signBack = sign.clone();
    signBack.rotation.y = Math.PI;
    signBack.position.z = -2.35;
    group.add(signBack);

    group.position.set(x, 0, z);
    scene.add(group);
  }

  // Bâtiment voyageurs côté est (hallSide=1) pour GARE_EST : côté ouest
  // (hallSide=-1, par défaut) serait trop près de l'avenue centrale.
  // Centre décalé à 7.3 (pas 8) pour garder de la marge des deux côtés
  // (avenue centrale à l'ouest, avenue 16 à l'est).
  createGareStation(7.3, 38, 'GARE_EST', 1);
  createGareStation(-23.3, 38, 'GARE_OUEST');
  createMetroTrack(-26, 38, 22, 38);

  /* ── Ligne annulaire : le métro boucle autour de toute la ville ──
     4 segments réutilisant createMetroTrack (chacun avec son propre train
     en va-et-vient) formant un grand rectangle autour du centre :
     - Nord/Est/Ouest à ±28.65 : juste à l'intérieur de l'avenue 32
       (bande route+trottoir jusqu'à 30.675), à mi-chemin entre deux
       emplacements de magasins (anneaux à 18.3/34.3, k pas de 4.3) pour
       ne pas les chevaucher, et à bonne distance des tours du skyline
       (x=±23).
     - Sud à z=-50 : la zone entre le parc sud/le parking souterrain et
       l'avenue -44 est trop étroite pour y faire passer la boucle sans
       toucher quelque chose (parc, parking, anneau de magasins, avenue
       -16 se chevauchent tous dans cette bande) — plutôt que de viser un
       créneau de quelques dixièmes d'unité, la boucle passe large, bien
       au-delà de l'avenue -44, dans le terrain resté ouvert. */
  createMetroTrack(-28.65, 28.65, 28.65, 28.65, false);   // Nord
  createMetroTrack(28.65, -50, 28.65, 28.65, false);      // Est
  createMetroTrack(-28.65, -50, -28.65, 28.65, false);    // Ouest
  createMetroTrack(-28.65, -50, 28.65, -50, false);       // Sud

  // 2 rames qui parcourent tout le circuit dans le même sens (au lieu
  // d'une rame par côté qui faisait des allers-retours indépendants,
  // ce qui donnait l'impression de trains qui n'allaient "pas dans le
  // bon sens"). Position calculée par un paramètre de distance le long
  // du périmètre complet, qui avance à vitesse constante et repart à 0
  // en boucle.
  const LOOP_CORNERS = [
    [-28.65, 28.65],
    [28.65, 28.65],
    [28.65, -50],
    [-28.65, -50],
  ];
  const loopSegments = LOOP_CORNERS.map((a, i) => {
    const b = LOOP_CORNERS[(i + 1) % LOOP_CORNERS.length];
    return { a, b, len: Math.hypot(b[0] - a[0], b[1] - a[1]) };
  });
  const LOOP_PERIMETER = loopSegments.reduce((sum, s) => sum + s.len, 0);
  function loopPoint(dist) {
    let s = ((dist % LOOP_PERIMETER) + LOOP_PERIMETER) % LOOP_PERIMETER;
    for (const seg of loopSegments) {
      if (s <= seg.len) {
        const t = s / seg.len;
        return [seg.a[0] + (seg.b[0] - seg.a[0]) * t, seg.a[1] + (seg.b[1] - seg.a[1]) * t];
      }
      s -= seg.len;
    }
    return loopSegments[0].a;
  }
  const loopTrains = [];
  const loopTrainGeo = new THREE.BoxGeometry(2.2, 0.85, 0.85);
  const loopTrainMat = new THREE.MeshStandardMaterial({ color: METRO_COLOR, emissive: METRO_COLOR, emissiveIntensity: 0.5, metalness: 0.4, roughness: 0.4 });
  for (let i = 0; i < 2; i++) {
    const mesh = new THREE.Mesh(loopTrainGeo, loopTrainMat);
    mesh.position.y = 1.85;
    scene.add(mesh);
    loopTrains.push({ mesh, dist: (LOOP_PERIMETER / 2) * i }); // les 2 rames démarrent aux deux extrémités opposées de la boucle
  }
  const LOOP_TRAIN_SPEED = 0.09;
  function updateLoopTrains() {
    loopTrains.forEach(tr => {
      tr.dist += LOOP_TRAIN_SPEED;
      const [x, z] = loopPoint(tr.dist);
      tr.mesh.position.x = x;
      tr.mesh.position.z = z;
      const [nx, nz] = loopPoint(tr.dist + 0.5);
      // atan2(dz, dx), pas atan2(dx, dz) : le corps de la rame (BoxGeometry
      // 2.2×0.85×0.85) a son grand axe le long de X local ; c'est le même
      // repère que les voitures (rotation.y = π/2 pour un trajet en Z pur).
      // L'ordre inversé décalait l'orientation d'environ 90°.
      tr.mesh.rotation.y = Math.atan2(nz - z, nx - x);
    });
  }

  /* ── Stade e-sport ── */
  // Rayon réduit pour tenir dans le couloir entre les avenues ±32 et ±44
  // (le stade original débordait des deux côtés — son diamètre dépassait
  // l'espace disponible entre les deux routes qui l'encadrent).
  function createStadium(x, z) {
    const group = new THREE.Group();
    const wall = new THREE.Mesh(
      new THREE.CylinderGeometry(4, 4.5, 2.6, 24, 1, true),
      new THREE.MeshStandardMaterial({ color: 0x14203a, roughness: 0.7, side: THREE.DoubleSide })
    );
    wall.position.y = 1.3;
    group.add(wall);

    const roof = new THREE.Mesh(
      new THREE.RingGeometry(2.6, 4.65, 24),
      new THREE.MeshStandardMaterial({ color: 0x0d1424, roughness: 0.6, side: THREE.DoubleSide })
    );
    roof.rotation.x = -Math.PI / 2;
    roof.position.y = 2.65;
    group.add(roof);

    const screenTex = makeSignTexture('ESPORT_ARENA', '#ff44cc');
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.8), new THREE.MeshBasicMaterial({ map: screenTex, transparent: true }));
    screen.position.set(0, 2, 4.25);
    group.add(screen);

    // Fine bande lumineuse à la base (accent néon du stade, pas un halo de zone)
    const baseRing = new THREE.Mesh(
      new THREE.RingGeometry(4.4, 4.53, 24),
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

    // Pont surélevé (0.65 au-dessus du sol, pas 0.015 au-dessus de l'eau
    // comme avant — la route semblait littéralement flotter dans la
    // rivière) : rampes de raccord + tablier plat + garde-corps sur toute
    // la traversée + piles dans l'eau.
    const bridgeMat = new THREE.MeshStandardMaterial({ color: 0x1a2233, roughness: 0.8 });
    const DECK_Y = 0.65;

    const deck = new THREE.Mesh(new THREE.BoxGeometry(3, 0.3, 6), bridgeMat);
    deck.position.set(0, DECK_Y, 54);
    scene.add(deck);

    // Rampes : du niveau de la route (0.03) au tablier (0.65), de chaque côté
    [[-1, 50.1], [1, 57.9]].forEach(([dir, z]) => {
      const ramp = new THREE.Mesh(new THREE.BoxGeometry(3, 0.25, 2.2), bridgeMat);
      ramp.position.set(0, DECK_Y / 2, z);
      ramp.rotation.x = dir * 0.28;
      scene.add(ramp);
    });

    // Garde-corps sur toute la traversée (rampes + tablier, z 49→59)
    const railGeo = new THREE.BoxGeometry(0.06, 0.45, 10);
    const railMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 0.7 });
    [-1.55, 1.55].forEach(dx => {
      const rail = new THREE.Mesh(railGeo, railMat);
      rail.position.set(dx, DECK_Y + 0.3, 54);
      scene.add(rail);
    });

    // Piles dans l'eau, sous le tablier
    const pierGeo = new THREE.CylinderGeometry(0.3, 0.35, DECK_Y + 0.15, 8);
    const pierMat = new THREE.MeshStandardMaterial({ color: 0x141c2c, roughness: 0.7 });
    [-2.5, 0, 2.5].forEach(dz => {
      const pier = new THREE.Mesh(pierGeo, pierMat);
      pier.position.set(0, (DECK_Y + 0.15) / 2, 54 + dz);
      scene.add(pier);
    });

    // Promenade piétonne le long des deux berges, juste derrière le
    // liseré lumineux (bank) — limitée aux abords du pont (40 de large,
    // pas toute la largeur de la rivière) : pas d'avenue ni de trottoir
    // n'y mène ailleurs, une promenade sur 140 de large aurait été une
    // longue bande vide sans utilité, pas juste une "ligne en plus".
    const promenadeMat = new THREE.MeshStandardMaterial({ color: 0x1a2233, roughness: 0.95 });
    const promenadeGeo = new THREE.PlaneGeometry(40, 1.5);
    [48.55, 59.45].forEach(z => {
      const promenade = new THREE.Mesh(promenadeGeo, promenadeMat);
      promenade.rotation.x = -Math.PI / 2;
      promenade.position.set(0, 0.03, z);
      scene.add(promenade);
    });
  }
  createRiver();
  // Route de raccord entre la dernière avenue (±44) et le pied du pont
  // (49) — s'arrête AVANT la rivière (qui commence à 49.5) au lieu de se
  // prolonger dedans comme avant. Stub symétrique côté nord (59→64) pour
  // que le pont mène quelque part des deux côtés.
  addRoad(0, 46.5, 2.4, 5);
  addRoad(0, 61.5, 2.4, 5);

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

  /* ── Orbite caméra ──
     Navigation normale : le survol de la souris pilote l'angle, comme
     avant — ça n'entre jamais en conflit avec le scroll de la page qui
     fait apparaître les sections.
     Mode "Vue ville" (bouton œil, UI masquée) : en plus du survol, on
     active molette = zoom et clic-glisser = rotation libre. On ne les
     branche que dans ce mode pour ne jamais capter le scroll normal du
     site ailleurs. ── */
  const orbit = {
    theta: Math.PI / 4,
    phi:   0.95,
    radius: 44,
  };
  const DEFAULT_RADIUS = 44;
  const orbitSmooth = { theta: orbit.theta, phi: orbit.phi, radius: orbit.radius };
  const THETA_RANGE = Math.PI * 2.0;
  // PHI_MAX s'arrête juste avant π/2 (l'horizontale pure) : au-delà,
  // camera.y = radius·cos(phi) devient négatif et on passe sous le sol,
  // ce qui casse le rendu (vu depuis fix précédent). 1.55 laisse une vue
  // quasi au niveau de la rue tout en restant toujours au-dessus.
  const PHI_MIN = 0.15, PHI_MAX = 1.55;
  const PHI_BASE = 0.35;
  // Calibré pour que le bas de l'écran (souris tout en bas) corresponde
  // pile à PHI_MAX, au lieu de plafonner déjà aux deux tiers de l'écran
  // et de rester "collé" en bas sans réaction pour le dernier tiers.
  const PHI_RANGE = PHI_MAX - PHI_BASE;

  function isCityOnlyView() { return document.body.classList.contains('city-only-view'); }

  // Point regardé par la caméra (glisse vers un bâtiment quand on "voyage" vers lui)
  const focusTarget       = new THREE.Vector3(0, 2, 0);
  const focusTargetSmooth = new THREE.Vector3(0, 2, 0);
  let focused = false; // tant que true, la souris ne pilote plus l'angle
  let zoomOffset = 0;   // molette / pincement — seulement actif en "Vue ville"
  let dragging = false;
  let lastPointer = { x: 0, y: 0 };

  /* ── Balade libre (ZQSD/WASD ou flèches) — seulement en "Vue ville" ──
     Déplace le point regardé (focusTarget) dans le sens où la caméra
     regarde actuellement, au lieu d'un simple pivot autour d'un point
     fixe. Un bonhomme (rig articulé dédié, plus détaillé que les
     piétons de fond) apparaît à cet endroit via le bouton "Explorer à
     pied" ou dès la
     première touche pressée, marche vraiment (jambes/bras animés,
     orienté dans le sens du déplacement), et la caméra se rapproche
     pour le suivre en vue 3ᵉ personne au lieu de rester à la distance
     "vue d'ensemble de la ville". */
  const walkKeys = {};
  window.addEventListener('keydown', (e) => { walkKeys[e.key.toLowerCase()] = true; });
  window.addEventListener('keyup',   (e) => { walkKeys[e.key.toLowerCase()] = false; });
  const WALK_SPEED = 0.3;

  /* ── Bonhomme joueur (version détaillée) ──
     Silhouette cyberpunk distincte des piétons de fond : combinaison
     sombre, visière + cœur lumineux cyan, antenne rose (seul accent,
     comme le reste du site), mains/bottes lumineuses, ombre portée et
     anneau de position au sol pour bien le repérer en vue 3e personne. */
  const playerBodyMat   = new THREE.MeshStandardMaterial({ color: 0x131c30, roughness: 0.5, metalness: 0.35, emissive: 0x00f0ff, emissiveIntensity: 0.05 });
  const playerAccentMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 1.0, roughness: 0.35 });
  const playerPinkMat   = new THREE.MeshStandardMaterial({ color: 0xff44cc, emissive: 0xff44cc, emissiveIntensity: 0.9, roughness: 0.35 });

  const player = new THREE.Group();

  // Torse (épaules plus larges que la taille)
  const playerTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.075, 0.26, 8), playerBodyMat);
  playerTorso.position.y = 0.34;
  player.add(playerTorso);
  // Cœur lumineux sur la poitrine
  const playerCore = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), playerAccentMat);
  playerCore.position.set(0, 0.385, 0.085);
  player.add(playerCore);
  // Épaulettes
  [-1, 1].forEach(s => {
    const pad = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.07), playerBodyMat);
    pad.position.set(s * 0.115, 0.455, 0);
    player.add(pad);
  });
  // Tête = groupe (crâne + visière + antenne) pour pouvoir la pencher en marchant
  const playerHead = new THREE.Group();
  playerHead.position.y = 0.56;
  const playerSkull = new THREE.Mesh(new THREE.SphereGeometry(0.078, 10, 10), playerBodyMat);
  playerHead.add(playerSkull);
  const playerVisor = new THREE.Mesh(new THREE.BoxGeometry(0.105, 0.032, 0.028), playerAccentMat);
  playerVisor.position.set(0, 0.012, 0.066); // face avant (+Z = sens de marche)
  playerHead.add(playerVisor);
  const playerAntenna = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.09, 4), playerPinkMat);
  playerAntenna.position.set(-0.05, 0.09, -0.02);
  playerAntenna.rotation.z = 0.25;
  playerHead.add(playerAntenna);
  player.add(playerHead);

  // Membres : mêmes pivots hanche/épaule que les piétons, géométrie dédiée
  const playerLimbGeo = new THREE.CylinderGeometry(0.03, 0.023, 0.22, 6);
  function playerLimb(hipY) {
    const pivot = new THREE.Group();
    pivot.position.y = hipY;
    const mesh = new THREE.Mesh(playerLimbGeo, playerBodyMat);
    mesh.position.y = -0.11;
    pivot.add(mesh);
    // Extrémité lumineuse (main / botte)
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 6), playerAccentMat);
    tip.position.y = -0.215;
    pivot.add(tip);
    return pivot;
  }
  const playerLegL = playerLimb(0.22); playerLegL.position.x = -0.05;  player.add(playerLegL);
  const playerLegR = playerLimb(0.22); playerLegR.position.x =  0.05;  player.add(playerLegR);
  const playerArmL = playerLimb(0.44); playerArmL.position.x = -0.125; player.add(playerArmL);
  const playerArmR = playerLimb(0.44); playerArmR.position.x =  0.125; player.add(playerArmR);

  // Ombre douce + anneau de position au sol (suivent le bonhomme)
  const playerShadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.22, 16),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false })
  );
  playerShadow.rotation.x = -Math.PI / 2;
  playerShadow.position.y = 0.012;
  player.add(playerShadow);
  const playerRingMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false });
  const playerRing = new THREE.Mesh(new THREE.RingGeometry(0.26, 0.3, 24), playerRingMat);
  playerRing.rotation.x = -Math.PI / 2;
  playerRing.position.y = 0.02;
  player.add(playerRing);

  player.scale.setScalar(1.4); // un peu plus grand que les piétons de fond, pour bien le repérer
  player.visible = false;
  scene.add(player);

  let playerActive = false; // devient vrai au clic sur "Explorer à pied" ou à la 1ère touche de marche
  let playerFacing = 0;
  let playerWalkPhase = 0;
  let lookPitch = 0; // regard haut/bas en vue 1re personne (pas la même chose que orbit.phi)
  // Commence en 3e personne (visible) : en 1re personne par défaut, le
  // bonhomme n'apparaît jamais à l'écran (la caméra est "dedans"), ce qui
  // donnait l'impression que rien ne se passait. On le voit d'abord
  // apparaître, et on peut passer en 1re personne ensuite (bouton/touche V).
  let thirdPerson = true;
  const PLAYER_RADIUS = 9; // distance de la caméra en vue 3e personne
  const IS_TOUCH = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  const viewModeToggle    = document.getElementById('view-mode-toggle');
  const walkModeBtn       = document.getElementById('walk-mode-btn');
  const walkControlsPanel = document.getElementById('walk-controls-panel');
  const walkJoystick      = document.getElementById('walk-joystick');

  function toggleViewMode() {
    thirdPerson = !thirdPerson;
    player.visible = thirdPerson;
  }
  if (viewModeToggle) viewModeToggle.addEventListener('click', toggleViewMode);
  window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'v' && playerActive) toggleViewMode();
  });

  /* Le bouton "Explorer à pied" rend le mode découvrable : avant, il
     fallait deviner qu'une touche de marche l'activait. Visible seulement
     en Vue ville tant que le bonhomme n'est pas actif. Une fois actif :
     panneau de contrôles sur desktop, joystick virtuel sur mobile. */
  function refreshWalkUI() {
    const inCity = isCityOnlyView();
    if (walkModeBtn)       walkModeBtn.classList.toggle('hidden', !inCity || playerActive);
    if (walkControlsPanel) walkControlsPanel.classList.toggle('hidden', !inCity || !playerActive || IS_TOUCH);
    if (walkJoystick)      walkJoystick.classList.toggle('hidden', !inCity || !playerActive || !IS_TOUCH);
    if (viewModeToggle)    viewModeToggle.classList.toggle('hidden', !inCity || !playerActive);
  }
  window.refreshWalkUI = refreshWalkUI; // aussi appelé par le bouton "Vue ville"

  function activatePlayer() {
    if (playerActive) return;
    playerActive = true;
    player.visible = thirdPerson; // caché en 1re personne, visible en 3e
    player.position.set(focusTarget.x, 0, focusTarget.z);
    refreshWalkUI();
  }
  function deactivatePlayer() {
    playerActive = false;
    player.visible = false;
    lookPitch = 0;
    focusTarget.y = 2; // hauteur de vue normale, ré-adoptée en quittant le mode piéton
    refreshWalkUI();
  }
  if (walkModeBtn) walkModeBtn.addEventListener('click', activatePlayer);
  document.querySelectorAll('.walk-exit-btn').forEach(b => b.addEventListener('click', deactivatePlayer));

  /* ── Collisions ──
     Le bonhomme ne traverse plus les bâtiments (boîtes 1.8×1.8 centrées
     sur group.position) et reste dans les limites du monde (la rivière
     commence vers z≈49, d'où le plafond à 46). Poussée hors de la boîte
     par l'axe le moins enfoncé : on "glisse" le long des murs au lieu de
     rester bloqué net. ~81 bâtiments testés par frame = négligeable. */
  const PLAYER_CLEARANCE = 1.25;
  function resolvePlayerCollisions(nx, nz) {
    nx = Math.max(-68, Math.min(68, nx));
    nz = Math.max(-68, Math.min(46, nz));
    for (let i = 0; i < buildings.length; i++) {
      const b = buildings[i].position;
      const dx = nx - b.x, dz = nz - b.z;
      if (Math.abs(dx) < PLAYER_CLEARANCE && Math.abs(dz) < PLAYER_CLEARANCE) {
        if (Math.abs(dx) > Math.abs(dz)) nx = b.x + (dx >= 0 ? 1 : -1) * PLAYER_CLEARANCE;
        else                             nz = b.z + (dz >= 0 ? 1 : -1) * PLAYER_CLEARANCE;
      }
    }
    return { x: nx, z: nz };
  }

  /* ── Joystick virtuel (mobile) ──
     Renvoie un vecteur analogique (-1..1) fusionné avec le clavier dans
     updateWalkControls. touch-action:none sur l'élément + preventDefault
     pour ne jamais déclencher le scroll ou la rotation caméra du canvas. */
  const joyInput = { f: 0, r: 0 };
  (function initJoystick() {
    if (!walkJoystick) return;
    const knob = walkJoystick.querySelector('.joy-knob');
    const RANGE = 34;
    let touchId = null, cx = 0, cy = 0;
    function setKnob(dx, dy) { knob.style.transform = `translate(${dx}px, ${dy}px)`; }
    walkJoystick.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const tch = e.changedTouches[0];
      touchId = tch.identifier;
      const r = walkJoystick.getBoundingClientRect();
      cx = r.left + r.width / 2; cy = r.top + r.height / 2;
    }, { passive: false });
    walkJoystick.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (const tch of e.changedTouches) {
        if (tch.identifier !== touchId) continue;
        let dx = tch.clientX - cx, dy = tch.clientY - cy;
        const len = Math.hypot(dx, dy);
        if (len > RANGE) { dx = dx / len * RANGE; dy = dy / len * RANGE; }
        setKnob(dx, dy);
        joyInput.r = dx / RANGE;
        joyInput.f = -dy / RANGE;
      }
    }, { passive: false });
    function endJoy(e) {
      for (const tch of e.changedTouches) {
        if (tch.identifier !== touchId) continue;
        touchId = null; setKnob(0, 0); joyInput.f = 0; joyInput.r = 0;
      }
    }
    walkJoystick.addEventListener('touchend', endJoy);
    walkJoystick.addEventListener('touchcancel', endJoy);
  })();

  function updateWalkControls() {
    if (!isCityOnlyView()) {
      if (playerActive || (walkModeBtn && !walkModeBtn.classList.contains('hidden'))) deactivatePlayer();
      return;
    }
    if (focused) return;

    let fInput = 0, rInput = 0;
    if (walkKeys['w'] || walkKeys['z'] || walkKeys['arrowup'])    fInput += 1;
    if (walkKeys['s'] || walkKeys['arrowdown'])                  fInput -= 1;
    if (walkKeys['d'] || walkKeys['arrowright'])                 rInput += 1;
    if (walkKeys['a'] || walkKeys['q'] || walkKeys['arrowleft']) rInput -= 1;
    fInput += joyInput.f;
    rInput += joyInput.r;
    const moving  = Math.hypot(fInput, rInput) > 0.08;
    const running = !!walkKeys['shift'];

    if (moving) {
      if (!playerActive) activatePlayer();
      const speed = WALK_SPEED * (running ? 1.9 : 1);
      const fx = -Math.sin(orbit.theta), fz = -Math.cos(orbit.theta);
      const rx = -fz, rz = fx;
      const len = Math.max(1, Math.hypot(fInput, rInput)); // analogique : jamais amplifié, jamais > 1
      const moveX = (fx * fInput + rx * rInput) / len;
      const moveZ = (fz * fInput + rz * rInput) / len;
      const solved = resolvePlayerCollisions(
        focusTarget.x + moveX * speed,
        focusTarget.z + moveZ * speed
      );
      focusTarget.x = solved.x;
      focusTarget.z = solved.z;

      // Rotation lissée vers la direction de marche (plus de demi-tour sec)
      const targetFacing = Math.atan2(moveX, moveZ);
      let dFace = targetFacing - playerFacing;
      if (dFace >  Math.PI) dFace -= Math.PI * 2;
      if (dFace < -Math.PI) dFace += Math.PI * 2;
      playerFacing += dFace * 0.22;

      playerWalkPhase += running ? 0.36 : 0.25;
      const amp = running ? 0.8 : 0.6;
      const swing = Math.sin(playerWalkPhase) * amp;
      playerLegL.rotation.x =  swing; playerLegR.rotation.x = -swing;
      playerArmL.rotation.x = -swing * 0.85; playerArmR.rotation.x =  swing * 0.85;
      // Rebond du corps + inclinaison vers l'avant (plus marquée en courant)
      player.position.y = Math.abs(Math.sin(playerWalkPhase)) * (running ? 0.045 : 0.028);
      playerTorso.rotation.x += ((running ? 0.16 : 0.08) - playerTorso.rotation.x) * 0.15;
      playerHead.rotation.x = playerTorso.rotation.x * 0.5;
    } else if (playerActive) {
      // Retour au repos (membres, inclinaison, rebond) + légère respiration
      playerLegL.rotation.x += (0 - playerLegL.rotation.x) * 0.2;
      playerLegR.rotation.x += (0 - playerLegR.rotation.x) * 0.2;
      playerArmL.rotation.x += (0 - playerArmL.rotation.x) * 0.2;
      playerArmR.rotation.x += (0 - playerArmR.rotation.x) * 0.2;
      playerTorso.rotation.x += (0 - playerTorso.rotation.x) * 0.15;
      playerHead.rotation.x  += (0 - playerHead.rotation.x)  * 0.15;
      player.position.y += (0 - player.position.y) * 0.2;
      playerTorso.position.y = 0.34 + Math.sin(t * 2.2) * 0.004;
    }

    if (playerActive) {
      player.position.x = focusTarget.x;
      player.position.z = focusTarget.z;
      player.rotation.y = playerFacing;
      // Anneau de position qui pulse doucement
      playerRingMat.opacity = 0.35 + 0.2 * Math.sin(t * 3);
    }
  }

  window.addEventListener('mousemove', (e) => {
    if (dragging) {
      const dx = e.clientX - lastPointer.x, dy = e.clientY - lastPointer.y;
      lastPointer = { x: e.clientX, y: e.clientY };
      orbit.theta -= dx * 0.006;
      if (playerActive && !thirdPerson) {
        // Vue 1re personne : regard haut/bas dédié (lookPitch), pas orbit.phi
        // (qui décrit l'angle d'une caméra en orbite, pas un regard sur soi).
        lookPitch = Math.min(0.85, Math.max(-0.85, lookPitch - dy * 0.006));
      } else {
        orbit.phi = Math.min(PHI_MAX, Math.max(PHI_MIN, orbit.phi - dy * 0.006));
      }
      return;
    }
    if (focused) return;
    const nx = e.clientX / window.innerWidth;
    const ny = e.clientY / window.innerHeight;
    orbit.theta = nx * THETA_RANGE;
    // Plafonné à PHI_MAX : au-delà, la caméra passerait sous l'horizon et
    // se retrouverait à regarder la ville par en dessous (rendu cassé,
    // le sol/les bâtiments n'ont pas de face visible de ce côté-là).
    orbit.phi   = Math.min(PHI_MAX, PHI_BASE + ny * PHI_RANGE);
  });

  canvas.addEventListener('mousedown', (e) => {
    if (!isCityOnlyView()) return;
    dragging = true;
    lastPointer = { x: e.clientX, y: e.clientY };
    if (focused) unfocus();
  });
  window.addEventListener('mouseup', () => { dragging = false; });

  canvas.addEventListener('wheel', (e) => {
    if (!isCityOnlyView()) return;
    e.preventDefault();
    zoomOffset = Math.min(70, Math.max(-25, zoomOffset + e.deltaY * 0.05));
  }, { passive: false });

  /* ── Raycasting (hover + click) ── */
  const raycaster = new THREE.Raycaster();
  const mouse     = new THREE.Vector2(-9999, -9999);
  const tooltip   = document.getElementById('tooltip-3d');
  let hoveredBuilding = null;
  let selectedBuilding = null;
  let buildMode = false;
  let selectedBuildType = null;

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
        canvas.classList.add('hovering');
      }
      setTooltip(grp, e.clientX, e.clientY);
    } else {
      if (hoveredBuilding && hoveredBuilding !== selectedBuilding) resetHighlight(hoveredBuilding);
      hoveredBuilding = null;
      tooltip.style.display = 'none';
      canvas.classList.remove('hovering');
    }
  });

  canvas.addEventListener('click', (e) => {
    if (document.body.classList.contains('hud-hidden')) return;
    // En vue 1re personne, un clic ne doit pas déclencher unfocus() (qui
    // recentre focusTarget sur l'origine et téléporterait le bonhomme).
    if (playerActive) return;
    raycaster.setFromCamera(mouse, camera);

    if (buildMode && selectedBuildType) {
      const lotHits = raycaster.intersectObjects(lotMarkerMeshes);
      if (lotHits.length) {
        tryPlaceBuilding(lotHits[0].object.userData.lotId, selectedBuildType);
        return;
      }
      // Aucun lot touché : on laisse tomber vers la logique normale — un
      // clic dans le vide sert alors à annuler le mode construction.
    }

    const hits = raycaster.intersectObjects(bodyMeshes);
    if (hits.length) {
      const idx = bodyMeshes.indexOf(hits[0].object);
      const grp = buildings[idx];
      focusOnBuilding(grp);
      window.dispatchEvent(new CustomEvent('buildingSelected', { detail: { job: grp.userData.job } }));
    } else {
      unfocus();
      if (buildMode) exitBuildMode();
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

    // Balade libre au clavier (Vue ville uniquement)
    updateWalkControls();

    // Orbite sphérique lissée (LERP faible = mouvement plus long/fluide)
    const LERP = 0.02;
    const FOCUS_LERP = 0.035;
    // Lerp angulaire (gestion du wrap 0/2π pour éviter le saut) — toujours
    // actif, y compris en vue 1re personne (lacet du regard).
    let dt = orbit.theta - orbitSmooth.theta;
    if (dt >  Math.PI) dt -= Math.PI * 2;
    if (dt < -Math.PI) dt += Math.PI * 2;
    orbitSmooth.theta += dt * (focused || playerActive ? FOCUS_LERP : LERP);

    if (playerActive && !thirdPerson) {
      // Vue 1re personne : la caméra est aux yeux du bonhomme, pas en
      // orbite autour d'un point — plus de rayon/hauteur d'orbite ici,
      // juste une position + un regard (lacet=orbit.theta, tangage=lookPitch).
      const EYE_HEIGHT = 0.75;
      camera.position.set(player.position.x, EYE_HEIGHT, player.position.z);
      camera.lookAt(
        camera.position.x - Math.sin(orbitSmooth.theta) * Math.cos(lookPitch),
        camera.position.y + Math.sin(lookPitch),
        camera.position.z - Math.cos(orbitSmooth.theta) * Math.cos(lookPitch)
      );
    } else if (playerActive && thirdPerson) {
      // Vue 3e personne : orbite classique (souris → thêta/phi) mais
      // centrée sur le bonhomme au lieu de l'origine/un bâtiment.
      const targetPhi = Math.min(PHI_MAX, Math.max(PHI_MIN, orbit.phi));
      orbitSmooth.phi    += (targetPhi     - orbitSmooth.phi)    * FOCUS_LERP;
      orbitSmooth.radius += (PLAYER_RADIUS - orbitSmooth.radius) * FOCUS_LERP;
      camera.position.x = player.position.x + orbitSmooth.radius * Math.sin(orbitSmooth.phi) * Math.sin(orbitSmooth.theta);
      camera.position.y = 0.9 + orbitSmooth.radius * Math.cos(orbitSmooth.phi);
      camera.position.z = player.position.z + orbitSmooth.radius * Math.sin(orbitSmooth.phi) * Math.cos(orbitSmooth.theta);
      camera.lookAt(player.position.x, 0.9, player.position.z);
    } else {
      // Cible du rayon : s'éloigne + prend de la hauteur quand on scroll (sauf en mode focus)
      const scrollRadiusTarget = focused ? orbit.radius : DEFAULT_RADIUS + scrollZoom * 55 + zoomOffset;
      const scrollPhiTarget    = focused ? orbit.phi    : Math.max(0.2, orbit.phi - scrollZoom * 0.35);
      orbitSmooth.phi    += (scrollPhiTarget    - orbitSmooth.phi)    * (focused ? FOCUS_LERP : 0.035);
      orbitSmooth.radius += (scrollRadiusTarget - orbitSmooth.radius) * (focused ? FOCUS_LERP : 0.035);
      focusTargetSmooth.lerp(focusTarget, FOCUS_LERP);

      camera.position.x = orbitSmooth.radius * Math.sin(orbitSmooth.phi) * Math.sin(orbitSmooth.theta);
      camera.position.y = orbitSmooth.radius * Math.cos(orbitSmooth.phi);
      camera.position.z = orbitSmooth.radius * Math.sin(orbitSmooth.phi) * Math.cos(orbitSmooth.theta);
      camera.lookAt(focusTargetSmooth);
    }

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
    // Rames de la ligne annulaire (parcourent tout le circuit, même sens)
    updateLoopTrains();

    // Feux de circulation + voitures
    const trafficPhase = getTrafficPhase(t);
    updateTrafficLights(trafficPhase);
    updateMovingCars(trafficPhase);

    // Piétons, cyclistes, oiseaux des parcs
    updateMovingPedestrians();
    updateMovingCyclists();
    updateParkBirds();

    // Mini-carte (canvas 2D, une frame sur 4 seulement — inutile de la
    // redessiner à 60fps pour un simple point qui bouge doucement)
    frameCount++;
    if (minimapCtx && frameCount % 4 === 0) drawMinimap();

    renderer.render(scene, camera);
  }
  animate();

  /* ── Écran de chargement ──
     Toute la ville est générée procéduralement (aucun asset externe) :
     le gros du temps passe dans l'init synchrone ci-dessus, pendant
     laquelle l'overlay est déjà affiché. On anime ensuite la barre sur
     les toutes premières frames rendues, puis on fond l'écran —
     l'utilisateur ne voit jamais une ville "à moitié construite". */
  (function runLoadingScreen() {
    const screenEl = document.getElementById('loading-screen');
    const bar      = document.getElementById('loading-bar');
    const status   = document.getElementById('loading-status');
    if (!screenEl || !bar) return;
    const steps = [
      'Génération des bâtiments…',
      'Réseau routier & métro…',
      'Population & trafic…',
      'Synchronisation neurale…',
    ];
    let f = 0;
    const TOTAL = 55;
    (function tick() {
      f++;
      const p = Math.min(1, f / TOTAL);
      bar.style.width = (p * 100).toFixed(1) + '%';
      if (status) status.textContent = steps[Math.min(steps.length - 1, Math.floor(p * steps.length))];
      if (p < 1) { requestAnimationFrame(tick); return; }
      screenEl.style.opacity = '0';
      setTimeout(() => screenEl.remove(), 750);
    })();
  })();

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
      if (window.refreshWalkUI) window.refreshWalkUI();
    });
  }

  /* ── Construction (simulation) ── */
  const simBuildToggle = document.getElementById('sim-build-toggle');
  const simBuildMenu = document.getElementById('sim-build-menu');

  function updateBuildMenu() {
    if (!simBuildMenu) return;
    simBuildMenu.innerHTML = '';
    Object.keys(SIM_BUILDING_TYPES).forEach(type => {
      const info = SIM_BUILDING_TYPES[type];
      const affordable = sim.money >= info.cost;
      const active = selectedBuildType === type;
      const btn = document.createElement('button');
      btn.className = 'w-full flex justify-between px-2 py-1.5 rounded font-mono text-[9px] uppercase tracking-wider transition-colors '
        + (active
            ? 'bg-[#00f0ff]/20 border border-[#00f0ff]/50 text-[#dbfcff]'
            : 'bg-[#2e3447]/40 border border-[#849495]/20 text-[#849495] hover:border-[#00f0ff]/40')
        + (affordable ? '' : ' opacity-40 pointer-events-none');
      btn.innerHTML = `<span>${info.label}</span><span>$${info.cost}</span>`;
      btn.addEventListener('click', () => {
        selectedBuildType = (selectedBuildType === type) ? null : type;
        updateBuildMenu();
      });
      simBuildMenu.appendChild(btn);
    });
  }

  function exitBuildMode() {
    buildMode = false;
    selectedBuildType = null;
    if (simBuildMenu) simBuildMenu.classList.add('hidden');
    lotMarkerMeshes.forEach(m => { if (m.visible) m.material = lotMat; });
    updateBuildMenu();
  }

  if (simBuildToggle) {
    simBuildToggle.addEventListener('click', () => {
      buildMode = !buildMode;
      if (!buildMode) { selectedBuildType = null; }
      if (simBuildMenu) simBuildMenu.classList.toggle('hidden', !buildMode);
      lotMarkerMeshes.forEach(m => { if (m.visible) m.material = buildMode ? lotMatActive : lotMat; });
      updateBuildMenu();
    });
  }
  updateBuildMenu();

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

  /* ── Support tactile : tap sur un bâtiment = sélection (partout).
     En mode "Vue ville" en plus : un doigt qui glisse fait tourner la
     caméra, deux doigts qui pincent zooment. Ces gestes ne sont jamais
     actifs en navigation normale, pour ne jamais bloquer le scroll
     tactile qui fait apparaître les sections. ── */
  let touchStart = null;
  let touchMoved = false;
  let pinchStartDist = null;
  function touchDist(t0, t1) {
    return Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
  }

  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      pinchStartDist = touchDist(e.touches[0], e.touches[1]);
      touchStart = null;
      return;
    }
    const t = e.changedTouches[0];
    touchStart = { x: t.clientX, y: t.clientY };
    touchMoved = false;
    if (isCityOnlyView() && focused) unfocus();
  }, { passive: true });

  canvas.addEventListener('touchmove', (e) => {
    if (!isCityOnlyView()) return;
    if (e.touches.length === 2 && pinchStartDist) {
      e.preventDefault();
      const dist = touchDist(e.touches[0], e.touches[1]);
      zoomOffset = Math.min(70, Math.max(-25, zoomOffset - (dist - pinchStartDist) * 0.08));
      pinchStartDist = dist;
      return;
    }
    if (!touchStart || e.touches.length !== 1) return;
    const t = e.touches[0];
    const dx = t.clientX - touchStart.x, dy = t.clientY - touchStart.y;
    if (Math.hypot(dx, dy) > 4) touchMoved = true;
    e.preventDefault();
    orbit.theta -= dx * 0.006;
    orbit.phi = Math.min(PHI_MAX, Math.max(PHI_MIN, orbit.phi - dy * 0.006));
    touchStart = { x: t.clientX, y: t.clientY };
  }, { passive: false });

  canvas.addEventListener('touchend', (e) => {
    pinchStartDist = null;
    if (!touchStart) return;
    if (document.body.classList.contains('hud-hidden')) { touchStart = null; return; }
    const t = e.changedTouches[0];
    const moved = touchMoved || Math.hypot(t.clientX - touchStart.x, t.clientY - touchStart.y) > 12;
    touchStart = null;
    if (moved) return; // c'était un glissé (scroll ou rotation), pas un tap

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
