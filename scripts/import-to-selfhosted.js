/**
 * Import Data to Self-Hosted Supabase
 * 
 * This script imports data from the Cloud export to the
 * Imperial self-hosted Supabase instance.
 * 
 * Usage: node scripts/import-to-selfhosted.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Self-hosted Supabase credentials (destination)
// Using SERVICE_ROLE_KEY for write access (bypasses RLS)
const SELFHOSTED_URL = 'https://supabase.fsw-hitss.duckdns.org';
const SELFHOSTED_SERVICE_ROLE_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2NTUzNjMwMCwiZXhwIjo0OTIxMjA5OTAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.W3COShRbLKzYGkIPNN3kDvlhRpXQPA4TmrP05Yrp82g';

// Initialize Supabase client with service role key (bypasses RLS)
const supabase = createClient(SELFHOSTED_URL, SELFHOSTED_SERVICE_ROLE_KEY);

// Import directory
const IMPORT_DIR = path.join(__dirname, '..', 'migration-data');

/**
 * Calculate SHA-256 hash of data
 */
function calculateHash(data) {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

/**
 * Import a single table
 */
async function importTable(tableName, expectedHash) {
    console.log(`📥 Importing table: ${tableName}...`);

    try {
        // Read exported data
        const filePath = path.join(IMPORT_DIR, `${tableName}.json`);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(fileContent);

        // Verify hash
        const actualHash = calculateHash(data);
        if (expectedHash && actualHash !== expectedHash) {
            console.warn(`⚠️  Hash mismatch for ${tableName}! Expected: ${expectedHash.substring(0, 8)}..., Got: ${actualHash.substring(0, 8)}...`);
        }

        if (data.length === 0) {
            console.log(`ℹ️  Table ${tableName} is empty, skipping...`);
            return { tableName, success: true, rowCount: 0, skipped: true };
        }

        // Import in batches (Supabase has limits)
        const BATCH_SIZE = 1000;
        let imported = 0;

        for (let i = 0; i < data.length; i += BATCH_SIZE) {
            const batch = data.slice(i, i + BATCH_SIZE);

            const { error } = await supabase
                .from(tableName)
                .upsert(batch, { onConflict: 'id' }); // Adjust conflict column as needed

            if (error) {
                console.error(`❌ Error importing batch ${i / BATCH_SIZE + 1} of ${tableName}:`, error.message);
                return {
                    tableName,
                    success: false,
                    error: error.message,
                    rowCount: imported,
                    partialImport: true
                };
            }

            imported += batch.length;
            console.log(`   Progress: ${imported}/${data.length} rows`);
        }

        console.log(`✅ Imported ${tableName}: ${imported} rows`);
        return { tableName, success: true, rowCount: imported };
    } catch (err) {
        console.error(`❌ Exception importing ${tableName}:`, err.message);
        return { tableName, success: false, error: err.message, rowCount: 0 };
    }
}

/**
 * Verify imported data
 */
async function verifyImport(tableName, expectedCount) {
    try {
        const { count, error } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error(`❌ Verification failed for ${tableName}:`, error.message);
            return { tableName, verified: false, error: error.message };
        }

        const match = count === expectedCount;
        if (match) {
            console.log(`✅ Verified ${tableName}: ${count} rows`);
        } else {
            console.warn(`⚠️  Count mismatch for ${tableName}! Expected: ${expectedCount}, Got: ${count}`);
        }

        return { tableName, verified: match, expectedCount, actualCount: count };
    } catch (err) {
        console.error(`❌ Exception verifying ${tableName}:`, err.message);
        return { tableName, verified: false, error: err.message };
    }
}

/**
 * Main import function
 */
async function main() {
    console.log('🚀 Starting Self-Hosted Supabase Data Import');
    console.log('='.repeat(60));
    console.log(`Destination: ${SELFHOSTED_URL}`);
    console.log(`Import Directory: ${IMPORT_DIR}`);
    console.log('='.repeat(60));

    // Read manifest
    let manifest;
    try {
        const manifestPath = path.join(IMPORT_DIR, 'manifest.json');
        const manifestContent = await fs.readFile(manifestPath, 'utf-8');
        manifest = JSON.parse(manifestContent);
        console.log(`✅ Loaded manifest from ${manifest.exportDate}\n`);
    } catch (err) {
        console.error('❌ Failed to read manifest:', err.message);
        console.error('Run export-cloud-data.js first!');
        process.exit(1);
    }

    // Import all tables
    const importResults = [];
    for (const tableInfo of manifest.tables) {
        if (!tableInfo.success) {
            console.log(`⏭️  Skipping ${tableInfo.tableName} (export failed)\n`);
            continue;
        }

        const result = await importTable(tableInfo.tableName, tableInfo.hash);
        importResults.push(result);
        console.log('');
    }

    // Verify imports
    console.log('🔍 Verifying imported data...\n');
    const verificationResults = [];
    for (const result of importResults) {
        if (result.success && !result.skipped) {
            const verification = await verifyImport(result.tableName, result.rowCount);
            verificationResults.push(verification);
        }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Import Summary');
    console.log('='.repeat(60));
    console.log(`Total Tables: ${manifest.tables.length}`);
    console.log(`✅ Imported: ${importResults.filter(r => r.success).length}`);
    console.log(`❌ Failed: ${importResults.filter(r => !r.success).length}`);
    console.log(`⏭️  Skipped: ${importResults.filter(r => r.skipped).length}`);
    console.log(`📦 Total Rows: ${importResults.reduce((sum, r) => sum + (r.rowCount || 0), 0)}`);
    console.log('');
    console.log('Verification:');
    console.log(`✅ Verified: ${verificationResults.filter(v => v.verified).length}`);
    console.log(`⚠️  Mismatches: ${verificationResults.filter(v => !v.verified).length}`);
    console.log('='.repeat(60));

    if (importResults.some(r => !r.success)) {
        console.log('\n⚠️  Some tables failed to import:');
        importResults.filter(r => !r.success).forEach(r => {
            console.log(`   - ${r.tableName}: ${r.error}`);
        });
    }

    if (verificationResults.some(v => !v.verified)) {
        console.log('\n⚠️  Some tables have count mismatches:');
        verificationResults.filter(v => !v.verified).forEach(v => {
            console.log(`   - ${v.tableName}: Expected ${v.expectedCount}, Got ${v.actualCount}`);
        });
    }

    const allSuccess = importResults.every(r => r.success || r.skipped) &&
        verificationResults.every(v => v.verified);

    if (allSuccess) {
        console.log('\n✅ Import completed successfully!');
        console.log('Next step: Update application configuration and deploy to Coolify');
    } else {
        console.log('\n⚠️  Import completed with warnings. Review the issues above.');
    }
}

// Run import
main().catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
});
