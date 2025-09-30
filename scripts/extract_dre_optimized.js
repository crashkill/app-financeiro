  async step2_DownloadHITSSFile() {
    console.log('\n📋 ETAPA 2: Download do arquivo HITSS');
    await this.log('DOWNLOAD_HITSS', 'INICIADO', 'Baixando arquivo de dados da HITSS');

    const maxRetries = 3;
    const timeoutMs = 420000; // 7 minutos
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Tentativa ${attempt}/${maxRetries} de download...`);

        // Buscar URL de download do Vault
        console.log('🔐 Buscando URL de download do Vault...');
        const { data: downloadUrl, error: vaultError } = await supabase.rpc('get_secret', {
          secret_name: 'HITSS_DOWNLOAD_URL'
        });

        if (vaultError || !downloadUrl) {
          throw new Error(`Erro ao buscar URL do Vault: ${vaultError?.message || 'URL não encontrada'}`);
        }

        console.log('✅ URL obtida do Vault com sucesso');

        // Configurações otimizadas para download lento
        const downloadConfig = {
          timeout: timeoutMs,
          maxRedirects: 5,
          responseType: 'arraybuffer',
          headers: {
            'User-Agent': 'DRE-Automation/1.0',
            'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/octet-stream',
            'Cache-Control': 'no-cache'
          },
          httpsAgent: new https.Agent({
            rejectUnauthorized: false,
            keepAlive: true,
            timeout: timeoutMs,
            // Configurações para conexões lentas
            maxSockets: 1,
            keepAliveMsecs: 30000,
            timeout: timeoutMs
          }),
          // Configurações de retry
          retry: {
            retries: 2,
            factor: 2,
            minTimeout: 10000,
            maxTimeout: 60000
          }
        };

        console.log('📥 Iniciando download...');
        console.log(`🔗 URL: ${downloadUrl}`);
        console.log(`⏱️ Timeout: ${timeoutMs/1000}s`);
        console.log(`🔄 Max redirects: ${downloadConfig.maxRedirects}`);

        // Progress tracking
        const startTime = Date.now();

        const response = await axios.get(downloadUrl, downloadConfig);

        const downloadTime = (Date.now() - startTime) / 1000;
        const fileSizeMB = (response.data.length / (1024 * 1024)).toFixed(2);

        console.log(`✅ Download concluído em ${downloadTime.toFixed(2)}s`);
        console.log(`📊 Tamanho do arquivo: ${fileSizeMB} MB`);
        console.log(`⚡ Velocidade média: ${(fileSizeMB / downloadTime * 8).toFixed(2)} Mbps`);

        const fileName = `dre_hitss_${Date.now()}.xlsx`;
        const tempDir = path.join(__dirname, 'temp');
        const filePath = path.join(tempDir, fileName);

        // Criar diretório temp se não existir
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
          console.log(`📁 Diretório temporário criado: ${tempDir}`);
        }

        // Salvar arquivo Excel
        fs.writeFileSync(filePath, response.data);

        // Verificar se o arquivo foi baixado corretamente
        const savedFileSize = fs.statSync(filePath).size;
        console.log(`💾 Arquivo salvo: ${fileName} (${(savedFileSize / (1024 * 1024)).toFixed(2)} MB)`);

        // Processar arquivo Excel
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const processedData = {
          empresa: 'HITSS DO BRASIL SERVIÇOS TECNOLÓGICOS LTDA',
          cnpj: '12.345.678/0001-90',
          periodo: new Date().toISOString().slice(0, 7),
          data_geracao: new Date().toISOString(),
          registros: jsonData.map((row, index) => ({
            Relatorio: row.Relatorio,
            Tipo: row.Tipo,
            Cliente: row.Cliente,
            LinhaNegocio: row.LinhaNegocio,
            ResponsavelArea: row.ResponsavelArea,
            ResponsavelDelivery: row.ResponsavelDelivery,
            ResponsavelDevengado: row.ResponsavelDevengado,
            IdHoms: row.IdHoms,
            CodigoProjeto: row.CodigoProjeto,
            Projeto: row.Projeto,
            FilialFaturamento: row.FilialFaturamento,
            Imposto: row.Imposto,
            ContaResumo: row.ContaResumo,
            DenominacaoConta: row.DenominacaoConta,
            IdRecurso: row.IdRecurso,
            Recurso: row.Recurso,
            Lancamento: row.Lancamento,
            Periodo: row.Periodo,
            Natureza: row.Natureza
          }))
        };

        await this.log('DOWNLOAD_HITSS', 'SUCESSO',
          `Download concluído: ${fileName} (${processedData.registros.length} registros, ${downloadTime.toFixed(2)}s, ${fileSizeMB}MB)`);

        this.results.download = {
          fileName,
          filePath,
          recordCount: processedData.registros.length,
          data: processedData,
          downloadTime,
          fileSizeMB
        };

        console.log(`✅ Download concluído: ${fileName}`);
        console.log(`📊 Registros baixados: ${processedData.registros.length}`);
        console.log(`🏢 Empresa: ${processedData.empresa}`);
        console.log(`📅 Período: ${processedData.periodo}`);
        console.log(`⚡ Performance: ${downloadTime.toFixed(2)}s para ${fileSizeMB}MB`);

        return true;

      } catch (error) {
        lastError = error;
        const isLastAttempt = attempt === maxRetries;

        console.log(`❌ Tentativa ${attempt} falhou: ${error.message}`);

        if (isLastAttempt) {
          await this.log('DOWNLOAD_HITSS', 'ERRO_FINAL',
            `Todas as ${maxRetries} tentativas falharam. Último erro: ${error.message}`);
          console.log(`💥 Falha crítica no download após ${maxRetries} tentativas`);
          break;
        } else {
          const backoffDelay = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
          console.log(`⏳ Aguardando ${backoffDelay/1000}s antes da próxima tentativa...`);
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
        }
      }
    }

    // Se chegou aqui, todas as tentativas falharam
    await this.log('DOWNLOAD_HITSS', 'ERRO', `Download falhou após ${maxRetries} tentativas: ${lastError.message}`);
    console.log(`❌ Erro no download: ${lastError.message}`);
    return false;
  }
