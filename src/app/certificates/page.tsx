// src/app/certificates/page.tsx
import { getCredlyBadges } from '@/lib/credly';
import { getPlatziDiplomas } from '@/lib/platzi';
import { manualCertificates } from '@/data/certificates';
import CertificatesPage from '@/components/CertificatesPage';

export const revalidate = 3600;

export default async function Page() {
  const [credly, platzi] = await Promise.all([
    getCredlyBadges('andres-lopez.e11df47d'),
    getPlatziDiplomas('ing.ratosocial'),
  ]);

  const certificates = [...credly, ...platzi, ...manualCertificates].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return <CertificatesPage certificates={certificates} />;
}
