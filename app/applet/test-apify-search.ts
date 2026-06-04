import { ApifyClient } from 'apify-client';

async function run() {
  const apifyToken = process.env.APIFY_API_TOKEN || "";
  if (!apifyToken) {
    console.log("No token"); return;
  }
  const client = new ApifyClient({ token: apifyToken });
  try {
     const res = await fetch("https://api.apify.com/v2/store/actors?search=google%20jobs");
     const data = await res.json();
     console.log(data.data.items.slice(0, 5).map(i => i.name));
  } catch (e) {
     console.error(e);
  }
}
run();
