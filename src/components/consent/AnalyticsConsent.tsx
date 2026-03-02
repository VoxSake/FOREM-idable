"use client";

import Script from "next/script";
import { Button } from "@/components/ui/button";
import {
  setAnalyticsConsentChoice,
  useAnalyticsConsentChoice,
} from "@/features/consent/analyticsConsent";

interface AnalyticsConsentProps {
  umamiEnabled: boolean;
  umamiWebsiteId: string;
  umamiScriptUrl: string;
}

export function AnalyticsConsent({
  umamiEnabled,
  umamiWebsiteId,
  umamiScriptUrl,
}: AnalyticsConsentProps) {
  const effectiveChoice = useAnalyticsConsentChoice();

  const shouldShowBanner = umamiEnabled && effectiveChoice === null;
  const shouldLoadUmami =
    umamiEnabled && effectiveChoice === "accepted" && umamiWebsiteId.length > 0;

  const handleAccept = () => {
    setAnalyticsConsentChoice("accepted");
  };

  const handleReject = () => {
    setAnalyticsConsentChoice("rejected");
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
            Ce site enregistre vos r&eacute;glages sur votre appareil. Voulez-vous autoriser
            les statistiques anonymes pour am&eacute;liorer l&apos;exp&eacute;rience ?
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" variant="default" onClick={handleAccept}>
              Accepter
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
