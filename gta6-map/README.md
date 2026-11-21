# GTA 6 Carte (PWA iPhone)

Application web installable sur l’écran d’accueil de l’iPhone : carte interactive, recherche, favoris, astuces et fonctionnement hors ligne.

## Installation sur iPhone
1. Hébergez le dossier `gta6-map/` en HTTPS (GitHub Pages, Netlify, Vercel…). Les service workers exigent HTTPS.
2. Ouvrez l’URL dans **Safari**.
3. Touchez le bouton Partager puis **Sur l’écran d’accueil**.

## Test local
```bash
cd gta6-map && python3 -m http.server 8080
```
Puis ouvrez http://localhost:8080 (le mode hors ligne ne s’active qu’en HTTPS ou localhost).

## Contenu
- `data/locations.json` : lieux, catégories, astuces (format dans `data/README.md`).
- `maps/carte.jpg` : image de la carte.
- `app.js` / `styles.css` : logique et thème clair/sombre automatique.

## Limites actuelles
- Les données réelles ne sont pas encore intégrées : le fichier contient un exemple.
- Pas de géolocalisation GPS dans le jeu (la carte n’est pas géoréférencée sur le monde réel).
- Pour une app native App Store, il faudra un Mac avec Xcode ; cette version web s’installe sans passer par l’App Store.
