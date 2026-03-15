import { runtimeConfig } from "@/config/runtime";
import { PrivacyConsentControls } from "@/components/consent/PrivacyConsentControls";

export default function PrivacyPage() {
  const privacyEmail = runtimeConfig.privacy.contactEmail;
  const projectLabel = runtimeConfig.privacy.projectLabel;
  const sourceUrl = runtimeConfig.privacy.sourceUrl;

  return (
    <div className="mx-auto max-w-4xl animate-in space-y-6 fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight text-foreground">Confidentialité</h1>
        <p className="text-lg text-muted-foreground">
          Cette page explique quelles données peuvent être traitées par FOREM-idable, pourquoi, sur
          quelle base et comment exercer vos droits.
        </p>
      </div>

      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="space-y-3 text-sm leading-6 text-muted-foreground">
          <p>
            FOREM-idable est un projet gratuit et open source, mis à disposition sous licence MIT.
            L&apos;application permet de rechercher des offres d&apos;emploi, de suivre des
            candidatures, et, si vous créez un compte, d&apos;enregistrer ces données dans votre espace personnel.
          </p>
          <p>
            La présente politique de confidentialité est rédigée en tenant compte du Règlement
            général sur la protection des données (RGPD) et des principes rappelés par
            l&apos;Autorité de protection des données belge.
          </p>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-bold">Responsable du traitement</h2>
        <div className="mt-4 space-y-2 text-sm leading-6 text-muted-foreground">
          <p>
            <span className="font-semibold text-foreground">{runtimeConfig.privacy.controllerName}</span>
          </p>
          <p>
            Projet: {projectLabel}
          </p>
          <p>
            Contact RGPD:{" "}
            <a className="text-primary hover:underline" href={`mailto:${privacyEmail}`}>
              {privacyEmail}
            </a>
          </p>
          <p>
            Code source:{" "}
            <a
              className="text-primary hover:underline"
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {sourceUrl}
            </a>
          </p>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-bold">Données traitées</h2>
        <div className="mt-4 space-y-4 text-sm leading-6 text-muted-foreground">
          <div>
            <p className="font-semibold text-foreground">1. Données de compte</p>
            <p>
              Si vous créez un compte, l&apos;application peut traiter votre adresse e-mail, votre
              nom, votre prénom, votre rôle, votre hash de mot de passe, ainsi que les informations
              de session nécessaires à l&apos;authentification.
            </p>
          </div>
          <div>
            <p className="font-semibold text-foreground">2. Données d&apos;usage métier</p>
            <p>
              L&apos;application peut stocker vos candidatures, notes, preuves, dates d&apos;entretien,
              relances, historique de recherche et, selon votre rôle, des annotations de suivi liées
              à l&apos;accompagnement coach.
            </p>
          </div>
          <div>
            <p className="font-semibold text-foreground">3. Données locales</p>
            <p>
              Certaines préférences techniques restent conservées localement dans votre navigateur,
              comme le thème, l&apos;opérateur booléen par défaut et votre choix de consentement analytics.
            </p>
          </div>
          <div>
            <p className="font-semibold text-foreground">4. Synchronisation</p>
            <p>
              Si vous vous connectez, vos candidatures et votre historique de recherche sont
              enregistrés dans la base de données associée à votre compte afin d&apos;être retrouvés
              sur vos appareils et, le cas échéant, visibles dans le suivi coach selon vos droits.
            </p>
          </div>
          <div>
            <p className="font-semibold text-foreground">5. Clés API</p>
            <p>
              Pour les comptes coach et admin, l&apos;application peut générer des clés API.
              Celles-ci sont stockées sous forme de hash, avec des métadonnées minimales comme le
              nom de la clé, sa date de création, sa dernière utilisation éventuelle, sa révocation
              et sa date d&apos;expiration si vous en définissez une.
            </p>
          </div>
          <div>
            <p className="font-semibold text-foreground">6. Statistiques optionnelles</p>
            <p>
              Des statistiques de fréquentation via Umami peuvent être activées uniquement si vous y
              consentez. Elles ne sont pas nécessaires à l&apos;utilisation du service.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-bold">Finalités et bases juridiques</h2>
        <div className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
          <p>
            <span className="font-semibold text-foreground">Fournir le service</span>: recherche
            d&apos;offres, suivi des candidatures, historique de recherche, accès au compte et accès aux
            fonctions du compte. Base juridique principale: exécution du service demandé et, selon
            les cas, mesures précontractuelles.
          </p>
          <p>
            <span className="font-semibold text-foreground">Sécurité et intégrité</span>: gestion
            des sessions, prévention des abus, journalisation technique minimale, protection des
            accès et des exportations API. Base juridique principale: intérêt légitime à sécuriser
            le service.
          </p>
          <p>
            <span className="font-semibold text-foreground">Statistiques facultatives</span>:
            mesure d&apos;usage via Umami. Base juridique: votre consentement, que vous pouvez
            retirer ou modifier à tout moment sur cette page.
          </p>
          <p>
            <span className="font-semibold text-foreground">Respect des obligations légales</span>:
            certaines données peuvent être conservées si une obligation légale l&apos;impose ou si
            cela est strictement nécessaire pour gérer un litige ou défendre des droits.
          </p>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-bold">Destinataires et accès aux données</h2>
        <div className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
          <p>
            Les données ne sont pas vendues. Elles peuvent être accessibles, dans la limite du
            nécessaire, au responsable du traitement et aux prestataires techniques indispensables au
            fonctionnement de l&apos;application, comme l&apos;hébergement, la base de données et
            les composants d&apos;analyse activés avec consentement.
          </p>
          <p>
            Certaines fonctionnalités donnent aussi accès aux données à d&apos;autres utilisateurs
            autorisés par rôle dans l&apos;application, par exemple les comptes coach ou admin dans
            le cadre du suivi de groupes et de candidatures.
          </p>
          <p>
            Si un transfert hors de l&apos;Espace économique européen devait intervenir via un
            prestataire technique, il devrait être encadré par les garanties appropriées prévues par
            le RGPD.
          </p>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-bold">Choix des statistiques</h2>
        <div className="mt-4">
          <PrivacyConsentControls />
        </div>
      </section>

      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-bold">Durées de conservation</h2>
        <div className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
          <p>
            Les données locales restent dans votre navigateur jusqu&apos;à leur suppression par vos
            soins, par effacement manuel du navigateur ou via les fonctions prévues dans
            l&apos;application.
          </p>
          <p>
            Les données associées à un compte connecté sont conservées tant que le compte reste actif
            ou jusqu&apos;à demande de suppression, sous réserve des éléments strictement nécessaires
            à la sécurité, à la gestion d&apos;un litige ou au respect d&apos;une obligation légale.
          </p>
          <p>
            Les sessions expirent automatiquement. Les clés API peuvent être révoquées à tout moment
            et peuvent aussi expirer automatiquement si une date d&apos;expiration a été définie.
          </p>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-bold">Vos droits</h2>
        <div className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
          <p>
            Vous pouvez demander l&apos;accès à vos données, leur rectification, leur effacement, la
            limitation de certains traitements, leur portabilité lorsque c&apos;est applicable, ou
            vous opposer à un traitement fondé sur l&apos;intérêt légitime.
          </p>
          <p>
            Lorsque le traitement repose sur votre consentement, vous pouvez le retirer à tout moment
            pour l&apos;avenir, sans remettre en cause la licéité du traitement réalisé avant ce
            retrait.
          </p>
          <p>
            Pour exercer vos droits, vous pouvez écrire à{" "}
            <a className="text-primary hover:underline" href={`mailto:${privacyEmail}`}>
              {privacyEmail}
            </a>.
          </p>
          <p>
            Vous avez également le droit d&apos;introduire une plainte auprès de l&apos;Autorité de
            protection des données belge:{" "}
            <a
              className="text-primary hover:underline"
              href="https://www.autoriteprotectiondonnees.be"
              target="_blank"
              rel="noopener noreferrer"
            >
              www.autoriteprotectiondonnees.be
            </a>
          </p>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-bold">Transparence technique</h2>
        <div className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
          <p>
            FOREM-idable est open source. Si vous préférez garder un contrôle complet sur
            l&apos;hébergement, le code peut être audité, adapté ou auto-hébergé.
          </p>
          <p>
            Une documentation dédiée à l&apos;API externe est disponible dans{" "}
            <a
              className="text-primary hover:underline"
              href="https://github.com/VoxSake/FOREM-idable/blob/main/DOCAPI.md"
              target="_blank"
              rel="noopener noreferrer"
            >
              DOCAPI.md
            </a>.
          </p>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-bold">Mise à jour</h2>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          Dernière mise à jour: 12 mars 2026. Cette page peut être adaptée si les fonctionnalités,
          les traitements ou les obligations légales applicables évoluent.
        </p>
      </section>
    </div>
  );
}
