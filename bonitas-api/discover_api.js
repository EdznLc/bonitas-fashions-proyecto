const domains = [
    'https://bonitas-fashions-proyecto.onrender.com',
    'https://bonitas-fashions-proyecto-1.onrender.com',
    'https://bonitas-fashions-proyecto-api.onrender.com',
    'https://bonitas-fashions-api.onrender.com',
    'https://bonitas-api.onrender.com',
    'https://bonitas-fashions-backend.onrender.com',
    'https://bonitas-backend.onrender.com'
];

async function check(domain) {
    try {
        const res = await fetch(domain + '/');
        if (res.status === 200) {
            const body = await res.text();
            if (body.includes("Express API")) {
                console.log(`FOUND ACTIVE API AT: ${domain}`);
                console.log(`Body: ${body}\n`);
                return true;
            }
        }
    } catch (e) {
        // Skip connection errors
    }
    return false;
}

async function run() {
    console.log("Probing possible backend domains on Render...");
    let found = false;
    for (const d of domains) {
        const ok = await check(d);
        if (ok) found = true;
    }
    if (!found) {
        console.log("No active API found in candidate list.");
    }
}

run();
