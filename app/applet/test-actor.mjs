import fs from 'fs';
import { ApifyClient } from 'apify-client';

async function run() {
  try {
    const apifyToken = process.env.APIFY_API_TOKEN || "apify_api_h4tLof5F3295xK0Oq16zS96y1r8R4f00RXXP";
    const client = new ApifyClient({ token: apifyToken });
    const store = await client.store().list({ search: "google jobs" });
    fs.writeFileSync('/app/applet/output.txt', store.items.map(i => i.name).join('\n'));
  } catch(e) {
    fs.writeFileSync('/app/applet/output.txt', e.message);
  }
}
run();
