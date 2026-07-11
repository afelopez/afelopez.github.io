import { getRepositories, getRepositoriesForSkills } from '../src/lib/github';
import { getPrimarySkills, getSecondarySkills } from '../src/lib/skills';

const username = process.argv[2] ?? 'afelopez';

Promise.all([getRepositories(username), getRepositoriesForSkills(username)]).then(
  async ([publicRepos, skillsRepos]) => {
    console.log(`Public repos: ${publicRepos.length}`);
    console.log(`Public+private repos used for skills: ${skillsRepos.length}`);

    const primary = getPrimarySkills(skillsRepos);
    console.log(`\nPrimary Skills for "${username}":`);
    console.log(JSON.stringify(primary, null, 2));

    const secondary = await getSecondarySkills(username, skillsRepos);
    console.log(`\nSecondary Skills for "${username}":`);
    console.log(JSON.stringify(secondary, null, 2));

    if (primary.length === 0) {
      console.error('No primary skills returned — check the language weighting logic.');
      process.exit(1);
    }
  }
);
