async function test() {
    try {
        const titleFilter = "senior engineer";
        const pageResponse = await fetch(`https://google-jobs-api.p.rapidapi.com/google-jobs/relocation?include=${encodeURIComponent(titleFilter)}&page=2`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "x-rapidapi-host": "google-jobs-api.p.rapidapi.com",
                "x-rapidapi-key": "1f624c87d2msh785a9d375cd7221p1ee830jsnce14f733993f"
            }
        });
        const text = await pageResponse.text();
        console.log("Page 2 results:", JSON.parse(text).jobs?.length, JSON.parse(text).pagination);
    } catch (e) {
        console.error(e);
    }
}
test();
