/**
 * Servidor Express para autenticação Azure AD
 * Integrado ao app-financeiro
 * 
 * Este servidor roda em HTTPS na porta 3000 e gerencia:
 * - Login via Azure AD
 * - Callback de autenticação (/getAToken)
 * - Sessão do usuário
 * - Redirecionamento para o app React após autenticação
 */

const express = require('express');
const https = require('https');
const fs = require('fs');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const authController = require('./controllers/authController');

const app = express();

// View Engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middleware
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// CORS para permitir requisições do Vite (porta 5173 ou 3001)
app.use(cors({
    origin: ['https://localhost:5173', 'http://localhost:5173', 'https://localhost:3001', 'http://localhost:3001'],
    credentials: true
}));

// Session
app.use(session({
    secret: process.env.EXPRESS_SESSION_SECRET || 'hitss-imperial-secret-2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true, // HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
}));

// ========================================
// ROTAS DE AUTENTICAÇÃO
// ========================================

// Página de login (renderiza o formulário)
app.get('/login', (req, res) => {
    res.render('login-simple');
});

// Rota alternativa para o formulário original
app.get('/login-original', (req, res) => {
    res.render('login', { showLoginButton: true });
});

// Processar login (recebe email do formulário e redireciona para Azure AD)
app.all('/auth/signin', authController.signIn);

// Callback do Azure AD (recebe o código de autorização)
app.post('/getAToken', authController.handleRedirect);

// Logout
app.get('/auth/signout', authController.signOut);

// ========================================
// ROTAS DE VERIFICAÇÃO DE SESSÃO
// ========================================

// Verificar se usuário está autenticado (API para o React)
app.get('/api/auth/session', (req, res) => {
    if (req.session.isAuthenticated && req.session.user) {
        res.json({
            authenticated: true,
            user: req.session.user,
            accessToken: req.session.accessToken
        });
    } else {
        res.json({ authenticated: false });
    }
});

// Obter dados do usuário autenticado
app.get('/api/auth/user', (req, res) => {
    if (req.session.isAuthenticated && req.session.user) {
        res.json(req.session.user);
    } else {
        res.status(401).json({ error: 'Não autenticado' });
    }
});

// ========================================
// PÁGINA INICIAL (após login bem-sucedido)
// ========================================

app.get('/', (req, res) => {
    if (req.session.isAuthenticated) {
        // Usuário autenticado - redirecionar para o app React
        // O Vite roda na porta 5173 ou 3001
        const reactAppUrl = process.env.REACT_APP_URL || 'https://localhost:5173';
        res.redirect(`${reactAppUrl}/dashboard`);
    } else {
        // Não autenticado - mostra página inicial ou redireciona para login
        res.render('index', {
            isAuthenticated: false,
            user: null
        });
    }
});

// ========================================
// INICIALIZAÇÃO DO SERVIDOR HTTPS
// ========================================

const PORT = process.env.AUTH_SERVER_PORT || 3000;

const certPath = path.join(__dirname, '..', 'src', 'certs', 'server.cert');
const keyPath = path.join(__dirname, '..', 'src', 'certs', 'server.key');

console.log('[AUTH-SERVER] Verificando certificados SSL...');
console.log('[AUTH-SERVER] Cert path:', certPath);
console.log('[AUTH-SERVER] Key path:', keyPath);

if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    const httpsOptions = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath)
    };

    https.createServer(httpsOptions, app).listen(PORT, () => {
        console.log('='.repeat(60));
        console.log('🔐 SERVIDOR DE AUTENTICAÇÃO AZURE AD');
        console.log('='.repeat(60));
        console.log(`✅ Rodando em: https://localhost:${PORT}`);
        console.log(`📝 Login: https://localhost:${PORT}/login`);
        console.log(`🔑 Callback Azure: https://localhost:${PORT}/getAToken`);
        console.log(`📊 API Session: https://localhost:${PORT}/api/auth/session`);
        console.log('='.repeat(60));
        console.log('⚠️  Certifique-se de que o React app está rodando na porta 5173');
        console.log('='.repeat(60));
    });
} else {
    console.error('[AUTH-SERVER] ❌ Certificados SSL não encontrados!');
    console.error('[AUTH-SERVER] Esperado em:', certPath);
    console.error('[AUTH-SERVER] Execute o script para gerar certificados.');
    process.exit(1);
}
