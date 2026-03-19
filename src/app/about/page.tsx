import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

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

const APIS = [
  {
    title: "Forem Open Data",
    description:
      "Source principale des offres via Opendatasoft (ODWB), utilisée pour la recherche centrale.",
    href: "https://www.odwb.be/api/explore/v2.1/catalog/datasets/offres-d-emploi-forem",
    hrefLabel:
      "https://www.odwb.be/api/explore/v2.1/catalog/datasets/offres-d-emploi-forem",
  },
  {
    title: "Nomenclature Forem des localisations",
    description:
      "Utilisée pour enrichir le sélecteur de lieux avec régions, provinces, arrondissements, communes et localités.",
    href: "https://www.leforem.be/recherche-offres/api/Nomenclature/Localisations",
    hrefLabel: "https://www.leforem.be/recherche-offres/api/Nomenclature/Localisations",
  },
  {
    title: "PDF d'offres Forem",
    description:
      "Le site passe par un proxy serveur pour récupérer les documents PDF lorsqu'ils sont disponibles.",
    href: "https://www.leforem.be/recherche-offres/api/Document/PDF/{offreId}",
    hrefLabel: "https://www.leforem.be/recherche-offres/api/Document/PDF/{offreId}",
  },
  {
    title: "Adzuna",
    description:
      "Source complémentaire multi-offres activable par variables d'environnement et désactivée par défaut.",
    href: "https://developer.adzuna.com/docs/search",
    hrefLabel: "https://developer.adzuna.com/docs/search",
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
    <div className="mx-auto flex max-w-5xl flex-col gap-6 animate-in fade-in duration-500">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Produit</Badge>
          <Badge variant="secondary">Emploi & open data</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black tracking-tight">À propos</h1>
          <p className="max-w-3xl text-base text-muted-foreground">
            FOREM-idable est un agrégateur orienté recherche d&apos;emploi, pensé pour rendre la
            recherche plus lisible, le filtrage plus utile et le suivi des candidatures plus concret.
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <section className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold">Objectif du site</h2>
            <p className="text-sm text-muted-foreground">
              Ce que le produit essaie réellement d&apos;améliorer.
            </p>
          </div>
          <div className="text-sm leading-6 text-muted-foreground">
            Le site simplifie la recherche d&apos;offres en regroupant les résultats, en améliorant
            le filtrage par localités et en proposant des actions pratiques comme le suivi des
            candidatures, l&apos;ouverture du PDF lorsqu&apos;il est disponible et une vue plus claire
            des prochaines relances.
          </div>
        </section>

        <Alert>
          <AlertTitle>Limites connues</AlertTitle>
          <AlertDescription className="text-sm leading-6">
            Les données d&apos;offres et de localisation dépendent de fournisseurs externes. Certaines
            offres peuvent être dupliquées, évoluer rapidement, ou ne pas proposer de PDF.
          </AlertDescription>
        </Alert>
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold">APIs utilisées</h2>
          <p className="text-sm text-muted-foreground">
            Les sources externes qui alimentent la recherche et l&apos;enrichissement des données.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {APIS.map((api) => (
            <div key={api.title} className="flex flex-col gap-2 rounded-xl border bg-card p-4 shadow-sm">
              <h3 className="text-base font-semibold">{api.title}</h3>
              <p className="text-sm text-muted-foreground">{api.description}</p>
              <div className="text-sm">
                <a
                  href={api.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all text-primary hover:underline"
                >
                  {api.hrefLabel}
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold">Nouveautés récentes</h2>
          <p className="text-sm text-muted-foreground">
            Les évolutions sont regroupées par mois pour éviter une longue page compacte et peu lisible.
          </p>
        </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {UPDATES_BY_MONTH.map(([month, updates]) => (
              <div key={month} className="rounded-xl border bg-muted/20 p-4">
                <p className="text-sm font-semibold">{month}</p>
                <p className="text-xs text-muted-foreground">
                  {updates.length} mise{updates.length > 1 ? "s" : ""} à jour
                </p>
              </div>
            ))}
          </div>

          <Accordion type="multiple" className="rounded-xl border px-4">
            {UPDATES_BY_MONTH.map(([month, updates]) => (
              <AccordionItem key={month} value={month}>
                <AccordionTrigger>{month}</AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-col gap-3">
                    {updates.map((update) => (
                      <div key={`${month}-${update}`} className="flex gap-3 text-sm text-muted-foreground">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/70" />
                        <p>{update}</p>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
      </section>

      <section className="flex flex-col gap-2 border-t pt-6 text-sm text-muted-foreground">
        <h2 className="text-xl font-bold text-foreground">Licence</h2>
          <p>Copyright (c) 2026 Jordi Brisbois</p>
          <p>Ce projet est distribué sous licence MIT.</p>
          <p>
            La politique de confidentialité est disponible sur{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              la page Confidentialité
            </Link>
            .
          </p>
      </section>
    </div>
  );
}
