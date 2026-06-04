const titleFilter = "software engineer";
const locationQuery = "";
const headers = {
    "Content-Type": "application/json",
    "x-rapidapi-host": "google-jobs-api.p.rapidapi.com",
    "x-rapidapi-key": process.env.RAPIDAPI_KEY || ""
};

async function test() {
    const rapidApiRes = await fetch(`https://google-jobs-api.p.rapidapi.com/google-jobs/relocation?include=${titleFilter}${locationQuery}&page=1`, {
        method: "GET",
        headers
    });
    const dataJson = await rapidApiRes.json();
    console.log(JSON.stringify(dataJson?.data?.[0] || dataJson?.jobs?.[0] || dataJson || {}, null, 2));
}
test();
