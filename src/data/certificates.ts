export type CertificateProvider = 'credly' | 'platzi' | string;

export interface Certificate {
  id: string;
  title: string;
  issuer: string;
  provider: CertificateProvider;
  /** ISO 8601 date string */
  date: string;
  /** Verification / diploma URL */
  url: string;
  /** Badge or diploma image URL */
  image?: string;
}

const PROVIDER_LABELS: Record<string, string> = {
  credly: 'Credly',
  platzi: 'Platzi',
};

export function providerLabel(provider: string): string {
  return PROVIDER_LABELS[provider] ?? provider.charAt(0).toUpperCase() + provider.slice(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Certificates from providers with no public API go here by hand.
// Same shape as the auto-fetched ones (see src/lib/credly.ts, src/lib/platzi.ts).
// ─────────────────────────────────────────────────────────────────────────────
export const manualCertificates: Certificate[] = [];
