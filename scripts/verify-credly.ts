import { getCredlyBadges } from '../src/lib/credly';

const username = process.argv[2] ?? 'andres-lopez.e11df47d';

getCredlyBadges(username).then((certs) => {
  console.log(`Fetched ${certs.length} Credly certificate(s) for "${username}"`);
  console.log(JSON.stringify(certs, null, 2));
  if (certs.length === 0) {
    console.error('No certificates returned — check the Credly endpoint or username.');
    process.exit(1);
  }
});
