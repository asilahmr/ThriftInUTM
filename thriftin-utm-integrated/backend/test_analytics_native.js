
const http = require('http');
const fs = require('fs');

const logFile = 'analytics_debug_native.log';
fs.writeFileSync(logFile, 'Starting Native Test...\n');

const options = {
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/analytics/activity',
    method: 'GET',
    headers: {
        'Content-Type': 'application/json'
    }
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        const out = `Status: ${res.statusCode}\nData Length: ${data.length}\nSample: ${data.substring(0, 100)}\n`;
        console.log(out);
        fs.appendFileSync(logFile, out);
    });
});

req.on('error', (e) => {
    const msg = `Request Error: ${e.message}\n`;
    console.error(msg);
    fs.appendFileSync(logFile, msg);
});

req.end();
