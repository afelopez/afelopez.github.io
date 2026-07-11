// scripts/verify-skills.ts
import { getRepositories } from '../src/lib/github';
import { getPrimarySkills, getSecondarySkills } from '../src/lib/skills';

const username = process.argv[2] ?? 'afelopez';

getRepositories(username).then(async (repos) => {
  const primary = getPrimarySkills(repos);
  console.log(`Primary Skills for "${username}":`);
  console.log(JSON.stringify(primary, null, 2));

  const secondary = await getSecondarySkills(username, repos);
  console.log(`\nSecondary Skills for "${username}":`);
  console.log(JSON.stringify(secondary, null, 2));

  if (primary.length === 0) {
    console.error('No primary skills returned — check the language weighting logic.');
    process.exit(1);
  }
});
