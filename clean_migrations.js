const fs = require('fs');
const path = require('path');

const migrationsDir = './supabase/migrations';
const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));

files.forEach(file => {
    const filePath = path.join(migrationsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Remove INSERT INTO schema_migrations lines
    content = content.replace(/-- Log da migração\s*\nINSERT INTO public\.schema_migrations[^;]+;/g, '-- Log da migração (removed schema_migrations)');

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Cleaned: ${file}`);
});

console.log('✅ All migrations cleaned!');
