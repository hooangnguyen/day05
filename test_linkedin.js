const headers = {
    "Content-Type": "application/json",
    "x-rapidapi-host": "linkedin-job-search-api.p.rapidapi.com",
    "x-rapidapi-key": process.env.RAPIDAPI_KEY || ""
};

async function test() {
    const rapidApiRes = await fetch("https://linkedin-job-search-api.p.rapidapi.com/active-jb-1h?offset=0&title_filter=Data%20Engineer&location_filter=&description_type=text", {
        method: "GET",
        headers
    });
    const dataJson = await rapidApiRes.json();
    console.log(JSON.stringify(dataJson?.[0] || dataJson?.data?.[0] || dataJson || {}, null, 2));
}
test();
