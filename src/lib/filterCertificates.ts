import { Certificate } from '@/data/certificates';
import { CERTIFICATE_KEYWORDS_LOWER } from '@/data/certificate-keywords';

/**
 * Filtra certificados usando una lista blanca de palabras clave.
 * Solo se muestran certificados que coincidan con al menos una palabra clave.
 * 
 * Para editar las palabras clave permitidas, ve a: src/data/certificate-keywords.ts
 * 
 * @param certificates - Array de certificados a filtrar
 * @returns Array de certificados filtrados que contienen al menos una palabra clave
 */
export function filterCertificatesByKeywords(certificates: Certificate[]): Certificate[] {
  return certificates.filter((cert) => {
    const titleLower = cert.title.toLowerCase();
    const issuerLower = cert.issuer.toLowerCase();
    const combined = `${titleLower} ${issuerLower}`;

    // Devuelve true si al menos una keyword coincide
    // Usamos word boundaries para evitar matches parciales (ej: "Google" no debe coincidir con "Google Cloud")
    return CERTIFICATE_KEYWORDS_LOWER.some((keyword) => {
      // Para keywords de una sola palabra, usamos word boundaries
      // Para keywords con espacios (ej: "Google Cloud"), usamos includes normal
      if (keyword.includes(' ')) {
        return combined.includes(keyword);
      }
      
      // Crear regex con word boundaries para palabras únicas
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      return regex.test(combined);
    });
  });
}
