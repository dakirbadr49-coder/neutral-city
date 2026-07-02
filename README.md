# ◈ NEURAL_CITY

**Ville cyberpunk 3D interactive — portfolio technique en Three.js**

Chaque bâtiment de la ville représente un langage ou une technologie, regroupés par
quartiers (Web/Frontend, Backend, Data/IA, Système). On peut survoler et cliquer les
bâtiments, voyager de secteur en secteur, ou explorer la ville à pied avec un
personnage jouable, de jour comme de nuit.

---

## ✨ Fonctionnalités

- **Ville procédurale** : 90+ bâtiments générés en Three.js, fenêtres émissives,
  toits lumineux, antennes, arêtes néon aux couleurs officielles de chaque techno.
- **Mode piéton** : bouton *« Explorer à pied »* en Vue ville — personnage articulé
  (marche, course, respiration à l'arrêt), collisions avec les bâtiments, vue
  1ʳᵉ / 3ᵉ personne, joystick virtuel sur mobile.
- **Ville vivante** : voitures et feux de circulation, piétons, cyclistes, rames de
  métro (ligne annulaire incluse), oiseaux, nuages animés.
- **Cycle jour / nuit** avec transition douce (brouillard, lumières, montagnes).
- **Simulation de gestion** : argent, population, énergie/eau, pollution,
  satisfaction — construction de bâtiments, état persisté en `localStorage`.
- **Interface HUD** : sidebar de secteurs avec fly-to caméra, tooltip 3D au survol,
  mini-carte temps réel, mode « Vue ville » plein écran, écran de chargement.
- **Sections scrollables** avec apparition 3D (stack technique, à propos, télémétrie).
- **Responsive** : menu hamburger, gestes tactiles (rotation 1 doigt, pincement zoom).

## 🎮 Contrôles

| Action | Contrôle |
|---|---|
| Tourner la caméra | Souris (ou glisser en Vue ville) |
| Zoomer | Molette / pincement |
| Activer le mode piéton | Bouton **⇧ Explorer à pied** (Vue ville) ou une touche de marche |
| Marcher | `Z Q S D` / `W A S D` / flèches — joystick sur mobile |
| Courir | `Shift` |
| Vue 1ʳᵉ / 3ᵉ personne | `V` ou le bouton dédié |
| Sélectionner un bâtiment | Clic / tap |

## 🛠 Stack

- **Three.js r128** — rendu 3D (aucun asset externe, tout est procédural)
- **Tailwind CSS** (CDN) — interface HUD
- **JavaScript vanilla** — aucune dépendance de build

## 🚀 Lancer le projet

Aucune installation requise :

```bash
# Option 1 : ouvrir directement
open index.html

# Option 2 : petit serveur local (recommandé)
npx serve .
```

## 📁 Structure

```
├── index.html   # HUD, sections scrollables, overlays (chargement, contrôles)
├── script.js    # Scène Three.js : ville, trafic, personnage, simulation, caméra
├── style.css    # Curseurs custom, animations, mode Vue ville, responsive
└── README.md
```

---

*Projet 100 % fait maison — il grandit petit à petit : nouveaux secteurs, nouvelles
interactions, nouveaux effets à chaque étape.*
