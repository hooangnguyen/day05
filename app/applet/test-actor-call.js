const { ApifyClient } = require('apify-client');
async function run() {
  const client = new ApifyClient({ token: process.env.APIFY_API_TOKEN });
  const runResp = await client.actor("johnvc/google-jobs-scraper").call({
    queries: "Data Engineer in US",
    maxPagesPerQuery: 1
  });
  const items = await client.dataset(runResp.defaultDatasetId).listItems();
  console.log(items.items[0]);
}
run().catch(console.error);
