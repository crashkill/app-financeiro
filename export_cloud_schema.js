const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Cloud Supabase (Source)
const cloudSupabase = createClient(
  'https://oomhhhfahdvavnhlbioa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUwMjY3MSwiZXhwIjoyMDcyMDc4NjcxfQ.PTWwysas7_MjsOwUlWH7CCy3lEtoMAm9iYRjVWutd8E',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function exportSchema() {
  console.log('🔍 Discovering schema from Cloud Supabase...\n');

  // Get all tables from information_schema
  const { data: tables, error: tablesError } = await cloudSupabase
    .from('information_schema.tables')
    .select('table_name, table_schema')
    .eq('table_schema', 'public')
    .neq('table_name', 'schema_migrations');

  if (tablesError) {
    console.error('❌ Error fetching tables:', tablesError);
    return;
  }

  console.log(`✅ Found ${tables?.length || 0} tables:\n`);
  tables?.forEach(t => console.log(`  - ${t.table_name}`));

  // Get columns for each table
  const schemaInfo = {};
  
  for (const table of tables || []) {
    const { data: columns, error: colError } = await cloudSupabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_schema', 'public')
      .eq('table_name', table.table_name)
      .order('ordinal_position');

    if (!colError && columns) {
      schemaInfo[table.table_name] = columns;
    }
  }

  // Save schema info to JSON
  fs.writeFileSync(
    'cloud_schema_info.json',
    JSON.stringify(schemaInfo, null, 2),
    'utf8'
  );

  console.log('\n✅ Schema info saved to cloud_schema_info.json');
  console.log('\n📋 Tables found:');
  Object.keys(schemaInfo).forEach(tableName => {
    console.log(`\n${tableName}:`);
    schemaInfo[tableName].forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}${col.is_nullable === 'NO' ? ' NOT NULL' : ''}`);
    });
  });

  return Object.keys(schemaInfo);
}

async function exportTableCounts(tableNames) {
  console.log('\n\n📊 Getting row counts...\n');
  
  const counts = {};
  for (const tableName of tableNames) {
    try {
      const { count, error } = await cloudSupabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (!error) {
        counts[tableName] = count;
        console.log(`  ${tableName}: ${count} rows`);
      }
    } catch (e) {
      console.log(`  ${tableName}: Error getting count`);
    }
  }

  fs.writeFileSync(
    'cloud_table_counts.json',
    JSON.stringify(counts, null, 2),
    'utf8'
  );

  console.log('\n✅ Table counts saved to cloud_table_counts.json');
  return counts;
}

async function main() {
  const tableNames = await exportSchema();
  if (tableNames) {
    await exportTableCounts(tableNames);
  }
  
  console.log('\n\n🎉 Schema export complete!');
  console.log('\nNext steps:');
  console.log('1. Review cloud_schema_info.json');
  console.log('2. Export data for each table');
  console.log('3. Apply schema to self-hosted');
  console.log('4. Import data to self-hosted');
}

main();
