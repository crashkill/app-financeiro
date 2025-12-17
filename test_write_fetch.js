
const selfUrl = 'https://supabase.fsw-hitss.duckdns.org';
const selfKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2NTUzNjMwMCwiZXhwIjo0OTIxMjA5OTAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.W3COShRbLKzYGkIPNN3kDvlhRpXQPA4TmrP05Yrp82g';

async function testWriteFetch() {
    console.log('Testing Write system_logs via fetch...');

    const payload = {
        level: 'INFO',
        message: 'Test log from fetch script',
        source: 'test_write_fetch.js'
    };

    const response = await fetch(`${selfUrl}/rest/v1/system_logs`, {
        method: 'POST',
        headers: {
            'apikey': selfKey,
            'Authorization': `Bearer ${selfKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        console.error('❌ Write Fetch FAILED!', response.status, response.statusText);
        const text = await response.text();
        console.log('Response Body:', text);
    } else {
        const data = await response.json();
        console.log('✅ Write Fetch SUCCESS!', data);
    }
}

testWriteFetch();
