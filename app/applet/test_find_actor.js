import fs from 'fs';
import { ApifyClient } from 'apify-client';

async function run() {
  const apifyToken = process.env.APIFY_API_TOKEN || "";
  const client = new ApifyClient({ token: apifyToken });
  const store = await client.store().list({ search: "google jobs" });
  fs.writeFileSync('output.txt', store.items.map(i => i.name).join('\n'));
}

run();
