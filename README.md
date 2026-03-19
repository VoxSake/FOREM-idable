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

Le projet a été conçu avec une attention particulière à la **scalabilité** et à la **sécurité** :

- **Framework :** [Next.js 15](https://nextjs.org/) (App Router) pour le rendu hybride et les performances UX.
- **Base de données :** [PostgreSQL](https://www.postgresql.org/) avec [Drizzle ORM](https://orm.drizzle.team/) pour un typage strict de bout en bout.
- **Cache & Rate Limit :** Support de [Redis](https://redis.io/) pour le rate limiting distribué.
- **Observabilité :** Logs d'audit structurés, tracking des requêtes SQL lentes et intégration Umami (optionnelle).
- **Qualité :** Suite de tests avec [Vitest](https://vitest.dev/) et [Testing Library](https://testing-library.com/).

---

## 🚀 Installation & Scripts

```bash
# Installation
npm install

# Configuration
cp env.example .env.local

# Lancement (dev)
npm run dev

# Tests
npm test
```

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

## 🗺️ Roadmap & Évolutions

- [ ] Support de providers additionnels (LinkedIn, Indeed).
- [ ] IA : Résumé automatique des offres et extraction de compétences clés.
- [ ] Application mobile (PWA) pour les notifications push de relances.
- [ ] Export PDF personnalisé des bilans de recherche pour les institutions.

---

## 📄 Licence

Distribué sous licence **MIT**.  
Copyright (c) 2026 **Jordi Brisbois**

---
*Fait avec ❤️ pour simplifier la recherche d'emploi en Belgique.*
