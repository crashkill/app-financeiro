-- Migração para configurar webhook de storage para upload de DRE (Produção)
-- Esta migração cria um trigger que aciona a Edge Function quando arquivos são adicionados ao bucket dre_reports

-- Criar função que será chamada pelo trigger
CREATE OR REPLACE FUNCTION process_dre_upload_webhook()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar se o arquivo foi inserido no bucket dre_reports
  IF NEW.bucket_id = 'dre_reports' THEN
    -- Chamar a Edge Function process-dre-upload
    PERFORM
      net.http_post(
        url := 'https://oomhhhfahdvavnhlbioa.supabase.co/functions/v1/process-dre-upload',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := jsonb_build_object(
          'bucket_id', NEW.bucket_id,
          'object_name', NEW.name,
          'object_id', NEW.id,
          'metadata', NEW.metadata
        )
      );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger na tabela storage.objects
DROP TRIGGER IF EXISTS process_dre_upload_webhook ON storage.objects;
CREATE TRIGGER process_dre_upload_webhook
  AFTER INSERT ON storage.objects
  FOR EACH ROW
  EXECUTE FUNCTION process_dre_upload_webhook();

-- Comentário documentando o trigger
COMMENT ON TRIGGER process_dre_upload_webhook ON storage.objects IS 
'Trigger que aciona a Edge Function process-dre-upload quando arquivos são adicionados ao bucket dre_reports';