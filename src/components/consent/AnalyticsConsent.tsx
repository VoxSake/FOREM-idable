"use client";

import { useState, useSyncExternalStore } from "react";
import Script from "next/script";
import { Button } from "@/components/ui/button";

type ConsentChoice = "accepted" | "rejected" | null;

const CONSENT_STORAGE_KEY = "forem_idable_analytics_consent_v1";

interface AnalyticsConsentProps {
  umamiEnabled: boolean;
  umamiWebsiteId: string;
  umamiScriptUrl: string;
}

function readConsentChoice(): ConsentChoice {
  try {
    const value = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (value === "accepted" || value === "rejected") return value;
  } catch {
    // Ignore storage read failures and keep no-consent default
  }
  return null;
}

function saveConsentChoice(choice: Exclude<ConsentChoice, null>) {
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, choice);
  } catch {
    // Ignore storage write failures
  }
}

export function AnalyticsConsent({
  umamiEnabled,
  umamiWebsiteId,
  umamiScriptUrl,
}: AnalyticsConsentProps) {
  const [choice, setChoice] = useState<ConsentChoice>(null);
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const persistedChoice = isClient ? readConsentChoice() : null;
  const effectiveChoice = choice ?? persistedChoice;

  const shouldShowBanner = umamiEnabled && isClient && effectiveChoice === null;
  const shouldLoadUmami =
    umamiEnabled &&
    isClient &&
    effectiveChoice === "accepted" &&
    umamiWebsiteId.length > 0;

  const handleAccept = () => {
    saveConsentChoice("accepted");
    setChoice("accepted");
  };

  const handleReject = () => {
    saveConsentChoice("rejected");
    setChoice("rejected");
  };

  return (
    <>
      {shouldLoadUmami ? (
        <Script
          src={umamiScriptUrl}
          data-website-id={umamiWebsiteId}
          strategy="afterInteractive"
        />
      ) : null}

      {shouldShowBanner ? (
        <section
          role="dialog"
          aria-live="polite"
          aria-label="Consentement des statistiques"
          className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-3xl rounded-xl border bg-card/95 p-4 shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-card/85"
        >
          <p className="text-sm leading-relaxed text-card-foreground">
            Nous utilisons des donn&eacute;es locales n&eacute;cessaires au fonctionnement de
            l&apos;application (favoris, pr&eacute;f&eacute;rences, historique). Souhaitez-vous
            aussi autoriser des statistiques anonymes de fr&eacute;quentation (Umami) pour
            am&eacute;liorer le service ?
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" variant="default" onClick={handleAccept}>
              Accepter les statistiques
            </Button>
            <Button type="button" variant="outline" onClick={handleReject}>
              Refuser
            </Button>
          </div>
        </section>
      ) : null}
    </>
  );
}
