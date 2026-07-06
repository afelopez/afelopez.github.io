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
  {
    id: 'vet-scheduler',
    name: 'Vet Scheduler',
    description:
      'Appointment scheduling platform for veterinary clinics — manages patients, owners, and bookings with an intuitive calendar interface.',
    tech: ['Ruby on Rails', 'PostgreSQL', 'Railway'],
    links: [
      { label: 'Live App', url: 'https://excelsiorvet.up.railway.app/', type: 'frontend' },
    ],
  },
];
