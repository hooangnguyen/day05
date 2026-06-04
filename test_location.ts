async function test() {
    try {
        const titleFilter = "senior engineer";
        const location = "New York";
        const pageResponse = await fetch(`https://google-jobs-api.p.rapidapi.com/google-jobs/relocation?include=${encodeURIComponent(titleFilter)}&location=${encodeURIComponent(location)}&page=1`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "x-rapidapi-host": "google-jobs-api.p.rapidapi.com",
                "x-rapidapi-key": "1f624c87d2msh785a9d375cd7221p1ee830jsnce14f733993f"
            }
        });
        const text = await pageResponse.text();
        console.log("Results with location param:", JSON.parse(text).jobs?.length, JSON.parse(text).filters?.appliedFilters);
    } catch (e) {
        console.error(e);
    }
}
test();
