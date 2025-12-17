/**
 * Export Data from Supabase Cloud
 * 
 * This script exports all data from the Supabase Cloud instance
 * for migration to the self-hosted Imperial Supabase.
 * 
 * Usage: node scripts/export-cloud-data.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Supabase Cloud credentials (source)
const CLOUD_URL = 'https://oomhhhfahdvavnhlbioa.supabase.co';
const CLOUD_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MDI2NzEsImV4cCI6MjA3MjA3ODY3MX0.VCD-Ei4eHS_AO9L2jGL2lb9Rqv3d6O0B9rqN0HRHab8';

// Initialize Supabase client
const supabase = createClient(CLOUD_URL, CLOUD_ANON_KEY);

// Export directory
const EXPORT_DIR = path.join(__dirname, '..', 'migration-data');

// Tables to export (add all your tables here)
const TABLES_TO_EXPORT = [
    'dre_hitss',
    'dim_tempo',
    'dim_cliente',
    'dim_conta',
    'dim_projeto',
    'dim_natureza',
    'dim_tipo',
    'fato_dre',
    'dre_execution_logs',
    'stg_dre_hitss_raw',
    // Add other tables as needed
];

/**
 * Calculate SHA-256 hash of data
 */
function calculateHash(data) {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

/**
 * Export a single table
 */
async function exportTable(tableName) {
    console.log(`📊 Exporting table: ${tableName}...`);

    try {
        const { data, error, count } = await supabase
            .from(tableName)
            .select('*', { count: 'exact' });

        if (error) {
            console.error(`❌ Error exporting ${tableName}:`, error.message);
            return { tableName, success: false, error: error.message, rowCount: 0 };
        }

        // Save to file
        const filePath = path.join(EXPORT_DIR, `${tableName}.json`);
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));

        const hash = calculateHash(data);
        console.log(`✅ Exported ${tableName}: ${count || data.length} rows (hash: ${hash.substring(0, 8)}...)`);

        return {
            tableName,
            success: true,
            rowCount: count || data.length,
            hash,
            filePath
        };
    } catch (err) {
        console.error(`❌ Exception exporting ${tableName}:`, err.message);
        return { tableName, success: false, error: err.message, rowCount: 0 };
    }
}

/**
 * Export database schema
 */
async function exportSchema() {
    console.log('📋 Exporting database schema...');

    try {
        // Note: This requires service_role key for full schema access
        // For now, we'll export table structures based on data
        const schemaInfo = {};

        for (const table of TABLES_TO_EXPORT) {
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .limit(1);

            if (!error && data && data.length > 0) {
                schemaInfo[table] = Object.keys(data[0]);
            }
        }

        const schemaPath = path.join(EXPORT_DIR, 'schema-info.json');
        await fs.writeFile(schemaPath, JSON.stringify(schemaInfo, null, 2));

        console.log('✅ Schema info exported');
        return { success: true, schemaPath };
    } catch (err) {
        console.error('❌ Error exporting schema:', err.message);
        return { success: false, error: err.message };
    }
}

/**
 * Main export function
 */
async function main() {
    console.log('🚀 Starting Supabase Cloud Data Export');
    console.log('='.repeat(60));
    console.log(`Source: ${CLOUD_URL}`);
    console.log(`Export Directory: ${EXPORT_DIR}`);
    console.log('='.repeat(60));

    // Create export directory
    try {
        await fs.mkdir(EXPORT_DIR, { recursive: true });
        console.log(`✅ Export directory created: ${EXPORT_DIR}\n`);
    } catch (err) {
        console.error('❌ Failed to create export directory:', err.message);
        process.exit(1);
    }

    // Export schema
    const schemaResult = await exportSchema();
    console.log('');

    // Export all tables
    const results = [];
    for (const table of TABLES_TO_EXPORT) {
        const result = await exportTable(table);
        results.push(result);
    }

    // Generate manifest
    const manifest = {
        exportDate: new Date().toISOString(),
        sourceUrl: CLOUD_URL,
        tables: results,
        schema: schemaResult,
        totalRows: results.reduce((sum, r) => sum + (r.rowCount || 0), 0),
        successCount: results.filter(r => r.success).length,
        failureCount: results.filter(r => !r.success).length
    };

    const manifestPath = path.join(EXPORT_DIR, 'manifest.json');
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Export Summary');
    console.log('='.repeat(60));
    console.log(`Total Tables: ${TABLES_TO_EXPORT.length}`);
    console.log(`✅ Successful: ${manifest.successCount}`);
    console.log(`❌ Failed: ${manifest.failureCount}`);
    console.log(`📦 Total Rows: ${manifest.totalRows}`);
    console.log(`📁 Manifest: ${manifestPath}`);
    console.log('='.repeat(60));

    if (manifest.failureCount > 0) {
        console.log('\n⚠️  Some tables failed to export:');
        results.filter(r => !r.success).forEach(r => {
            console.log(`   - ${r.tableName}: ${r.error}`);
        });
    }

    console.log('\n✅ Export completed successfully!');
    console.log('Next step: Run import-to-selfhosted.js');
}

// Run export
main().catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
});
