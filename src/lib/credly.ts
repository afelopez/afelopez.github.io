import { Certificate } from '../data/certificates';

interface CredlyBadge {
  id: string;
  issued_at_date: string;
  issuer?: {
    summary?: string;
  };
  badge_template: {
    name: string;
    image?: { url?: string };
  };
}

interface CredlyResponse {
  data: CredlyBadge[];
}

export async function getCredlyBadges(username: string): Promise<Certificate[]> {
  try {
    const res = await fetch(`https://www.credly.com/users/${username}/badges.json`);
    if (!res.ok) {
      throw new Error(`Credly responded with ${res.status}`);
    }
    const { data }: CredlyResponse = await res.json();

    return data.map((badge) => ({
      id: badge.id,
      title: badge.badge_template.name,
      issuer: (badge.issuer?.summary ?? 'Credly').replace(/^issued by\s+/i, ''),
      provider: 'credly',
      date: badge.issued_at_date,
      url: `https://www.credly.com/badges/${badge.id}`,
      image: badge.badge_template.image?.url,
    }));
  } catch (err) {
    console.warn(`[certificates] Failed to fetch Credly badges for "${username}":`, err);
    return [];
  }
}
