const RECENT_UPDATES = [
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
          comme les favoris et l&apos;ouverture du PDF quand il est disponible.
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
        <div className="space-y-2 text-sm text-muted-foreground">
          {RECENT_UPDATES.map((update) => (
            <p key={`${update.month}-${update.text}`}>
              <span className="font-semibold text-foreground">{update.month}</span> - {update.text}
            </p>
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
      </section>
    </div>
  );
}
