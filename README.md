# 🚀 FOREM-idable

**FOREM-idable** est une plateforme moderne développée avec Next.js, dédiée à la recherche d'emploi, au suivi de candidatures et à l'accompagnement par coachs.

Ce projet a été conçu avec une double exigence : répondre à un **usage réel** tout en maintenant un niveau de **clean code** exemplaire, idéal pour une revue technique ou une démonstration en entretien. L'accent est mis sur la cohérence du front-end, la validation stricte des contrats d'entrée, une persistance type-safe et une gestion explicite des erreurs.

---

### 🌐 Version Live
🔗 [forem.brisbois.dev](https://forem.brisbois.dev)

---

## 🎯 Fonctionnalités Clés

Le produit couvre désormais sept domaines stratégiques :
*   🔍 **Recherche d'offres** : Moteur multi-source performant avec historique de recherche.
*   📋 **Suivi de candidatures** : Gestion complète du tunnel de recrutement pour les bénéficiaires.
*   👨‍🏫 **Dashboard Coach** : Pilotage et suivi par groupes pour un accompagnement personnalisé.
*   ⚙️ **Administration** : Gestion des coachs, mises en avant (featured searches), clés API et traitement des demandes de suppression.
*   💬 **Messagerie temps réel** : Canaux de groupe et messages privés.
*   📊 **API Externe** : Endpoints JSON/CSV pour le reporting et l'automatisation.
*   🛡️ **Conformité & RGPD** : Export de données, demandes de suppression, legal holds, disclosure logs et purge de rétention.

---

## 💻 Stack Technique

Le projet s'appuie sur les dernières versions stables de l'écosystème React/Next.js :

*   **Framework** : [Next.js 16](https://nextjs.org/) (App Router)
*   **Langage** : [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
*   **Runtime** : Node.js 24
*   **Base de données** : PostgreSQL avec [Drizzle ORM](https://orm.drizzle.team/)
*   **Validation** : [Zod](https://zod.dev/) pour le typage des contrats et la validation runtime
*   **UI/UX** : Tailwind CSS + [shadcn/ui](https://ui.shadcn.com/)
*   **Tests** : [Vitest](https://vitest.dev/) (Unit/Integration) & [Playwright](https://playwright.dev/) (E2E)
*   **Infrastructure** : Redis (optionnel) pour le rate limiting et le pub/sub de la messagerie.

---

## 🏗️ Architecture

L'organisation du code suit une approche **feature-first** pour garantir la scalabilité :

```txt
src/
  ├── app/             # Routes Next.js (Pages, Layouts) et Handlers API
  ├── features/        # Composants UI, hooks et logique métier par domaine
  ├── lib/server/      # Logique serveur pure : Services, Accès DB, Sécurité
  ├── components/ui/   # Primitives UI (Design System atomique)
  └── types/           # Contrats applicatifs et interfaces partagées
```

### Principes Fondamentaux :
*   **API Routes "Thin"** : Responsables uniquement de l'auth, de la validation et de l'orchestration.
*   **Business Logic isolée** : Toute la logique métier réside dans `src/lib/server`.
*   **State Management localisé** : Utilisation de hooks `use*PageState` pour concentrer l'état de page.
*   **Type Safety de bout en bout** : Contrats Front/Back explicites via Zod et TypeScript.

---

## 🛠️ Choix Techniques & Qualité logicielle

### ✅ Validation & Sécurité
Toutes les mutations critiques sont verrouillées par des schémas Zod. L'objectif est double : prévenir les erreurs 500 et garantir des contrats d'interface homogènes et robustes.

### 🗄️ Persistance Type-Safe
L'utilisation de **Drizzle ORM** permet de manipuler une base de données typée. Le domaine "Candidature" repose sur une couche relationnelle explicite, optimisée pour les exports et les besoins analytiques des coachs.

### 📨 Messagerie Hybride
La messagerie utilise HTTP pour l'écriture et **Server-Sent Events (SSE)** pour le live-stream. Le bus d'événements est conçu pour être résilient :
*   **Mode Standard** : Fallback en mémoire pour un déploiement simplifié.
*   **Mode Distribué** : Redis Pub/Sub activable via `REDIS_URL` pour la scalabilité.

### 🛡️ Gestion d'Erreurs
Utilisation systématique des `error.tsx` de Next.js pour des Error Boundaries segmentaires, offrant une expérience utilisateur fluide même en cas d'imprévu.

### 🧪 Stratégie de Tests
Le projet ne vise pas le 100% théorique, mais une **couverture pragmatique des flux critiques** :
*   **Vitest** : Logique métier pure et helpers.
*   **Playwright** : Parcours utilisateurs (Auth, Suivi, Messagerie, Admin, Compliance).

### 🔐 Conformité pragmatique
Le projet inclut un premier pack conformité orienté usage réel :
*   **Espace compte** : Export JSON des données personnelles et demande de suppression avec revue manuelle.
*   **Administration** : Validation, rejet ou finalisation des demandes de suppression.
*   **Garde-fous** : `legal holds` pour suspendre une suppression ou une purge si nécessaire.
*   **Traçabilité** : `disclosure logs` pour journaliser une divulgation ciblée à une autorité.
*   **Rétention** : purge scriptable des données temporaires et expirées.

---

## 🔌 API Externe & Intégrations

Réservée aux comptes `coach` et `admin` via clés API.
*   **Endpoints** : Gestion utilisateurs, groupes et mutations de candidatures.
*   **Reporting** : Exports CSV avec indicateurs calculés (`isFollowUpDue`, `isInterviewScheduled`).

📖 [Consulter la documentation API détaillée](DOCAPI.md)
📖 [Consulter la note conformité](COMPLIANCE.md)

---

## 🚀 Installation & Développement

### Pré-requis
```bash
cp env.example .env.local
npm install
```

### Commandes utiles
```bash
# Développement
npm run dev

# Qualité & Tests
npm run lint
npm test            # Unitaires
npm run test:e2e    # End-to-end

# Base de données
npm run db:generate
npm run db:migrate

# Maintenance
npm run maintenance:purge

# Production
npm run build
npm start
```

---

## 📋 Conventions de Code

*   **Validation systématique** : Pas d'entrée de données sans schéma Zod.
*   **Composition de composants** : Logique métier extraite des composants de rendu.
*   **Observabilité** : Logs de timing serveur et audit activables en environnement critique.
*   **Refactoring continu** : Isolation progressive des services historiques vers des modules serveurs propres.
*   **Conformité outillée** : Les droits utilisateurs et les revues admin passent par des workflows applicatifs plutôt que par des manipulations directes en base.

---

## 📄 Licence
Ce projet est sous licence [GNU AGPL v3.0](LICENSE) (`AGPL-3.0-only`).

Le code source public du service est disponible sur GitHub :
https://github.com/VoxSake/FOREM-idable
