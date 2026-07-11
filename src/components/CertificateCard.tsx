'use client';
import { motion } from 'framer-motion';
import { Certificate, providerLabel } from '@/data/certificates';
import LinkIcon from '@/components/LinkIcon';

export default function CertificateCard({ certificate, index }: { certificate: Certificate; index: number }) {
  const formattedDate = new Date(certificate.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.05, 1) }}
      whileHover={{ y: -5, boxShadow: '0px 10px 20px rgba(0,0,0,0.1)' }}
      className="glass rounded-xl p-6 flex flex-col justify-between"
    >
      <div className="flex items-start gap-4">
        {certificate.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={certificate.image}
            alt=""
            className="h-12 w-12 shrink-0 rounded-lg bg-white/40 object-contain p-1 dark:bg-gray-900/40"
            loading="lazy"
          />
        )}
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{certificate.title}</h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{certificate.issuer}</p>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-2 text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium dark:bg-gray-700">
            {providerLabel(certificate.provider)}
          </span>
          <span>{formattedDate}</span>
        </div>
        <a
          href={certificate.url}
          target="_blank"
          rel="noopener noreferrer"
          title="Ver certificado"
          aria-label="Ver certificado"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-teal-500/60 bg-teal-600/25 text-teal-600 backdrop-blur-sm transition-colors hover:bg-teal-600/35 dark:border-teal-400/50 dark:bg-teal-500/20 dark:text-teal-400 dark:hover:bg-teal-500/30"
        >
          <LinkIcon icon="external-link" />
        </a>
      </div>
    </motion.div>
  );
}
