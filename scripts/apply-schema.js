/**
 * Apply Schema to Self-Hosted Supabase via REST API
 * 
 * This script applies the full schema to self-hosted Supabase
 * using the service_role_key to execute SQL directly.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const SELFHOSTED_URL = 'https://supabase.fsw-hitss.duckdns.org';
const SELFHOSTED_SERVICE_ROLE_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2NTUzNjMwMCwiZXhwIjo0OTIxMjA5OTAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.W3COShRbLKzYGkIPNN3kDvlhRpXQPA4TmrP05Yrp82g';

/**
 * Execute SQL via Supabase REST API
 */
async function executeSQL(sql) {
    const url = new URL('/rest/v1/rpc/exec_sql', SELFHOSTED_URL);

    const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SELFHOSTED_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SELFHOSTED_SERVICE_ROLE_KEY}`,
            'Prefer': 'return=representation'
        },
        body: JSON.stringify({ sql_query: sql })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`SQL execution failed: ${response.status} - ${error}`);
    }

    return await response.json();
}

/**
 * Enable required extensions
 */
async function enableExtensions() {
    console.log('🔧 Enabling required PostgreSQL extensions...\n');

    const extensions = [
        'CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA extensions;',
        'CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA extensions;',
        'CREATE EXTENSION IF NOT EXISTS "pgcrypto";',
        'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'
    ];

    for (const ext of extensions) {
        try {
            console.log(`   Executing: ${ext.substring(0, 50)}...`);
            await executeSQL(ext);
            console.log('   ✅ Success');
        } catch (err) {
            console.log(`   ⚠️ Warning: ${err.message}`);
        }
    }
}

/**
 * Apply schema from file
 */
async function applySchema() {
    const schemaPath = path.join(__dirname, '..', 'full_schema_v4.sql');

    console.log(`\n📄 Reading schema from: ${schemaPath}`);

    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Split into statements (simplified - may need refinement)
    const statements = schema
        .split(/;\s*$/m)
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📊 Found ${statements.length} SQL statements\n`);
    console.log('🚀 Applying schema...\n');

    let success = 0;
    let failed = 0;

    for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];

        // Skip comments and empty statements
        if (!stmt || stmt.startsWith('--')) continue;

        try {
            await executeSQL(stmt + ';');
            success++;
            process.stdout.write(`\r   Progress: ${success + failed}/${statements.length} (${success} ok, ${failed} failed)`);
        } catch (err) {
            failed++;
            console.log(`\n   ❌ Statement ${i + 1} failed: ${err.message.substring(0, 100)}`);
        }
    }

    console.log('\n\n============================================================');
    console.log('📊 Schema Application Summary');
    console.log('============================================================');
    console.log(`Total Statements: ${statements.length}`);
    console.log(`✅ Successful: ${success}`);
    console.log(`❌ Failed: ${failed}`);
    console.log('============================================================');
}

async function main() {
    console.log('🎯 Applying Schema to Self-Hosted Supabase');
    console.log('============================================================');
    console.log(`Target: ${SELFHOSTED_URL}`);
    console.log('============================================================\n');

    try {
        // First, try to enable extensions
        await enableExtensions();

        // Then apply the schema
        await applySchema();

        console.log('\n✅ Schema application completed!');
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

main();
