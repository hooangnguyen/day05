const { ApifyClient } = require('apify-client');
async function run() {
  const client = new ApifyClient({ token: process.env.APIFY_API_TOKEN });
  const store = await client.store().list({ search: "google jobs" });
  console.log(store.items.map(i => i.name));
}
run();
