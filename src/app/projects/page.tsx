import { projects } from '@/data/projects';
import ProjectsPage from '@/components/ProjectsPage';

export default function Page() {
  return <ProjectsPage projects={projects} />;
}
