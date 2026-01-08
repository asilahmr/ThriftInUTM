const fetch = require('node-fetch'); // or use built-in if node 18
// fallback to built-in fetch if node-fetch missing (likely in this env?)
// Actually standard node might not have fetch in older versions. I'll use http or just assume fetch is available or use a simple http get.

const http = require('http');

function get(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });
}

(async () => {
    try {
        const students = await get('http://localhost:3000/api/users/students');
        console.log("Students found:", students.length);
        if (students.length > 0) {
            const uid = students[0].user_id;
            console.log("Fetching trends for student:", uid);
            const trends = await get(`http://localhost:3000/api/sales/trends/${uid}`);
            console.log("Trends Sample (First 3):", JSON.stringify(trends.slice(0, 3), null, 2));
        }
    } catch (e) {
        console.error("Error:", e.message);
    }
})();
