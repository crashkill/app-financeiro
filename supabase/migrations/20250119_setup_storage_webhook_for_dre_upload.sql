-- Migration: Setup Storage Webhook for DRE Upload Processing
-- Description: Creates a webhook trigger on storage.objects table to automatically
-- process DRE files when uploaded to the dre_reports bucket

-- Create the webhook trigger that will call our Edge Function
-- when a new file is inserted into the storage.objects table
CREATE OR REPLACE TRIGGER "process_dre_upload_webhook" 
AFTER INSERT ON "storage"."objects" 
FOR EACH ROW 
WHEN (NEW.bucket_id = 'dre_reports')
EXECUTE FUNCTION "supabase_functions"."http_request"(
  'http://host.docker.internal:54321/functions/v1/process-dre-upload',
  'POST',
  '{"Content-Type":"application/json"}',
  '{}',
  '5000'
);

-- Add a comment to document the trigger
COMMENT ON TRIGGER "process_dre_upload_webhook" ON "storage"."objects" IS 
'Webhook trigger that calls the process-dre-upload Edge Function when files are uploaded to the dre_reports bucket';