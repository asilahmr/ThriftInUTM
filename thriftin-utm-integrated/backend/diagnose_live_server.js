const http = require('http');

function postRequest(path, data) {
    return new Promise((resolve, reject) => {
        const dataString = JSON.stringify(data);
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': dataString.length,
            },
        };

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
    console.log('--- DIAGNOSING LIVE SERVER ---');
    try {
        console.log('Attempting Login...');
        const loginRes = await postRequest('/api/auth/login', {
            email: 'ainazafirah@graduate.utm.my',
            password: 'aina12345'
        });

        console.log(`Login Status: ${loginRes.status}`);
        console.log(`Login Body: ${loginRes.body}`);

    } catch (e) {
        console.error('Connection Error:', e.message);
        console.log('Hint: Is the server running?');
    }
}

run();
