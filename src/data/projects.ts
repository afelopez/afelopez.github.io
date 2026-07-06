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
}

// ─────────────────────────────────────────────────────────────────────────────
// Add your deployed projects here.
// Each entry should have at least one link that points to a live environment
// (frontend URL, Swagger docs, public API, etc.).
// ─────────────────────────────────────────────────────────────────────────────
export const projects: Project[] = [
  // Example — remove and replace with real ones:
  // {
  //   id: 'my-backend-api',
  //   name: 'My Backend API',
  //   description: 'REST API for managing ...',
  //   tech: ['Ruby on Rails', 'PostgreSQL', 'AWS Lambda'],
  //   links: [
  //     { label: 'Swagger Docs', url: 'https://api.example.com/swagger', type: 'swagger' },
  //     { label: 'GitHub',       url: 'https://github.com/afelopez/my-backend-api', type: 'github' },
  //   ],
  // },
  // {
  //   id: 'my-frontend',
  //   name: 'My Frontend',
  //   description: 'React dashboard for ...',
  //   tech: ['React', 'TypeScript', 'Tailwind'],
  //   links: [
  //     { label: 'Live App', url: 'https://app.example.com', type: 'frontend' },
  //     { label: 'GitHub',   url: 'https://github.com/afelopez/my-frontend', type: 'github' },
  //   ],
  // },
];
