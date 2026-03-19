import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
const FEATURED_UPDATES = RECENT_UPDATES.slice(0, 5);

export default function AboutPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 animate-in fade-in duration-500">
      <Card className="overflow-hidden shadow-sm">
        <CardHeader className="gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">Produit</Badge>
            <Badge variant="secondary">Emploi & open data</Badge>
          </div>
          <CardTitle className="text-3xl font-black tracking-tight">À propos</CardTitle>
          <CardDescription className="max-w-3xl text-base">
            FOREM-idable est un agrégateur orienté recherche d&apos;emploi, pensé pour rendre la
            recherche plus lisible, le filtrage plus utile et le suivi des candidatures plus
            concret.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Objectif du site</CardTitle>
          <CardDescription>Ce que le produit essaie réellement d&apos;améliorer.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm leading-6 text-muted-foreground">
            Le site simplifie la recherche d&apos;offres en regroupant les résultats, en améliorant
            le filtrage par localités et en proposant des actions pratiques comme le suivi des
            candidatures, l&apos;ouverture du PDF lorsqu&apos;il est disponible et une vue plus claire
            des prochaines relances.
          </p>
          <Alert>
            <AlertTitle>Limites connues</AlertTitle>
            <AlertDescription className="text-sm leading-6">
              Les données d&apos;offres et de localisation dépendent de fournisseurs externes.
              Certaines offres peuvent être dupliquées, évoluer rapidement, ou ne pas proposer de
              PDF.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>APIs utilisées</CardTitle>
          <CardDescription>
            Les sources externes qui alimentent la recherche et l&apos;enrichissement des données.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {APIS.map((api) => (
            <Card key={api.title} className="shadow-none">
              <CardHeader className="gap-2">
                <CardTitle className="text-base">{api.title}</CardTitle>
                <CardDescription>{api.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 text-xs">
                <a
                  href={api.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all text-primary hover:underline"
                >
                  {api.hrefLabel}
                </a>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Nouveautés récentes</CardTitle>
          <CardDescription>
            Les dernières évolutions majeures du projet, avec un lien vers l&apos;historique complet.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            {FEATURED_UPDATES.map((update) => (
              <div key={`${update.month}-${update.text}`} className="flex gap-3 text-sm text-muted-foreground">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/70" />
                <div className="flex flex-col gap-1">
                  <p className="font-medium text-foreground">{update.month}</p>
                  <p>{update.text}</p>
                </div>
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
                      <div
                        key={`${month}-${update}`}
                        className="flex gap-3 text-sm text-muted-foreground"
                      >
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/70" />
                        <p>{update}</p>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <div className="text-sm text-muted-foreground">
            Historique complet:{" "}
            <a
              href="https://github.com/VoxSake/FOREM-idable/blob/main/CHANGELOG.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              CHANGELOG.md
            </a>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Licence et confidentialité</CardTitle>
          <CardDescription>Cadre légal du projet et informations de confidentialité.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
          <p>Copyright (c) 2026 Jordi Brisbois</p>
          <p>Ce projet est distribué sous licence MIT.</p>
          <p>
            La politique de confidentialité est disponible sur{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              la page Confidentialité
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
