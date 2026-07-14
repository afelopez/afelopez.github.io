/**
 * Lista blanca de palabras clave para filtrar certificados.
 * Solo se mostrarán certificados que contengan al menos una de estas palabras clave.
 * 
 * Edita esta lista según tus necesidades — es la fuente única de verdad.
 */

export const CERTIFICATE_KEYWORDS = [
  // ─── Lenguajes de Programación ──────────────────────────────────────────
  'Ruby',
  'JavaScript',
  'TypeScript',
  'Python',
  'Java',
  'Go',
  'Golang',
  'C#',
  'PHP',
  'Swift',
  'Kotlin',
  'Rust',
  'Scala',
  'C++',
  'SQL',
  
  // ─── Frontend & Styling ─────────────────────────────────────────────────
  'React',
  'Vue',
  'Next.js',
  'Vite',
  'Redux',
  'HTML',
  'CSS',
  'SCSS',
  'Sass',
  'Tailwind',
  'Bootstrap',
  
  // ─── Backend & Frameworks ───────────────────────────────────────────────
  'Node.js',
  'Express',
  'NestJS',
  'Rails',
  'Ruby on Rails',
  'Sinatra',
  'FastAPI',
  'Django',
  'Flask',
  'Spring',
  'Laravel',
  
  // ─── Bases de Datos ─────────────────────────────────────────────────────
  'PostgreSQL',
  'MySQL',
  'MongoDB',
  'Redis',
  'Database',
  'SQL',
  'NoSQL',
  'Elasticsearch',
  'DynamoDB',
  
  // ─── Cloud & DevOps ─────────────────────────────────────────────────────
  'AWS',
  'Amazon Web Services',
  'Azure',
  'Google Cloud',
  'GCP',
  'Lambda',
  'S3',
  'EC2',
  'RDS',
  'Docker',
  'Kubernetes',
  'K8s',
  'CI/CD',
  'GitHub Actions',
  'Jenkins',
  'Terraform',
  'Ansible',
  'Heroku',
  
  // ─── Arquitectura & Patrones ────────────────────────────────────────────
  'Microservices',
  'API',
  'REST',
  'GraphQL',
  'Serverless',
  'Cloud Architecture',
  'Software Architecture',
  'System Design',
  'Design Patterns',
  
  // ─── Testing & Quality ──────────────────────────────────────────────────
  'Testing',
  'RSpec',
  'Jest',
  'Cypress',
  'Selenium',
  'TDD',
  'BDD',
  
  // ─── Herramientas & Tecnologías ─────────────────────────────────────────
  'Git',
  'GitHub',
  'Linux',
  'Unix',
  'Bash',
  'Shell',
  'VS Code',
  'Vim',
  'Webpack',
  'Babel',
  'npm',
  'yarn',
  
  // ─── Machine Learning & Data ────────────────────────────────────────────
  'Machine Learning',
  'Deep Learning',
  'AI',
  'Artificial Intelligence',
  'Data Science',
  'TensorFlow',
  'PyTorch',
  'Pandas',
  'NumPy',
  
  // ─── Metodologías & Soft Skills ─────────────────────────────────────────
  'Agile',
  'Scrum',
  'Kanban',
  'Leadership',
  'Project Management',
  'Product Management',
  
  // ─── Seguridad ──────────────────────────────────────────────────────────
  'Security',
  'Cybersecurity',
  'OAuth',
  'JWT',
  'Encryption',
  
  // ─── Niveles de Inglés Avanzados ────────────────────────────────────────
  'B2',
  'C1',
  'C2',
  'Advanced English',
  'English Proficiency',
  
  // ─── Certificaciones Profesionales ──────────────────────────────────────
  'Certified',
  'Professional',
  'Associate',
  'Solutions Architect',
  'Developer Associate',
  'SysOps',
] as const;

/**
 * Convierte las palabras clave a lowercase para búsqueda case-insensitive.
 */
export const CERTIFICATE_KEYWORDS_LOWER = CERTIFICATE_KEYWORDS.map((k) => k.toLowerCase());
