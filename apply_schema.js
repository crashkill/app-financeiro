
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Connection String provided by User
const connectionString = 'postgresql://postgres:3ceALU7edJhXcWs3S7NT3hEIAFckGN22@supabase.fsw-hitss.duckdns.org:5432/postgres';

const client = new Client({
    connectionString: connectionString,
});

async function applySchema() {
    console.log('Connecting to database...');
    try {
        await client.connect();
        console.log('✅ Connected!');

        const schemaPath = path.join(__dirname, 'schema_dre_hitss.sql');
        console.log(`Reading schema from ${schemaPath}...`);
        const sql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Applying schema...');
        // Split by statement if needed, or run as whole block?
        // pg client might handle multiple statements if they are semicolon separated.
        // But sometimes it's better to split manually if there are special commands.
        // For now, let's try running as a single query block, assuming standard SQL.
        const res = await client.query(sql);

        console.log('✅ Schema applied successfully!');
        // res might be array if multiple queries
        if (Array.isArray(res)) {
            console.log(`Executed ${res.length} statements.`);
        }

    } catch (err) {
        console.error('❌ Error applying schema:', err.message);
        if (err.position) {
            console.error(`Position: ${err.position}`);
        }
    } finally {
        await client.end();
    }
}

applySchema();
