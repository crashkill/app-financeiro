const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const https = require('https');
require('dotenv').config();

// Desabilitar verificação SSL para conexões HTTPS
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Agente HTTPS para ignorar certificados SSL
const agent = new https.Agent({
  rejectUnauthorized: false
});

// Função para buscar segredos do Vault
async function getVaultSecret(name) {
  try {
    const { data, error } = await supabase.rpc('get_secret', { secret_name: name });
    
    if (error) {
      throw new Error(`Erro ao buscar segredo ${name}: ${error.message}`);
    }
    
    return data;
  } catch (error) {
    console.error(`❌ Erro ao buscar segredo ${name}:`, error.message);
    throw error;
  }
}

async function getSecret(supabase, secretName) {
    try {
        const { data, error } = await supabase.rpc('get_secret', {
            secret_name: secretName
        });

        if (error) {
            throw new Error(`Erro ao recuperar segredo do Vault: ${error.message}`);
        }

        return data;
    } catch (error) {
        console.error(`Erro no getSecret para '${secretName}':`, error);
        throw error;
    }
}

async function main() {
    try {
        // Inicializa o cliente Supabase com a service_role_key
        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl || !supabaseKey) {
            console.error('As variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_SERVICE_ROLE_KEY são necessárias.');
            return;
        }
        const supabase = createClient(supabaseUrl, supabaseKey);

        const bucketName = 'dre_reports';
        const fileName = 'hitss-data-test.xlsx';
        const filePath = `c:/Users/fabricio.lima/OneDrive - HITSS DO BRASIL SERVIÇOS TECNOLOGICOS LTDA/Área de Trabalho - Antiga/Projetos React/app-financeiro/${fileName}`;

        // Garante que o bucket existe
        const { data: bucket, error: bucketError } = await supabase.storage.getBucket(bucketName);
        if (bucketError && bucketError.message === 'Bucket not found') {
            console.log(`Bucket '${bucketName}' não encontrado. Criando...`);
            const { data: newBucket, error: createError } = await supabase.storage.createBucket(bucketName, { public: false });
            if (createError) throw createError;
            console.log(`Bucket '${newBucket.name}' criado com sucesso.`);
        } else if (bucketError) {
            throw bucketError;
        }

        // Lógica de download
        const downloadUrl = await getSecret(supabase, 'HITSS_DOWNLOAD_URL');
        if (!downloadUrl) {
            console.error('URL de download não encontrada no Vault.');
            return;
        }

        console.log('Baixando arquivo de', downloadUrl);
        const response = await axios.get(downloadUrl, {
            responseType: 'arraybuffer',
            httpsAgent: new (require('https')).Agent({ rejectUnauthorized: false })
        });

        fs.writeFileSync(filePath, response.data);
        console.log(`Arquivo salvo em ${filePath}`);

        // Lógica de upload
        const fileBuffer = fs.readFileSync(filePath);
        console.log(`Fazendo upload do arquivo para o bucket: ${bucketName}`);

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(fileName, fileBuffer, {
                cacheControl: '3600',
                upsert: true,
                contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });

        if (uploadError) throw uploadError;

        console.log('Upload concluído com sucesso:', uploadData);

    } catch (error) {
        console.error('Ocorreu um erro no processo:', error.message);
    }
}

main();