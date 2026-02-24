import { OfferDetails } from "@/features/jobs/types/offerDetails";

export const offerDetailsService = {
  async getByOfferId(
    offerId: string,
    options?: { signal?: AbortSignal }
  ): Promise<OfferDetails | null> {
    const response = await fetch(`/api/offers/${offerId}`, {
      signal: options?.signal,
    });
    if (!response.ok) return null;

    const payload = (await response.json()) as Partial<OfferDetails>;
    return {
      offerId,
      description: payload.description,
      highlights: payload.highlights || [],
      sections: payload.sections || [],
    };
  },
};
