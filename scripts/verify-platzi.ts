import { getPlatziDiplomas } from '../src/lib/platzi';

const username = process.argv[2] ?? 'ing.ratosocial';

getPlatziDiplomas(username).then((certs) => {
  console.log(`Fetched ${certs.length} Platzi certificate(s) for "${username}"`);
  console.log(JSON.stringify(certs.slice(0, 3), null, 2));
  if (certs.length === 0) {
    console.error('No certificates returned — check the Platzi endpoint, headers, or username.');
    process.exit(1);
  }
});
