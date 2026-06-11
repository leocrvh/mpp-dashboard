# MPP Dashboard · Coupe du Monde 2026

Dashboard TV pour afficher le classement MPP + les matchs de la Coupe du Monde 2026 en temps réel.

## Déploiement sur GitHub Pages

1. Crée un repo GitHub (ex: `mpp-dashboard`)
1. Upload les 3 fichiers : `index.html`, `style.css`, `app.js`
1. Va dans **Settings → Pages → Source → main branch → / (root)**
1. Ton site sera dispo sur `https://TON-PSEUDO.github.io/mpp-dashboard/`

## Configuration clé API (obligatoire pour les matchs en temps réel)

Les matchs sont récupérés via [API-Football](https://api-football.com) — plan **gratuit** (100 req/jour, largement suffisant).

### Créer ta clé gratuite :

1. Va sur **<https://dashboard.api-football.com/register>**
1. Crée un compte (email + mot de passe)
1. Dans le dashboard, copie ta **API Key**
1. Sur le site, clique sur **“Configurer maintenant”** (barre en bas) et colle ta clé

La clé est sauvegardée dans le navigateur (localStorage), elle ne sera pas perdue au rechargement.

## Classement MPP

Le classement se met à jour **manuellement** :

- Clique sur le bouton ✏️ en haut du tableau de gauche
- Saisis les joueurs avec leurs points, bonnes issues et scores exacts
- Clique **Enregistrer** — le classement est trié automatiquement par points

> Le classement est sauvegardé dans le navigateur de la télé. Tu n’auras à le saisir qu’une fois, et tu pourras le mettre à jour après chaque journée de matchs MPP.

## Rafraîchissement automatique

Le site se rafraîchit automatiquement **toutes les 3 minutes** (visible dans le compteur en haut à droite de la section matchs).

## Affichage TV

- Conçu pour un écran **16:9 en plein écran**
- Ouvre le site sur la télé, appuie sur le bouton **plein écran** du navigateur (F11 sur PC, ou l’option du navigateur TV)
- Plus aucune action nécessaire ensuite