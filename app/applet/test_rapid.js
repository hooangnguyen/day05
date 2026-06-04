const fetch = require('node-fetch');

async function test() {
    try {
        const titleFilter = "Data Engineer";
        const locationFilter = "United States OR United Kingdom";
        const res = await fetch(`https://linkedin-job-search-api.p.rapidapi.com/active-jb-1h?offset=0&title_filter=${encodeURIComponent(titleFilter)}&location_filter=${encodeURIComponent(locationFilter)}&description_type=text`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "x-rapidapi-host": "linkedin-job-search-api.p.rapidapi.com",
                "x-rapidapi-key": "1f624c87d2msh785a9d375cd7221p1ee830jsnce14f733993f"
            }
        });
        const text = await res.text();
        console.log(res.status, text);
    } catch (e) {
        console.error(e);
    }
}
test();
