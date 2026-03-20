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

const PRODUCT_UPDATES = [
  {
    month: "Mars 2026",
    items: [
      "Refactor complet de la page Candidatures: orchestration simplifiée, logique dérivée extraite dans des utilitaires et un hook dédié, composants découpés par responsabilité, duplication réduite et couverture de tests renforcée.",
      "Homogénéisation de l'UI Candidatures avec des formulaires et confirmations alignés sur les primitives shadcn (Field, AlertDialog), badges unifiés et cartes mieux alignées visuellement.",
      "Nettoyage du shell global de l'application: header mobile et footer dédiés, sidebar restructurée autour d'une configuration testable, navigation plus lisible et layout racine clarifié.",
      "Passage du rate limiting sur un backend Redis optionnel avec fallback mémoire, et durcissement des seuils sur login, inscription, réinitialisation de mot de passe et API externe.",
      "Renforcement de la couche data avec Drizzle côté services auth/API keys, migrations versionnées et validation runtime Zod des payloads JSONB sensibles.",
      "Alignement de l'API externe et de sa documentation avec les nouveaux scopes coach/admin, les groupes attribués, les coachs de groupe et la notion de manager.",
      "Évolution du module coach: attribution multi-coachs par groupe, manager de groupe, visibilité limitée aux groupes attribués et gestion admin dédiée des coachs.",
      "Ajout de l'import CSV côté coach avec modèle téléchargeable, auto-détection des colonnes, mapping manuel, correction des statuts non reconnus, gestion des doublons et choix explicite du format de date.",
      "Dashboard coach enrichi avec sections À traiter et Activité récente, plus édition et suppression de candidatures directement depuis chaque bloc candidature dans le sidepanel bénéficiaire.",
      "Ajout d'une synchronisation calendrier coach via lien d'abonnement ICS par groupe standard ou au global, avec aide intégrée, respect du périmètre visible par le compte courant et régénération réservée aux admins.",
      "UX affinée sur les actions coach et candidatures: boutons regroupés dans des menus Actions, side panels homogénéisés et toolbar mobile plus compacte.",
      "Ajout d'un flux mot de passe oublié via email avec Resend, feature flag dédié et page de réinitialisation.",
      "Vue coach affinée: side panel plus large, candidatures repliables, note privée coach commune, notes partagées multiples avec auteurs/contributeurs, badges Manuelle/Importée et exports enrichis.",
      "Ajout d'une page Confidentialité, d'un consentement statistiques clarifié et de variables d'environnement dédiées pour personnaliser les informations RGPD.",
      "Mise en place d'une API externe sécurisée pour les comptes coach et admin, avec clés API Bearer et exports JSON / CSV compatibles Excel et Power Query.",
      "Arrivée des rôles user, coach et admin, avec gestion de groupes, suivi des candidatures et exports coach par utilisateur ou par groupe.",
      "Ajout du suivi complet des candidatures: relances, entretiens, export CSV, compte obligatoire pour le suivi et interface dédiée.",
      "Tracking optionnel via Umami, activable par variables d'environnement.",
      "Documentation de configuration enrichie (`README` + `env.example`) pour les variables Umami.",
      "Nettoyage du lint sur la table des offres avec une règle ciblée de compatibilité React Compiler/TanStack.",
    ],
  },
  {
    month: "Février 2026",
    items: [
      "Recherche élargie avec plus de résultats chargés par défaut.",
      "Pagination enrichie avec navigation rapide (première, dernière et plage dynamique de pages).",
      "Chargement progressif des résultats supplémentaires via le bouton \"Charger plus\".",
    ],
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

export default function AboutPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 animate-in fade-in duration-500">
      <Card className="overflow-hidden shadow-sm">
        <CardHeader className="gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">Open Source</Badge>
            <Badge variant="secondary">Data-driven</Badge>
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
          <CardDescription>Le rôle du produit et la valeur qu&apos;il apporte.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm leading-6 text-muted-foreground">
            FOREM-idable centralise la recherche d&apos;offres, fiabilise le filtrage géographique
            et transforme une navigation brute en parcours de suivi plus exploitable. Le produit
            réunit dans un même espace la consultation des offres, l&apos;accès aux PDF disponibles,
            le suivi des candidatures et une lecture plus claire des prochaines relances.
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
            Les évolutions récentes du projet, regroupées par période.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Accordion type="multiple" className="rounded-xl border px-4">
            {PRODUCT_UPDATES.map((group) => (
              <AccordionItem key={group.month} value={group.month}>
                <AccordionTrigger>{group.month}</AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-col gap-3">
                    {group.items.map((item) => (
                      <div
                        key={`${group.month}-${item}`}
                        className="flex gap-3 text-sm text-muted-foreground"
                      >
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/70" />
                        <p>{item}</p>
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
              href="https://github.com/VoxSake/FOREM-idable/commits/main/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              commits sur GitHub
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
