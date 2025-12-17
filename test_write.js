
const { createClient } = require('@supabase/supabase-js');

// Self Hosted
const selfUrl = 'https://supabase.fsw-hitss.duckdns.org';
const selfKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2NTMxMjYyMCwiZXhwIjo0OTIwOTg2MjIwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.IcJ7ekuzchHyLeF1oEh-027P5xbWBjGo6crbaovEM9I';

const supabase = createClient(selfUrl, selfKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function testWrite() {
    console.log('Testing Write Permission...');

    const payload = {
        execution_id: 'test-write-' + Date.now(),
        step: 'TEST_WRITE',
        status: 'Running',
        message: 'Testing write access'
    };

    const { data, error } = await supabase
        .from('dre_execution_logs')
        .insert([payload])
        .select();

    if (error) {
        console.error('❌ Write FAILED!');
        console.log('Error Object Keys:', Object.keys(error));
        console.log('Error JSON:', JSON.stringify(error, null, 2));
        console.log('Error Message:', error.message);
    } else {
        console.log('✅ Write SUCCESS!', data);
    }
}

testWrite();
