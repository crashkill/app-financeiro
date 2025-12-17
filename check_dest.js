
const { createClient } = require('@supabase/supabase-js');

const selfUrl = 'https://supabase.fsw-hitss.duckdns.org';
const selfKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2NTUzNjMwMCwiZXhwIjo0OTIxMjA5OTAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.W3COShRbLKzYGkIPNN3kDvlhRpXQPA4TmrP05Yrp82g';
const supabase = createClient(selfUrl, selfKey);

const TABLES = [
    'dre_hitss', // Should exist
    'system_logs', // Should exist
    'table_xyz_fake_123' // Should NOT exist
];

async function check() {
    console.log('Checking Destination Tables...');

    for (const table of TABLES) {
        const { data, error } = await supabase.from(table).select('count', { count: 'exact', head: true });

        if (error) {
            console.log(`❌ Table "${table}": Error ${error.code} - ${error.message}`);
        } else {
            console.log(`✅ Table "${table}": Exists (Status OK).`);
        }
    }
}
check();
