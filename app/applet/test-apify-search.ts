import { ApifyClient } from 'apify-client';

async function run() {
  const apifyToken = process.env.APIFY_API_TOKEN || "apify_api_h4tLof5F3295xK0Oq16zS96y1r8R4f00RXXP";
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
