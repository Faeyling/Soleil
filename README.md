# Soleil — suivi quotidien du SEDh

Soleil est une application web personnelle pour suivre au jour le jour les symptômes
liés au syndrome d'Ehlers-Danlos hypermobile (SEDh) : douleurs, subluxations, fatigue,
médicaments, sommeil, humeur, déclencheurs... Elle t'aide à repérer des schémas dans le
temps et à préparer un rapport clair pour tes rendez-vous médicaux.

## Confidentialité

**Aucune donnée ne quitte jamais ton appareil.** Il n'y a pas de backend, pas de compte,
pas de synchronisation en ligne. Tout est stocké localement dans ton navigateur, via
IndexedDB (grâce à [Dexie.js](https://dexie.org/)). Si tu vides le cache de ton
navigateur ou changes d'appareil, pense à faire une sauvegarde JSON depuis l'onglet
**Profil** au préalable.

## Lancer l'application en local

```bash
npm install
npm run dev
```

L'application est alors accessible sur `http://localhost:5173`.

Autres commandes utiles :

```bash
npm run build      # build de production (tsc -b && vite build)
npm run preview    # prévisualiser le build de production
npm run lint        # vérifier le code avec ESLint
npm run test         # lancer les tests (Vitest)
```

## Où sont stockées mes données ?

Toutes les entrées (symptômes, prises de médicaments, autres suivis) et la liste des
médicaments sont stockées dans une base **IndexedDB** nommée `soleil-db`, propre à ce
navigateur et à cet appareil. Rien n'est envoyé sur un serveur.

Depuis l'onglet **Profil**, tu peux à tout moment :

- Générer un **rapport PDF** pour ton médecin, sur la période et les sections de ton choix.
- **Exporter** toutes tes données au format JSON (sauvegarde manuelle, portabilité).
- **Importer** une sauvegarde JSON précédemment exportée.
- **Supprimer** définitivement toutes tes données de cet appareil.

## Installation en application (PWA)

Soleil est une PWA installable : depuis le navigateur, choisis « Installer l'application »
(ou « Ajouter à l'écran d'accueil » sur mobile) pour l'utiliser hors-ligne, comme une
application native.

## Stack technique

React + TypeScript + Vite, Tailwind CSS v4, Dexie.js (IndexedDB), Recharts pour les
graphiques, jsPDF pour l'export PDF, `vite-plugin-pwa` pour le mode hors-ligne.
