import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, User, Lock, LogIn } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { runFullDebug, debugAuth, testSupabaseConnectivity } from '../lib/debug-supabase'
import '../styles/login.css'

const Login = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [validationErrors, setValidationErrors] = useState<{email?: string; password?: string}>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  // Ref para evitar múltiplas execuções do debug
  const debugExecutedRef = useRef(false)

  // Debug completo na inicialização do componente (apenas uma vez)
  useEffect(() => {
    const runDebugOnMount = async () => {
      // Evitar múltiplas execuções devido ao React.StrictMode
      if (debugExecutedRef.current) {
        console.log('[LOGIN-COMPONENT] Debug já executado, pulando execução duplicada');
        return;
      }
      
      debugExecutedRef.current = true;
      console.log('[LOGIN-COMPONENT] Componente de login montado');
      
      try {
        // Executar debug completo apenas em produção (Vercel)
        const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
        
        if (isProduction) {
          console.log('[LOGIN-COMPONENT] Ambiente de produção detectado, executando debug completo');
          await runFullDebug();
        } else {
          console.log('[LOGIN-COMPONENT] Ambiente local detectado, executando teste básico de conectividade');
          await testSupabaseConnectivity();
        }
      } catch (error) {
        console.error('[LOGIN-COMPONENT] Erro durante inicialização do debug:', error);
      }
    };

    runDebugOnMount();
  }, []);

  const validateForm = () => {
    const errors: {email?: string; password?: string} = {}
    if (!email) errors.email = 'E-mail é obrigatório'
    // else if (!/\S+@\S+\.\S+/.test(email)) errors.email = 'E-mail inválido' // Temporariamente comentado
    if (!password) errors.password = 'Senha é obrigatória'
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    
    const timestamp = new Date().toISOString();
    const environment = window.location.hostname;
    
    console.log(`[LOGIN-SUBMIT ${timestamp}] [${environment}] Iniciando processo de login`, {
      email,
      hasPassword: !!password,
      passwordLength: password.length
    });
    
    setIsLoading(true)
    setError('')

    try {
      // Debug antes do login (apenas se necessário)
      console.log('[LOGIN-SUBMIT] Executando debug de auth antes do login');
      await debugAuth(email);
      
      console.log('[LOGIN-SUBMIT] Chamando função de login do contexto');
      await login(email, password)
      
      console.log('[LOGIN-SUBMIT] Login bem-sucedido, redirecionando para dashboard');
      navigate('/dashboard')
    } catch (err) {
      console.error('[LOGIN-SUBMIT] Erro durante o login:', err);
      
      // Debug detalhado do erro
      if (err instanceof Error) {
        console.error('[LOGIN-SUBMIT] Detalhes do erro:', {
          message: err.message,
          name: err.name,
          stack: err.stack
        });
      }
      
      // Executar debug adicional em caso de erro (com tratamento de erro)
      try {
        console.log('[LOGIN-SUBMIT] Executando debug adicional após erro');
        await debugAuth(email);
      } catch (debugError) {
        console.error('[LOGIN-SUBMIT] Erro durante debug adicional:', debugError);
      }
      
      setError('Email ou senha inválidos')
    } finally {
      setIsLoading(false)
      console.log(`[LOGIN-SUBMIT] Processo de login finalizado em ${new Date().toISOString()}`);
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Sistema Financeiro</h1>
        <p className="login-subtitle">Faça login para acessar sua conta</p>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <User className="input-icon" size={20} />
            <input
              type="text"
              className="form-input"
              placeholder="Digite seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-label="E-mail"
            />
            {validationErrors.email && (
              <div className="validation-error">{validationErrors.email}</div>
            )}
          </div>

          <div className="form-group">
            <Lock className="input-icon" size={20} />
            <input
              type={showPassword ? "text" : "password"}
              className="form-input"
              placeholder="Digite sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-label="Senha"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
            {validationErrors.password && (
              <div className="validation-error">{validationErrors.password}</div>
            )}
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={isLoading}
          >
            <div className="button-content">
              {isLoading && <div className="loading-spinner"></div>}
              <LogIn size={20} style={{ marginRight: '0.5rem' }} />
              {isLoading ? 'Entrando...' : 'Entrar'}
            </div>
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login
