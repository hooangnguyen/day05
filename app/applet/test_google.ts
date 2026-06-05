async function test() {
    try {
        const titleFilter = "senior engineer";
        const res = await fetch(`https://google-jobs-api.p.rapidapi.com/google-jobs/relocation?include=${encodeURIComponent(titleFilter)}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "x-rapidapi-host": "google-jobs-api.p.rapidapi.com",
                "x-rapidapi-key": "1f624c87d2msh785a9d375cd7221p1ee830jsnce14f733993f"
            }
        });
        const text = await res.text();
        console.log(JSON.stringify(JSON.parse(text)[0] || JSON.parse(text), null, 2));
    } catch (e) {
        console.error(e);
    }
}
test();
