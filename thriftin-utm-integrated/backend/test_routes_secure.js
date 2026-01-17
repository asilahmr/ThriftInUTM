const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:3000/api';
const EMAIL = 'test.student@graduate.utm.my';
const PASSWORD = 'password123';

const logFile = path.join(__dirname, 'test_results.txt');
function log(msg) {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
}

// Clear previous log
if (fs.existsSync(logFile)) fs.unlinkSync(logFile);

async function testRoutes() {
    log('=== STARTING ROUTE VERIFICATION ===\n');

    let studentToken;
    let studentId;
    let adminToken;

    // 1. Authenticate Student
    try {
        log('1. Logging in as Student...');
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: EMAIL,
            password: PASSWORD
        });

        if (loginRes.data.token) {
            studentToken = loginRes.data.token;
            studentId = loginRes.data.user.id;
            log('✓ Student logged in successfully. ID:', studentId);
        } else {
            log('✗ Login failed: No token received');
            return;
        }
    } catch (err) {
        log('✗ Student Login Failed:', err.message);
        if (err.response) log('  Reason:', err.response.data);
        return;
    }

    // 2. Test Secured Sales Route (Student accessing own data)
    try {
        log('\n2. Testing Access to Own Sales Data...');
        const res = await axios.get(`${BASE_URL}/sales/user/${studentId}`, {
            headers: { Authorization: `Bearer ${studentToken}` }
        });
        log(`✓ Success! Retrieved data: Revenue RM ${res.data.total_revenue}`);
    } catch (err) {
        log('✗ Failed to access own data:', err.message);
        if (err.response) log('  Status:', err.response.status);
    }

    // 3. Test Secured Sales Route (Student accessing OTHER user's data)
    try {
        log('\n3. Testing Access to OTHER User Sales Data (Security Check)...');
        const fakeId = studentId + 1;
        await axios.get(`${BASE_URL}/sales/user/${fakeId}`, {
            headers: { Authorization: `Bearer ${studentToken}` }
        });
        log('✗ FAILED: Student was able to access other user data! (Should have been 403)');
    } catch (err) {
        if (err.response && err.response.status === 403) {
            log('✓ Success! Access denied with 403 Forbidden as expected.');
        } else {
            log('? Unexpected error:', err.message);
        }
    }

    // 4. Test Unauthenticated Access
    try {
        log('\n4. Testing Unauthenticated Access...');
        await axios.get(`${BASE_URL}/sales/user/${studentId}`);
        log('✗ FAILED: Accessed protected route without token! (Should have been 401)');
    } catch (err) {
        if (err.response && err.response.status === 401) { // Auth middleware usually returns 401 or 403
            log('✓ Success! Access denied with 401/403 as expected.');
        } else {
            // Note: Middleware might return 401 or 403 depending on implementation
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                log(`✓ Success! Access denied with ${err.response.status} as expected.`);
            } else {
                log('? Unexpected error:', err.message);
            }
        }
    }

    // 5. Test Secured Buyer Route
    try {
        log('\n5. Testing Access to Own Buyer Data...');
        const res = await axios.get(`${BASE_URL}/buying/user/${studentId}`, {
            headers: { Authorization: `Bearer ${studentToken}` }
        });
        log(`✓ Success! Retrieved data: Spending RM ${res.data.totalSpending}`);
    } catch (err) {
        console.log('✗ Failed to access buyer data:', err.message);
        if (err.response) console.log('  Status:', err.response.status);
    }

    console.log('\n=== VERIFICATION COMPLETE ===');
}

testRoutes();
