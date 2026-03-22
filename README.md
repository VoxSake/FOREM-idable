# 🚀 FOREM-idable

> **L'agrégateur d'offres d'emploi conçu pour la performance, le suivi pro et le coaching.**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-C5F74F?style=flat-square&logo=drizzle)](https://orm.drizzle.team/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

---

### 🌐 [**Découvrir la version Live → https://forem.brisbois.dev**](https://forem.brisbois.dev)

---

### ![Image](https://github.com/user-attachments/assets/8eb89a79-959b-44bf-b27b-7dceea50f1b4)

## 🌟 Pourquoi FOREM-idable ?

L'interface standard du Forem est riche, mais peut s'avérer lourde pour un suivi intensif. **FOREM-idable** transforme l'expérience de recherche d'emploi en un outil de productivité "power-user" :

- **Vitesse & Efficacité :** Une interface compacte pensée pour scanner des dizaines d'offres en quelques secondes.
- **Suivi de Bout en Bout :** Ne perdez plus le fil. Gérez vos candidatures, relances et entretiens directement dans l'outil.
- **Écosystème Coach :** Une plateforme collaborative permettant aux coachs de suivre, importer et gérer les parcours de leurs bénéficiaires.

---

## ✨ Fonctionnalités Clés

### 🔍 Recherche & Analyse
- **Moteur Booléen :** Recherche avancée par mots-clés (`OU` / `ET`).
- **Filtres Géo Précis :** Multi-sélection intelligente (communes, arrondissements, provinces, régions).
- **Comparateur d'offres :** Analysez plusieurs opportunités côte à côte pour faire le bon choix.
 **![Image](https://github.com/user-attachments/assets/5514fa84-ced7-4216-8696-77d5ccdaa324)**

### 💼 Suivi Candidat & Coach
- **Dashboard Coach Enrichi :** Sections `À traiter`, `Activité récente` et sidepanel de gestion rapide.
- **Import CSV Intelligent :** Algorithme d'auto-détection de colonnes et mapping manuel pour migrer vos anciens suivis sans douleur.
- **Synchronisation Calendrier :** Flux ICS dynamiques pour retrouver vos entretiens dans Google Calendar, Outlook ou Apple Calendar.
 **![Image](https://github.com/user-attachments/assets/5970f8cc-9b2d-4d41-b408-e64d244a75c1)**

### 🛠️ Outils "Power User"
- **Proxy PDF :** Accès direct aux offres en format PDF, même derrière des restrictions serveurs (CORS).
- **API Externe Sécurisée :** Exportez vos données en JSON/CSV pour vos propres outils de reporting ou intégrations No-Code.

---

## 🛠️ Stack Technique & Choix d'Architecture

Le projet adopte une approche **SaaS de haut niveau**, privilégiant la résilience, la maintenabilité et une expérience utilisateur fluide :

- **Architecture "Feature-First" :** Découpage modulaire par domaine métier (`src/features/`) pour isoler la logique, les composants et les hooks. Cette structure facilite le scaling et l'onboarding de nouveaux développeurs.
- **Framework & Rendu :** [Next.js 16](https://nextjs.org/) (App Router) avec rendu hybride pour des performances SEO et UX optimales.
- **Gestion d'État "Page-Level" :** Utilisation de hooks personnalisés (`usePageState`) pour orchestrer la complexité des pages (dialogues, filtrage, pagination) tout en maintenant le code des composants pur et lisible.
- **Base de données & Type Safety :** [PostgreSQL](https://www.postgresql.org/) avec [Drizzle ORM](https://orm.drizzle.team/) pour un typage strict de bout en bout, de la base de données jusqu'au client.
- **Résilience & Error Handling :** Implémentation de **Segment Error Boundaries** (`error.tsx`) sur chaque route majeure pour garantir que l'application reste utilisable même en cas d'échec d'un segment spécifique.
- **Validation & Tests :** 
  - **E2E (Playwright) :** Validation des flux critiques (Happy Path) via des tests end-to-end automatisés.
  - **Unitaires (Vitest) :** Tests rigoureux de la logique métier et des utilitaires complexes.
- **UX Polished :** Intégration de [Sonner](https://sonner.emilkowal.ski/) pour un système de toasts réactif et de [Tailwind CSS](https://tailwindcss.com/) pour une interface moderne, compacte et accessible.

---

## 🚀 Installation & Scripts

```bash
# Installation
npm install

# Configuration
cp env.example .env.local

# Lancement (dev)
npm run dev

# Tests Unitaires
npm test

# Tests E2E (Playwright)
npm run test:e2e
```

> Note Playwright : selon l'environnement Linux, Chromium peut nécessiter des bibliothèques système supplémentaires avant exécution des tests E2E.

<details>
<summary>⚙️ <b>Variables d'environnement (Détails)</b></summary>

### Services Tiers
- `ADZUNA_ENABLED` : Activer le provider secondaire Adzuna.
- `UMAMI_ENABLED` : Monitoring analytique respectueux de la vie privée (RGPD).
- `RESEND_API_KEY` : Gestion des emails pour la réinitialisation de mot de passe.

### Optimisation & Debug
- `SERVER_TIMING_LOGS` : Performance profiling côté serveur.
- `SERVER_AUDIT_LOGS` : Sécurité et traçabilité des actions critiques.
- `DB_SLOW_QUERY_MS` : Seuil de détection des requêtes lentes (défaut: 200ms).

### Personnalisation RGPD
- `PRIVACY_CONTROLLER_NAME`, `PRIVACY_CONTACT_EMAIL`, `PRIVACY_PROJECT_LABEL`, etc.
</details>

---

## 📖 API & Documentation

FOREM-idable expose une API REST robuste (lecture seule) pour les besoins d'intégration des comptes `coach` et `admin`.

- **Scopes :** Permissions granulaires selon le groupe de bénéficiaires.
- **Cas d'usage :** Power Query, Excel, reporting JSON/CSV.
- **Auth :** Clés API via header `Authorization: Bearer ...`.

👉 [Consulter la documentation API complète](./DOCAPI.md)

---

## 🌐 Sources API

- **Forem Open Data (ODWB) :** Données brutes des offres.
- **Nomenclature Localisations :** API officielle Le Forem.
- **Adzuna (Optionnel) :** Provider secondaire international.

---

## 📄 Licence

Distribué sous licence **MIT**.  
Copyright (c) 2026 **Jordi Brisbois**

---
*Fait avec ❤️ pour simplifier la recherche d'emploi en Belgique.*
