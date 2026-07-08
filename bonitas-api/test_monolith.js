async function run() {
    try {
        console.log("Fetching products on frontend domain...");
        const resProd = await fetch('https://bonitas-fashions-proyecto-1.onrender.com/api/productos');
        console.log("Status:", resProd.status);
        console.log("Body:", await resProd.text());

        console.log("\nFetching root of frontend domain...");
        const resRoot = await fetch('https://bonitas-fashions-proyecto-1.onrender.com/');
        console.log("Root status:", resRoot.status);
        console.log("Root body length:", (await resRoot.text()).length);
    } catch (err) {
        console.error("Fetch failed:", err);
    }
}

run();
