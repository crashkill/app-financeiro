
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Cloud Config
const cloudUrl = 'https://oomhhhfahdvavnhlbioa.supabase.co';
const cloudKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUwMjY3MSwiZXhwIjoyMDcyMDc4NjcxfQ.PTWwysas7_MjsOwUlWH7CCy3lEtoMAm9iYRjVWutd8E';
const sourceSupabase = createClient(cloudUrl, cloudKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const TABLE = 'dre_hitss';
const OUTPUT_FILE = 'dre_hitss_rows.sql';

/**
 * Escapes single quotes for SQL.
 * e.g. "It's me" -> "It''s me"
 */
function sqlEscape(str) {
    if (str === null || str === undefined) return 'NULL';
    if (typeof str === 'number') return str;
    if (typeof str === 'boolean') return str ? 'TRUE' : 'FALSE';

    // Replace single quote with two single quotes
    return "'" + String(str).replace(/'/g, "''") + "'";
}

async function exportToSQL() {
    console.log(`Starting export of ${TABLE} to ${OUTPUT_FILE}...`);

    // Clear file initially
    fs.writeFileSync(OUTPUT_FILE, `-- Data dump for ${TABLE}\n-- Generated via API\n\n`);

    let page = 0;
    const pageSize = 1000;
    let totalRows = 0;
    let hasMore = true;

    while (hasMore) {
        const from = page * pageSize;
        const to = from + pageSize - 1;

        console.log(`Fetching rows ${from} to ${to}...`);

        const { data: rows, error } = await sourceSupabase
            .from(TABLE)
            .select('*')
            .range(from, to)
            .order('id', { ascending: true });

        if (error) {
            console.error('❌ Error fetching data:', error);
            break;
        }

        if (!rows || rows.length === 0) {
            hasMore = false;
            break;
        }

        const statements = rows.map(row => {
            // Columns based on schema
            // custom order validation not needed if we use explicit columns in INSERT, 
            // but simpler to standard row keys if they match.
            // Ideally explicitly list cols to match the target schema.
            // DRE HITSS columns: id, execution_id, conta, descricao, valor, tipo, periodo, empresa, created_at

            const values = [
                // sqlEscape(row.id), // Let's omit ID if we want auto-increment, BUT user wants dump, usually preserves ID.
                // If we preserve ID, we must execute SET_VAL sequence later. 
                // Let's include ID for exact clone.
                sqlEscape(row.id),
                sqlEscape(row.execution_id),
                sqlEscape(row.conta),
                sqlEscape(row.descricao),
                sqlEscape(row.valor),
                sqlEscape(row.tipo),
                sqlEscape(row.periodo),
                sqlEscape(row.empresa),
                sqlEscape(row.created_at)
            ];

            return `INSERT INTO public.dre_hitss (id, execution_id, conta, descricao, valor, tipo, periodo, empresa, created_at) VALUES (${values.join(', ')}) ON CONFLICT (id) DO NOTHING;`;
        });

        fs.appendFileSync(OUTPUT_FILE, statements.join('\n') + '\n');
        totalRows += rows.length;
        console.log(`Processed ${rows.length} rows.`);

        page++;
        if (rows.length < pageSize) hasMore = false;
    }

    // Append sequence reset if needed
    if (totalRows > 0) {
        fs.appendFileSync(OUTPUT_FILE, `\n-- Reset sequence\nSELECT setval('public.dre_hitss_id_seq', (SELECT MAX(id) FROM public.dre_hitss));\n`);
    }

    console.log(`✅ Export complete! Total rows: ${totalRows}`);
}

exportToSQL();
