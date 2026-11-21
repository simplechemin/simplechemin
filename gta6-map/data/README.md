# Format des données

Fichier : `data/locations.json`

## Catégories
`categories` : liste `{ id, label, icon }`. L’icône emoji s’affiche sur la carte et dans les filtres.

## Lieux
Chaque entrée de `locations` :

| Champ | Type | Obligatoire | Description |
|---|---|---|---|
| `id` | texte unique | oui | identifiant stable, sans espace (ex. `mission-vice-01`) |
| `name` | texte | oui | nom affiché |
| `category` | texte | oui | un `id` de `categories` |
| `coords` | `[y, x]` | oui | position en pixels sur `maps/carte.jpg` (4096 x 4096) |
| `icon` | emoji | non | remplace l’icône de la catégorie |
| `region` | texte | non | zone de la carte |
| `summary` | texte | non | description courte |
| `details` | liste de texte | non | infos détaillées (puces) |
| `tips` | liste de texte | non | astuces affichées en encadré 💡 |
| `tags` | liste de texte | non | mots-clés pour la recherche |
| `image` | chemin | non | image affichée dans le panneau |
| `featured` | booléen | non | privilégié dans les résultats de recherche |

## Carte
Placez l’image de la carte dans `maps/carte.jpg` (4096 x 4096 recommandé). Tant qu’elle est absente, une grille de repère est affichée et les coordonnées restent valides.

## Droits
Les textes et images d’un site tiers restent protégés. Préférez rédiger vos propres descriptions et citer la source.
