import { describe, it, expect } from 'vitest';
import { filterCertificatesByKeywords } from './filterCertificates';
import { Certificate } from '@/data/certificates';

describe('filterCertificatesByKeywords', () => {
  const mockCertificates: Certificate[] = [
    // Certificados técnicos que deben pasar
    {
      id: '1',
      title: 'AWS Certified Solutions Architect',
      issuer: 'Amazon Web Services',
      provider: 'credly',
      date: '2024-01-15',
      url: 'https://example.com/cert1',
    },
    {
      id: '2',
      title: 'Python for Data Science',
      issuer: 'Platzi',
      provider: 'platzi',
      date: '2023-06-20',
      url: 'https://example.com/cert2',
    },
    {
      id: '3',
      title: 'React Advanced Patterns',
      issuer: 'Frontend Masters',
      provider: 'manual',
      date: '2023-11-10',
      url: 'https://example.com/cert3',
    },
    {
      id: '4',
      title: 'Docker & Kubernetes Fundamentals',
      issuer: 'Linux Foundation',
      provider: 'credly',
      date: '2024-03-05',
      url: 'https://example.com/cert4',
    },
    {
      id: '5',
      title: 'TypeScript Deep Dive',
      issuer: 'Udemy',
      provider: 'manual',
      date: '2023-08-12',
      url: 'https://example.com/cert5',
    },

    // Certificados de inglés avanzado que deben pasar
    {
      id: '6',
      title: 'English C1 Advanced',
      issuer: 'Cambridge',
      provider: 'manual',
      date: '2022-05-10',
      url: 'https://example.com/cert6',
    },
    {
      id: '7',
      title: 'B2 First Certificate in English',
      issuer: 'Cambridge',
      provider: 'manual',
      date: '2021-03-15',
      url: 'https://example.com/cert7',
    },

    // Certificados que NO deben pasar
    {
      id: '8',
      title: 'Introducción a Excel',
      issuer: 'Platzi',
      provider: 'platzi',
      date: '2020-01-10',
      url: 'https://example.com/cert8',
    },
    {
      id: '9',
      title: 'Marketing Digital Básico',
      issuer: 'Google',
      provider: 'manual',
      date: '2020-06-20',
      url: 'https://example.com/cert9',
    },
    {
      id: '10',
      title: 'English A2 Basic',
      issuer: 'Cambridge',
      provider: 'manual',
      date: '2019-08-10',
      url: 'https://example.com/cert10',
    },
    {
      id: '11',
      title: 'Curso de Fotografía',
      issuer: 'Domestika',
      provider: 'manual',
      date: '2021-11-05',
      url: 'https://example.com/cert11',
    },
  ];

  it('debe filtrar y mantener solo certificados con palabras clave permitidas', () => {
    const filtered = filterCertificatesByKeywords(mockCertificates);

    // Debe incluir los certificados técnicos y de inglés avanzado (IDs 1-7)
    expect(filtered).toHaveLength(7);
    expect(filtered.map((c) => c.id)).toEqual(['1', '2', '3', '4', '5', '6', '7']);
  });

  it('debe permitir certificados de AWS', () => {
    const filtered = filterCertificatesByKeywords(mockCertificates);
    const awsCert = filtered.find((c) => c.id === '1');
    expect(awsCert).toBeDefined();
    expect(awsCert?.title).toContain('AWS');
  });

  it('debe permitir certificados de Python', () => {
    const filtered = filterCertificatesByKeywords(mockCertificates);
    const pythonCert = filtered.find((c) => c.id === '2');
    expect(pythonCert).toBeDefined();
    expect(pythonCert?.title).toContain('Python');
  });

  it('debe permitir certificados de React', () => {
    const filtered = filterCertificatesByKeywords(mockCertificates);
    const reactCert = filtered.find((c) => c.id === '3');
    expect(reactCert).toBeDefined();
    expect(reactCert?.title).toContain('React');
  });

  it('debe permitir certificados de Docker y Kubernetes', () => {
    const filtered = filterCertificatesByKeywords(mockCertificates);
    const dockerCert = filtered.find((c) => c.id === '4');
    expect(dockerCert).toBeDefined();
    expect(dockerCert?.title).toContain('Docker');
    expect(dockerCert?.title).toContain('Kubernetes');
  });

  it('debe permitir certificados de TypeScript', () => {
    const filtered = filterCertificatesByKeywords(mockCertificates);
    const tsCert = filtered.find((c) => c.id === '5');
    expect(tsCert).toBeDefined();
    expect(tsCert?.title).toContain('TypeScript');
  });

  it('debe permitir certificados de inglés C1', () => {
    const filtered = filterCertificatesByKeywords(mockCertificates);
    const c1Cert = filtered.find((c) => c.id === '6');
    expect(c1Cert).toBeDefined();
    expect(c1Cert?.title).toContain('C1');
  });

  it('debe permitir certificados de inglés B2', () => {
    const filtered = filterCertificatesByKeywords(mockCertificates);
    const b2Cert = filtered.find((c) => c.id === '7');
    expect(b2Cert).toBeDefined();
    expect(b2Cert?.title).toContain('B2');
  });

  it('debe filtrar certificados de Excel', () => {
    const filtered = filterCertificatesByKeywords(mockCertificates);
    const excelCert = filtered.find((c) => c.id === '8');
    expect(excelCert).toBeUndefined();
  });

  it('debe filtrar certificados de Marketing', () => {
    const filtered = filterCertificatesByKeywords(mockCertificates);
    const marketingCert = filtered.find((c) => c.id === '9');
    expect(marketingCert).toBeUndefined();
  });

  it('debe filtrar certificados de inglés A2', () => {
    const filtered = filterCertificatesByKeywords(mockCertificates);
    const a2Cert = filtered.find((c) => c.id === '10');
    expect(a2Cert).toBeUndefined();
  });

  it('debe filtrar certificados de Fotografía', () => {
    const filtered = filterCertificatesByKeywords(mockCertificates);
    const photoCert = filtered.find((c) => c.id === '11');
    expect(photoCert).toBeUndefined();
  });

  it('debe ser case-insensitive en el título', () => {
    const certs: Certificate[] = [
      {
        id: '1',
        title: 'python fundamentals',
        issuer: 'Test',
        provider: 'test',
        date: '2024-01-01',
        url: 'https://example.com',
      },
      {
        id: '2',
        title: 'REACT BASICS',
        issuer: 'Test',
        provider: 'test',
        date: '2024-01-01',
        url: 'https://example.com',
      },
      {
        id: '3',
        title: 'TypeScript Course',
        issuer: 'Test',
        provider: 'test',
        date: '2024-01-01',
        url: 'https://example.com',
      },
    ];

    const filtered = filterCertificatesByKeywords(certs);
    expect(filtered).toHaveLength(3);
  });

  it('debe buscar keywords en el issuer también', () => {
    const certs: Certificate[] = [
      {
        id: '1',
        title: 'Advanced Cloud Architecture',
        issuer: 'Amazon Web Services Training',
        provider: 'manual',
        date: '2024-01-01',
        url: 'https://example.com',
      },
      {
        id: '2',
        title: 'Professional Certification',
        issuer: 'Microsoft Azure',
        provider: 'manual',
        date: '2024-01-01',
        url: 'https://example.com',
      },
    ];

    const filtered = filterCertificatesByKeywords(certs);
    expect(filtered).toHaveLength(2);
    expect(filtered.find((c) => c.issuer.includes('Amazon'))).toBeDefined();
    expect(filtered.find((c) => c.issuer.includes('Azure'))).toBeDefined();
  });

  it('debe devolver array vacío si no hay certificados', () => {
    const filtered = filterCertificatesByKeywords([]);
    expect(filtered).toEqual([]);
  });

  it('debe devolver array vacío si ningún certificado cumple con keywords', () => {
    const certs: Certificate[] = [
      {
        id: '1',
        title: 'Curso de Cocina',
        issuer: 'Escuela Culinaria',
        provider: 'manual',
        date: '2024-01-01',
        url: 'https://example.com',
      },
      {
        id: '2',
        title: 'Taller de Cerámica',
        issuer: 'Arte y Diseño',
        provider: 'manual',
        date: '2024-01-01',
        url: 'https://example.com',
      },
    ];

    const filtered = filterCertificatesByKeywords(certs);
    expect(filtered).toEqual([]);
  });

  it('debe mantener certificados con múltiples keywords', () => {
    const certs: Certificate[] = [
      {
        id: '1',
        title: 'Full Stack Development with React and Node.js',
        issuer: 'Udemy',
        provider: 'manual',
        date: '2024-01-01',
        url: 'https://example.com',
      },
    ];

    const filtered = filterCertificatesByKeywords(certs);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].title).toContain('React');
    expect(filtered[0].title).toContain('Node.js');
  });
});
