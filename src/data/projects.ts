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
    name: 'ratopro',
    description: 'A simple todo list to practice React.',
    tech: ['React', 'JavaScript', 'HTML', 'CSS'],
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
  },
  {
    id: 'e-commerce-template',
    name: 'e-commerce-template',
    description: 'A simple e-commerce template to practice React and Vite.',
    tech: ['React', 'Vite', 'HTML', 'CSS'],
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
  },
];
