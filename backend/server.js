const express = require('express');
const cors = require('cors');
const HITSSRobot = require('./hitss-robot');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Middleware de autenticação simples
const authenticateRequest = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const expectedKey = process.env.BACKEND_API_KEY || 'hitss-robot-key';
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false, 
      error: 'Token de autorização necessário' 
    });
  }
  
  const token = authHeader.substring(7);
  if (token !== expectedKey) {
    return res.status(401).json({ 
      success: false, 
      error: 'Token de autorização inválido' 
    });
  }
  
  next();
};

// Rota de health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'HITSS Robot Backend',
    timestamp: new Date().toISOString()
  });
});

// Rota para executar o robô HITSS
app.post('/api/hitss-robot/execute', authenticateRequest, async (req, res) => {
  console.log('🚀 Recebida solicitação para executar robô HITSS');
  console.log('📝 Dados da requisição:', req.body);
  
  try {
    // Criar instância do robô
    const robot = new HITSSRobot();
    
    // Executar robô
    const result = await robot.run();
    
    // Retornar resultado
    res.json(result);
    
  } catch (error) {
    console.error('❌ Erro ao executar robô:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Erro interno do servidor ao executar robô'
    });
  }
});

// Rota para verificar status de execução
app.get('/api/hitss-robot/status/:executionId', authenticateRequest, async (req, res) => {
  const { executionId } = req.params;
  
  try {
    const { createClient } = require('@supabase/supabase-js');
    
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data, error } = await supabase
      .from('automation_executions')
      .select('*')
      .eq('id', executionId)
      .single();
    
    if (error) {
      throw error;
    }
    
    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Execução não encontrada'
      });
    }
    
    res.json({
      success: true,
      execution: data
    });
    
  } catch (error) {
    console.error('❌ Erro ao verificar status:', error);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Rota para listar execuções recentes
app.get('/api/hitss-robot/executions', authenticateRequest, async (req, res) => {
  try {
    const { createClient } = require('@supabase/supabase-js');
    
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data, error } = await supabase
      .from('automation_executions')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(20);
    
    if (error) {
      throw error;
    }
    
    res.json({
      success: true,
      executions: data || []
    });
    
  } catch (error) {
    console.error('❌ Erro ao listar execuções:', error);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Middleware de tratamento de erros
app.use((error, req, res, next) => {
  console.error('💥 Erro não tratado:', error);
  
  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor',
    message: error.message
  });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Rota não encontrada',
    path: req.originalUrl
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('🚀 Servidor HITSS Robot Backend iniciado');
  console.log(`📡 Porta: ${PORT}`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/health`);
  console.log(`🤖 Robot Endpoint: http://localhost:${PORT}/api/hitss-robot/execute`);
  console.log('=' .repeat(50));
});

module.exports = app;