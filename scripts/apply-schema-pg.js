/**
 * Apply Schema using direct PostgreSQL connection
 * 
 * This script connects directly to the PostgreSQL database
 * and applies the schema using the pg module.
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// PostgreSQL connection string for self-hosted Supabase
// The default database port for Supabase is 5432, 
// and the database is usually named 'postgres'
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@supabase.fsw-hitss.duckdns.org:5432/postgres';

async function main() {
    console.log('🎯 Applying Schema to Self-Hosted Supabase PostgreSQL');
    console.log('============================================================');

    // Read the schema file
    const schemaPath = path.join(__dirname, '..', 'full_schema_v4.sql');
    console.log(`📄 Reading schema from: ${schemaPath}`);

    let schema;
    try {
        schema = fs.readFileSync(schemaPath, 'utf-8');
        console.log(`✅ Schema file loaded (${(schema.length / 1024).toFixed(2)} KB)\n`);
    } catch (err) {
        console.error('❌ Failed to read schema file:', err.message);
        process.exit(1);
    }

    // Connect to database
    console.log('🔌 Connecting to PostgreSQL...');
    const client = new Client({ connectionString: DATABASE_URL });

    try {
        await client.connect();
        console.log('✅ Connected to database\n');

        // First, enable required extensions
        console.log('🔧 Enabling extensions...');
        const extensions = [
            'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";',
            'CREATE EXTENSION IF NOT EXISTS "pgcrypto";',
        ];

        for (const ext of extensions) {
            try {
                await client.query(ext);
                console.log(`   ✅ ${ext.match(/"([^"]+)"/)[1]}`);
            } catch (err) {
                console.log(`   ⚠️ ${err.message}`);
            }
        }

        // Try to enable pg_net (may fail if not available)
        try {
            await client.query('CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA extensions;');
            console.log('   ✅ pg_net');
        } catch (err) {
            console.log('   ⚠️ pg_net not available (may be expected)');
        }

        console.log('\n🚀 Applying schema...');
        console.log('   This may take a few minutes for large schemas...\n');

        // Execute the entire schema
        try {
            await client.query(schema);
            console.log('✅ Schema applied successfully!');
        } catch (err) {
            console.error('❌ Schema application failed:', err.message);

            // Try to identify the problematic line
            if (err.position) {
                const lines = schema.substring(0, parseInt(err.position)).split('\n');
                console.log(`   Error near line ${lines.length}`);
            }

            process.exit(1);
        }

    } catch (err) {
        console.error('❌ Connection failed:', err.message);
        console.log('\n💡 Make sure to set the DATABASE_URL environment variable:');
        console.log('   $env:DATABASE_URL = "postgresql://postgres:YOUR_PASSWORD@supabase.fsw-hitss.duckdns.org:5432/postgres"');
        process.exit(1);
    } finally {
        await client.end();
        console.log('\n🔌 Connection closed');
    }
}

main();
