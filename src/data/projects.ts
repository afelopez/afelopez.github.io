export type LinkType = 'frontend' | 'swagger' | 'api' | 'github';

export interface ProjectLink {
  label: string;
  url: string;
  type: LinkType;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  tech: string[];
  links: ProjectLink[];
  /** Logo mark path relative to /public, e.g. '/projects/foo-logo.png' */
  logo?: string;
  /** Panel background color — use the brand's primary dark color */
  brandColor?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Add your deployed projects here.
// Each entry should have at least one link to a live environment.
// ─────────────────────────────────────────────────────────────────────────────
export const projects: Project[] = [
  {
    id: 'vet-scheduler',
    name: 'ExcelsiorVet',
    description:
      'Veterinary diagnostic imaging platform — radiology, ultrasound, echocardiography and MRI, interpreted by certified specialists and delivered in hours.',
    tech: ['Ruby on Rails', 'PostgreSQL', 'Railway'],
    links: [
      { label: 'Live App', url: 'https://excelsiorvet.up.railway.app/', type: 'frontend' },
    ],
    logo: '/projects/vet-scheduler-logo.png',
    brandColor: '#0e1830',
  },
  {
    id: 'ratopro',
    name: 'RatoPro',
    description:
      'Professional task manager with priority levels, due dates, smart sorting, and live search — built with React 19, TypeScript, and Tailwind CSS v4. Tasks persist across sessions via localStorage.',
    tech: ['React 19', 'TypeScript', 'Tailwind CSS v4', 'Vite'],
    links: [
      {
        label: 'Live Demo',
        url: 'https://afelopez.github.io/ratopro/',
        type: 'frontend',
      },
      {
        label: 'GitHub',
        url: 'https://github.com/afelopez/ratopro',
        type: 'github',
      },
    ],
    logo: '/projects/ratopro-logo.svg',
    brandColor: '#0f1117',
  },
  {
    id: 'e-commerce-template',
    name: 'FuncionArte',
    description:
      'Full-featured e-commerce SPA — category filtering, slide-in product detail panel, cart, checkout flow, and order history. Powered by FakeStore API with React, React Router, and Tailwind CSS.',
    tech: ['React', 'React Router', 'Tailwind CSS', 'Vite'],
    links: [
      {
        label: 'Live Demo',
        url: 'https://afelopez.github.io/e-commerce-template/',
        type: 'frontend',
      },
      {
        label: 'GitHub',
        url: 'https://github.com/afelopez/e-commerce-template',
        type: 'github',
      },
    ],
    logo: '/projects/funcion-arte-logo.svg',
    brandColor: '#071411',
  },
];
