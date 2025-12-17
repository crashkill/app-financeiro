
const { createClient } = require('@supabase/supabase-js');

// Self Hosted
const selfUrl = 'https://supabase.fsw-hitss.duckdns.org';
const selfKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2NTUzNjMwMCwiZXhwIjo0OTIxMjA5OTAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.W3COShRbLKzYGkIPNN3kDvlhRpXQPA4TmrP05Yrp82g';
const destParams = {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    },
    db: {
        schema: 'public',
    },
};
const destSupabase = createClient(selfUrl, selfKey, destParams);

// Cloud
const cloudUrl = 'https://oomhhhfahdvavnhlbioa.supabase.co';
const cloudKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUwMjY3MSwiZXhwIjoyMDcyMDc4NjcxfQ.PTWwysas7_MjsOwUlWH7CCy3lEtoMAm9iYRjVWutd8E';
const cloudParams = {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
};
const sourceSupabase = createClient(cloudUrl, cloudKey, cloudParams);

const TABLES = [
    'dre_hitss',
    'dre_execution_logs'
];

async function migrateTable(tableName) {
    console.log(`\n--- Migrating [${tableName}] ---`);

    let page = 0;
    const pageSize = 1000;
    let totalMigrated = 0;
    let hasMore = true;

    while (hasMore) {
        const from = page * pageSize;
        const to = from + pageSize - 1;

        // 1. Fetch from Source
        const { data: rows, error: readError } = await sourceSupabase
            .from(tableName)
            .select('*')
            .range(from, to);

        if (readError) {
            console.error(`❌ Error reading ${tableName}:`,
                readError.message,
                'Code:', readError.code
            );
            return;
        }

        if (!rows || rows.length === 0) {
            hasMore = false;
            break;
        }

        console.log(`Fetched ${rows.length} rows (Page ${page})...`);

        // 2. Insert into Destination
        // Using upsert to be safe preferably, or insert
        const { error: writeError } = await destSupabase
            .from(tableName)
            .upsert(rows, { onConflict: 'id', ignoreDuplicates: false }); // Assuming 'id' is PK for most.

        if (writeError) {
            console.error(`❌ Error writing to ${tableName}:`,
                writeError.message,
                'Code:', writeError.code,
                'Details:', writeError.details,
                'Hint:', writeError.hint
            );
            // Check if it's a constraint error (e.g. FK missing). order matters!
            // We tried to order TABLES correctly.
            // If upsert fails on PK, check schema.
        } else {
            totalMigrated += rows.length;
            process.stdout.write(`✅ Wrote ${rows.length}. Total: ${totalMigrated}\r`);
        }

        page++;
        if (rows.length < pageSize) hasMore = false;
    }

    console.log(`\n🎉 Finished [${tableName}]. Total migrated: ${totalMigrated}`);
}

async function run() {
    for (const table of TABLES) {
        await migrateTable(table);
    }
    console.log('\n✅ All migrations completed.');
}

run();
