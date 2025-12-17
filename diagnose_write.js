
const { createClient } = require('@supabase/supabase-js');

const selfUrl = 'https://supabase.fsw-hitss.duckdns.org';
const selfKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2NTUzNjMwMCwiZXhwIjo0OTIxMjA5OTAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.W3COShRbLKzYGkIPNN3kDvlhRpXQPA4TmrP05Yrp82g';
const supabase = createClient(selfUrl, selfKey);

async function diagnose() {
    console.log('Diagnosing Write to system_logs...');

    const row = {
        level: 'INFO',
        message: 'Test log from diagnostic script',
        source: 'diagnose_write.js'
    };

    const { data, error } = await supabase
        .from('system_logs')
        .insert([row])
        .select();

    if (error) {
        console.log('❌ Error:', JSON.stringify(error, null, 2));
        if (Object.keys(error).length === 0) {
            console.log('Error object is empty. Trying console.error(error)...');
            console.error(error);
        }
    } else {
        console.log('✅ Success:', data);
    }
}

diagnose();
