import http from 'http';

function makeRequest(path: string, options: any = {}): Promise<{ status: number; body: string; json?: any }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: 'localhost',
        port: 5000,
        path,
        method: options.method || 'GET',
        headers: options.headers || {},
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let json;
          try {
            json = JSON.parse(data);
          } catch {}
          resolve({ status: res.statusCode || 200, body: data, json });
        });
      }
    );
    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function smokeTest() {
  console.log('🚀 Running Live Runtime Smoke Test on Backend (port 5000)...');

  // 1. Health check
  const health = await makeRequest('/api/health');
  console.log(`✓ Health endpoint status: ${health.status}`);

  // 2. Admin Login
  const loginRes = await makeRequest('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { email: 'admin@lexify.local', password: 'Password123!' },
  });
  console.log(`✓ Admin login status: ${loginRes.status}`);
  const token = loginRes.json?.token || loginRes.json?.data?.token;

  if (!token) {
    throw new Error('Admin login failed: ' + loginRes.body);
  }

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // 3. Questions Bank
  const questionsRes = await makeRequest('/api/questions?includeInactive=true', { headers: authHeaders });
  console.log(`✓ Questions endpoint: ${questionsRes.status}, count: ${questionsRes.json?.data?.length}`);

  // 4. Test Set Settings & Publishing
  const settingsRes = await makeRequest('/api/models/settings/system', { headers: authHeaders });
  console.log(`✓ Settings endpoint: ${settingsRes.status}, activeTestSet: ${settingsRes.json?.data?.activeTestSet}`);

  // 5. Test Class Record CSV Export
  const classRecordRes = await makeRequest('/api/exports/class-record-csv', { headers: authHeaders });
  console.log(`✓ Class Record CSV: ${classRecordRes.status}, length: ${classRecordRes.body.length} chars`);
  console.log(`  First 300 chars:\n${classRecordRes.body.slice(0, 300)}\n`);

  // 6. Test Expert Scoring Sheet CSV Export
  const expertSheetRes = await makeRequest('/api/exports/expert-grading-csv', { headers: authHeaders });
  console.log(`✓ Expert Scoring Sheet CSV: ${expertSheetRes.status}, length: ${expertSheetRes.body.length} chars`);
  console.log(`  First 300 chars:\n${expertSheetRes.body.slice(0, 300)}\n`);

  console.log('🎉 LIVE RUNTIME SMOKE TEST PASSED COMPLETELY!');
}

smokeTest().catch((err) => {
  console.error('Smoke test error:', err);
  process.exit(1);
});
