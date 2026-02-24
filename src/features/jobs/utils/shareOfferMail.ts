import { Job } from "@/types/job";

export function buildOfferMailtoLink(job: Job, publicationLabel: string): string {
  const emailSubject = `Offre à découvrir: ${job.title}`;
  const emailBody = [
    "Bonjour,",
    "",
    "Je te partage cette offre d'emploi:",
    "",
    `Intitulé: ${job.title}`,
    `Entreprise: ${job.company || "Non précisée"}`,
    `Localité: ${job.location}`,
    `Contrat: ${job.contractType}`,
    `Publication: ${publicationLabel}`,
    "",
    `Lien de l'offre: ${job.url}`,
    "",
    "Envoyé depuis FOREM-idable",
  ].join("\n");

  return `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
}
