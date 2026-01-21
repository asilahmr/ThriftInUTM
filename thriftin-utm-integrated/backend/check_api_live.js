const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/analytics/activity',
    method: 'GET'
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log(`Total activities fetched: ${json.activities ? json.activities.length : 0}`);

            if (json.activities) {
                // Check filtering/uniqueness
                // In the fixed version, we expect one record per order (approx distinct timestamps if orders are distinct)
                // Let's count occurrences of the same date+userId combination which implies same order usually

                const counts = {};
                json.activities.forEach(a => {
                    const key = `${a.date}_${a.userId}`;
                    counts[key] = (counts[key] || 0) + 1;
                });

                const duplicates = Object.entries(counts).filter(([k, v]) => v > 1);
                if (duplicates.length > 0) {
                    console.log("Found duplicates in API response:");
                    duplicates.slice(0, 5).forEach(([k, v]) => console.log(`  ${k}: ${v} times`));
                } else {
                    console.log("No exact duplicates (date+user) found.");
                }
            }
        } catch (e) {
            console.error("Error parsing JSON:", e);
            console.log("Raw data:", data.substring(0, 200));
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.end();
