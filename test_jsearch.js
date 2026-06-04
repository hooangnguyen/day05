const headers = {
    "x-rapidapi-host": "jsearch.p.rapidapi.com",
    "x-rapidapi-key": "1f624c87d2msh785a9d375cd7221p1ee830jsnce14f733993f"
};

async function test() {
    const rapidApiRes = await fetch("https://jsearch.p.rapidapi.com/search?query=Data%20Engineer%20in%20US&page=1&num_pages=1", {
        method: "GET",
        headers
    });
    const dataJson = await rapidApiRes.json();
    console.log(JSON.stringify(dataJson?.[0] || dataJson?.data?.[0] || dataJson || {}, null, 2));
}
test();
