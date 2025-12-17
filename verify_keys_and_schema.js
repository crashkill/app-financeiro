
const { createClient } = require('@supabase/supabase-js');

// Self Hosted
const selfUrl = 'https://supabase.fsw-hitss.duckdns.org';
const selfKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2NTUzNjMwMCwiZXhwIjo0OTIxMjA5OTAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.W3COShRbLKzYGkIPNN3kDvlhRpXQPA4TmrP05Yrp82g';
const selfSupabase = createClient(selfUrl, selfKey);

// Cloud
const cloudUrl = 'https://oomhhhfahdvavnhlbioa.supabase.co';
// WARNING: The user provided 'sb_secret_...' but standard supabase-js expects `anon` or `service_role` JWT.
// Often 'sb_secret' is a platform token, NOT a DB client token.
// Assuming the user MIGHT have meant a service role key, but let's try it.
// If it fails, I'll fallback to `anon` key from .env.local if available or fail.
// Cloud
// URL already defined above or just re-assign content if needed.
// Actually line 10 has cloudUrl. I should only have cloudKey here.
const cloudKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUwMjY3MSwiZXhwIjoyMDcyMDc4NjcxfQ.PTWwysas7_MjsOwUlWH7CCy3lEtoMAm9iYRjVWutd8E';

const cloudSupabase = createClient(cloudUrl, cloudKey);

const TABLES = [
    'dre_hitss',
    'dim_tempo',
    'dim_cliente',
    'dim_conta',
    'dim_projeto',
    'dim_natureza',
    'dim_tipo',
    'fato_dre',
    'dre_execution_logs'
];


async function verify() {
    console.log('--- START VERIFICATION ---');

    // 1. Check Self-Hosted Access & Schema
    console.log('\n[Self-Hosted] Checking access...');
    try {
        // Try to select from a known table 'dre_hitss'
        const { data, error } = await selfSupabase
            .from('dre_hitss')
            .select('count', { count: 'exact', head: true });

        if (error) {
            if (error.code === '42P01') { // undefined_table
                console.log('❌ [Self-Hosted] Table "dre_hitss" DOES NOT exist. Schema migration needed.');
            } else {
                console.log('❌ [Self-Hosted] Error connecting:', error.message, error.code);
            }
        } else {
            console.log(`✅ [Self-Hosted] Connected! Table "dre_hitss" exists. Row count: ${data}`);
        }
    } catch (err) {
        console.error('❌ [Self-Hosted] Exception:', err.message);
    }

    // 2. Check Cloud Access
    console.log('\n[Cloud] Checking Source Tables...');
    for (const table of TABLES) {
        try {
            const { data, error } = await cloudSupabase
                .from(table)
                .select('count', { count: 'exact', head: true });

            if (error) {
                console.log(`❌ [Cloud] Table "${table}" error:`, error.message);
            } else {
                console.log(`✅ [Cloud] Table "${table}" found. Rows: ${data === null ? 0 : data}`); // data is null if head:true usually?
                // In supabase-js v2, { count, data } is returned. 
                // But my previous script printed ${data} and it said "null". 
                // Wait, 'data' property IS null for head:true. 'count' is separate.
                // CHECK DESTRUCTURING.
            }
        } catch (err) {
            console.log(`❌ [Cloud] Exception check "${table}":`, err.message);
        }
    }

    console.log('\n--- END VERIFICATION ---');
}

verify();
