import Link from "next/link";

const RECENT_UPDATES = [
  {
    month: "Mars 2026",
    text: "Passage du rate limiting sur un backend Redis optionnel avec fallback mémoire, et durcissement des seuils sur login, inscription, réinitialisation de mot de passe et API externe.",
  },
  {
    month: "Mars 2026",
    text: "Renforcement de la couche data avec Drizzle côté services auth/API keys, migrations versionnées et validation runtime Zod des payloads JSONB sensibles.",
  },
  {
    month: "Mars 2026",
    text: "Alignement de l'API externe et de sa documentation avec les nouveaux scopes coach/admin, les groupes attribués, les coachs de groupe et la notion de manager.",
  },
  {
    month: "Mars 2026",
    text: "Évolution du module coach: attribution multi-coachs par groupe, manager de groupe, visibilité limitée aux groupes attribués et gestion admin dédiée des coachs.",
  },
  {
    month: "Mars 2026",
    text: "Ajout de l'import CSV côté coach avec modèle téléchargeable, auto-détection des colonnes, mapping manuel, correction des statuts non reconnus, gestion des doublons et choix explicite du format de date.",
  },
  {
    month: "Mars 2026",
    text: "Dashboard coach enrichi avec sections À traiter et Activité récente, plus édition et suppression de candidatures directement depuis chaque bloc candidature dans le sidepanel bénéficiaire.",
  },
  {
    month: "Mars 2026",
    text: "Ajout d'une synchronisation calendrier coach via lien d'abonnement ICS par groupe standard ou au global, avec aide intégrée, respect du périmètre visible par le compte courant et régénération réservée aux admins.",
  },
  {
    month: "Mars 2026",
    text: "UX affinée sur les actions coach et candidatures: boutons regroupés dans des menus Actions, side panels homogénéisés et toolbar mobile plus compacte.",
  },
  {
    month: "Mars 2026",
    text: "Ajout d'un flux mot de passe oublié via email avec Resend, feature flag dédié et page de réinitialisation.",
  },
  {
    month: "Mars 2026",
    text: "Vue coach affinée: side panel plus large, candidatures repliables, note privée coach commune, notes partagées multiples avec auteurs/contributeurs, badges Manuelle/Importée et exports enrichis.",
  },
  {
    month: "Mars 2026",
    text: "Ajout d'une page Confidentialité, d'un consentement statistiques clarifié et de variables d'environnement dédiées pour personnaliser les informations RGPD.",
  },
  {
    month: "Mars 2026",
    text: "Mise en place d'une API externe sécurisée pour les comptes coach et admin, avec clés API Bearer et exports JSON / CSV compatibles Excel et Power Query.",
  },
  {
    month: "Mars 2026",
    text: "Arrivée des rôles user, coach et admin, avec gestion de groupes, suivi des candidatures et exports coach par utilisateur ou par groupe.",
  },
  {
    month: "Mars 2026",
    text: "Ajout du suivi complet des candidatures: relances, entretiens, export CSV, compte obligatoire pour le suivi et interface dédiée.",
  },
  {
    month: "Mars 2026",
    text: "Tracking optionnel via Umami, activable par variables d'environnement.",
  },
  {
    month: "Mars 2026",
    text: "Documentation de configuration enrichie (`README` + `env.example`) pour les variables Umami.",
  },
  {
    month: "Mars 2026",
    text: "Nettoyage du lint sur la table des offres avec une règle ciblée de compatibilité React Compiler/TanStack.",
  },
  {
    month: "Février 2026",
    text: "Recherche élargie avec plus de résultats chargés par défaut.",
  },
  {
    month: "Février 2026",
    text: "Pagination enrichie avec navigation rapide (première, dernière et plage dynamique de pages).",
  },
  {
    month: "Février 2026",
    text: "Chargement progressif des résultats supplémentaires via le bouton \"Charger plus\".",
  },
];

const UPDATES_BY_MONTH = Object.entries(
  RECENT_UPDATES.reduce<Record<string, string[]>>((accumulator, update) => {
    accumulator[update.month] = [...(accumulator[update.month] ?? []), update.text];
    return accumulator;
  }, {})
);

export default function AboutPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight text-foreground">À propos</h1>
        <p className="text-muted-foreground text-lg">
          FOREM-idable est un agrégateur orienté recherche d&apos;emploi, avec priorité au Forem.
        </p>
      </div>

      <section className="bg-card rounded-xl border shadow-sm p-6 space-y-4">
        <h2 className="text-xl font-bold">Objectif du site</h2>
        <p className="text-sm text-muted-foreground leading-6">
          Le site simplifie la recherche d&apos;offres en regroupant les résultats, en améliorant le filtrage par
          localités (provinces, arrondissements, communes, localités) et en proposant des actions pratiques
          comme le suivi des candidatures et l&apos;ouverture du PDF quand il est disponible.
        </p>
      </section>

      <section className="bg-card rounded-xl border shadow-sm p-6 space-y-4">
        <h2 className="text-xl font-bold">APIs utilisées</h2>
        <div className="space-y-4 text-sm text-muted-foreground">
          <div className="space-y-1">
            <p className="font-semibold text-foreground">1. Forem Open Data (source principale)</p>
            <p>
              Jeu de données des offres Forem via Opendatasoft (ODWB), utilisé pour la recherche principale.
            </p>
            <a
              href="https://www.odwb.be/api/explore/v2.1/catalog/datasets/offres-d-emploi-forem"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline break-all"
            >
              https://www.odwb.be/api/explore/v2.1/catalog/datasets/offres-d-emploi-forem
            </a>
          </div>

          <div className="space-y-1">
            <p className="font-semibold text-foreground">2. Nomenclature Forem des localisations</p>
            <p>
              Utilisée pour enrichir le sélecteur de lieux avec une hiérarchie fine (régions, provinces,
              arrondissements, communes, localités).
            </p>
            <a
              href="https://www.leforem.be/recherche-offres/api/Nomenclature/Localisations"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline break-all"
            >
              https://www.leforem.be/recherche-offres/api/Nomenclature/Localisations
            </a>
          </div>

          <div className="space-y-1">
            <p className="font-semibold text-foreground">3. PDF d&apos;offres Forem (proxy interne)</p>
            <p>
              Le site utilise un proxy serveur pour récupérer les documents PDF lorsque disponibles.
            </p>
            <a
              href="https://www.leforem.be/recherche-offres/api/Document/PDF/{offreId}"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline break-all"
            >
              https://www.leforem.be/recherche-offres/api/Document/PDF/{"{offreId}"}
            </a>
          </div>

          <div className="space-y-1">
            <p className="font-semibold text-foreground">4. Adzuna (optionnel, désactivé par défaut)</p>
            <p>
              Source complémentaire multi-offres activable via variables d&apos;environnement.
            </p>
            <a
              href="https://developer.adzuna.com/docs/search"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline break-all"
            >
              https://developer.adzuna.com/docs/search
            </a>
          </div>
        </div>
      </section>

      <section className="bg-card rounded-xl border shadow-sm p-6 space-y-4">
        <h2 className="text-xl font-bold">Limites connues</h2>
        <p className="text-sm text-muted-foreground leading-6">
          Les données d&apos;offres et de localisation dépendent des fournisseurs externes. Certaines offres peuvent
          être dupliquées ou évoluer rapidement. Les PDF ne sont pas garantis pour chaque annonce.
        </p>
      </section>

      <section className="bg-card rounded-xl border shadow-sm p-6 space-y-4">
        <h2 className="text-xl font-bold">Nouveautés récentes</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {UPDATES_BY_MONTH.map(([month, updates]) => (
            <div key={month} className="rounded-xl border bg-muted/20 p-4">
              <p className="text-sm font-semibold text-foreground">{month}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {updates.length} mise{updates.length > 1 ? "s" : ""} à jour
              </p>
            </div>
          ))}
        </div>
        <div className="space-y-3">
          {UPDATES_BY_MONTH.map(([month, updates]) => (
            <div key={month} className="rounded-xl border bg-muted/10 p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-foreground">{month}</h3>
                <span className="rounded-full border border-border/70 bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  {updates.length} élément{updates.length > 1 ? "s" : ""}
                </span>
              </div>
              <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                {updates.map((update) => (
                  <div key={`${month}-${update}`} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
                    <p>{update}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-card rounded-xl border shadow-sm p-6 space-y-2">
        <h2 className="text-xl font-bold">Licence</h2>
        <p className="text-sm text-muted-foreground">
          Copyright (c) 2026 Jordi Brisbois
        </p>
        <p className="text-sm text-muted-foreground">
          Ce projet est distribué sous licence MIT.
        </p>
        <p className="text-sm text-muted-foreground">
          La politique de confidentialité est disponible sur{" "}
          <Link href="/privacy" className="text-primary hover:underline">
            la page Confidentialité
          </Link>.
        </p>
      </section>
    </div>
  );
}
