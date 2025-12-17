const { createClient } = require('@supabase/supabase-js');

const sourceSupabase = createClient(
    'https://oomhhhfahdvavnhlbioa.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUwMjY3MSwiZXhwIjoyMDcyMDc4NjcxfQ.PTWwysas7_MjsOwUlWH7CCy3lEtoMAm9iYRjVWutd8E',
    { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkSchema() {
    const { data, error } = await sourceSupabase
        .from('dre_hitss')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Cloud Schema Columns:');
        console.log(Object.keys(data[0]).join(', '));
        console.log('\nSample row:');
        console.log(JSON.stringify(data[0], null, 2));
    }
}

checkSchema();
