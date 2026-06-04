import fs from 'fs';
import { ApifyClient } from 'apify-client';

async function run() {
  try {
    const apifyToken = process.env.APIFY_API_TOKEN || "";
    const client = new ApifyClient({ token: apifyToken });
    const store = await client.store().list({ search: "google jobs" });
    fs.writeFileSync('/app/applet/output.txt', store.items.map(i => i.name).join('\n'));
  } catch(e) {
    fs.writeFileSync('/app/applet/output.txt', e.message);
  }
}
run();
