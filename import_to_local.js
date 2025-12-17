const { createClient } = require('@supabase/supabase-js');

// Source (Cloud)
const sourceSupabase = createClient(
    'https://oomhhhfahdvavnhlbioa.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUwMjY3MSwiZXhwIjoyMDcyMDc4NjcxfQ.PTWwysas7_MjsOwUlWH7CCy3lEtoMAm9iYRjVWutd8E',
    { auth: { autoRefreshToken: false, persistSession: false } }
);

// Destination (Local)
const destSupabase = createClient(
    'http://127.0.0.1:54321',
    'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz', // Service role key
    {
        auth: { autoRefreshToken: false, persistSession: false },
        db: { schema: 'public' }
    }
);

async function importData() {
    console.log('Starting data import from Cloud to Local...');

    let page = 0;
    const pageSize = 1000;
    let totalImported = 0;
    let hasMore = true;

    while (hasMore) {
        const from = page * pageSize;
        const to = from + pageSize - 1;

        console.log(`Fetching rows ${from} to ${to} from Cloud...`);

        const { data: rows, error: readError } = await sourceSupabase
            .from('dre_hitss')
            .select('*')
            .range(from, to)
            .order('id', { ascending: true });

        if (readError) {
            console.error('❌ Error reading from Cloud:', readError);
            break;
        }

        if (!rows || rows.length === 0) {
            hasMore = false;
            break;
        }

        console.log(`Inserting ${rows.length} rows into Local...`);

        const { error: writeError } = await destSupabase
            .from('dre_hitss')
            .insert(rows);

        if (writeError) {
            console.error('❌ Error writing to Local:', writeError);
            break;
        }

        totalImported += rows.length;
        console.log(`✅ Imported ${rows.length} rows. Total: ${totalImported}`);

        page++;
        if (rows.length < pageSize) hasMore = false;
    }

    console.log(`\n🎉 Import complete! Total rows imported: ${totalImported}`);
}

importData();
