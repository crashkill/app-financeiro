
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://oomhhhfahdvavnhlbioa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUwMjY3MSwiZXhwIjoyMDcyMDc4NjcxfQ.VCD-Ei4eHS_AO9L2jGL2lb9Rqv3d6O0B9rqN0HRHab8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
    console.log('Verifying Source Connection...');
    const { data, error } = await supabase
        .from('dre_hitss')
        .select('count', { count: 'exact', head: true });

    if (error) {
        console.error('Error connecting to Source:', error);
    } else {
        console.log('Successfully connected to Source. Row count (or access check):', data || 'OK');
    }

    // Also try to list buckets to be sure it's admin
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError) {
        console.error('Error listing buckets (Service Key check):', bucketError);
    } else {
        console.log('Successfully listed buckets:', buckets.length);
    }
}

verify();
