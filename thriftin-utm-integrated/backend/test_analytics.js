
const axios = require('axios');
const fs = require('fs');

async function testEndpoint() {
    const logFile = 'analytics_debug.log';
    fs.writeFileSync(logFile, 'Starting Test...\n');
    try {
        console.log('Testing /api/analytics/activity...');
        fs.appendFileSync(logFile, 'Requesting...\n');

        const res = await axios.get('http://127.0.0.1:3000/api/analytics/activity');

        const out = `Status: ${res.status}\nData Length: ${JSON.stringify(res.data).length}\n`;
        console.log(out);
        fs.appendFileSync(logFile, out);
        fs.appendFileSync(logFile, 'Data Preview: ' + JSON.stringify(res.data).substring(0, 200) + '\n');

    } catch (e) {
        const errorMsg = `Test Failed: ${e.message}\n` + (e.response ? `Status: ${e.response.status}\nData: ${JSON.stringify(e.response.data)}\n` : '');
        console.error(errorMsg);
        fs.appendFileSync(logFile, errorMsg);
    }
}

testEndpoint();
