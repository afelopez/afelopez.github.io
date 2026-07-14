// src/app/certificates/page.tsx
import { getCredlyBadges } from '@/lib/credly';
import { getPlatziDiplomas } from '@/lib/platzi';
import { manualCertificates } from '@/data/certificates';
import { filterCertificatesByKeywords } from '@/lib/filterCertificates';
import CertificatesPage from '@/components/CertificatesPage';

export const revalidate = 3600;

export default async function Page() {
  const [credly, platzi] = await Promise.all([
    getCredlyBadges('andres-lopez.e11df47d'),
    getPlatziDiplomas('ing.ratosocial'),
  ]);

  const allCertificates = [...credly, ...platzi, ...manualCertificates];
  const filtered = filterCertificatesByKeywords(allCertificates);
  
  const certificates = filtered.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return <CertificatesPage certificates={certificates} />;
}
