const { ApifyClient } = require('apify-client');
async function run() {
  const client = new ApifyClient({ token: process.env.APIFY_API_TOKEN });
  try {
      const runResp = await client.actor("johnvc/google-jobs-scraper").call({
        query: "Data Engineer in US",
        maxPagesPerQuery: 1
      });
      const items = await client.dataset(runResp.defaultDatasetId).listItems();
      console.log(items.items.map(i => i.title));
      console.log(items.items[0]); // Print the first item layout
  } catch (e) {
      console.error(e.message);
  }
}
run();
