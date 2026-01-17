const http = require('http');

function postRequest(host, port, path, data) {
    return new Promise((resolve, reject) => {
        const dataString = JSON.stringify(data);
        const options = {
            hostname: host,
            port: port,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': dataString.length,
            },
        };

        console.log(`Connecting to http://${host}:${port}${path}...`);

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: body }));
        });

        req.on('error', (e) => reject(e));
        req.write(dataString);
        req.end();
    });
}

async function run() {
    const port = 3000; // Hardcoded default, will adjust if env differs
    const host = '127.0.0.1';

    console.log('--- DIAGNOSING LIVE SERVER (RETRY via 127.0.0.1) ---');
    try {
        console.log('Attempting Login...');
        const loginRes = await postRequest(host, port, '/api/auth/login', {
            email: 'ainazafirah@graduate.utm.my',
            password: 'aina12345'
        });

        console.log(`Login Status: ${loginRes.status}`);
        console.log('Login Body Start:');
        console.log(loginRes.body);
        console.log('Login Body End');

    } catch (e) {
        console.error('Connection Error:', e.code, e.message);
        console.log(`Failed to connect to ${host}:${port}`);
    }
}

run();
