const FOREM_OFFER_ID_PATTERN = /^\d{1,20}$/;

export function isValidForemOfferId(value: string): boolean {
  return FOREM_OFFER_ID_PATTERN.test(value);
}
