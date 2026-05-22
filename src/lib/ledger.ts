export function getActiveLedgerId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("activeLedgerId");
}

export function ledgerFetchUrl(baseUrl: string): string {
  const ledgerId = getActiveLedgerId();
  if (!ledgerId) return baseUrl;
  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${separator}ledgerId=${encodeURIComponent(ledgerId)}`;
}
