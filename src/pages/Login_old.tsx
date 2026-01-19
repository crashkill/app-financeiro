import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { runFullDebug, debugAuth, testSupabaseConnectivity } from '../lib/debug-supabase'
import '../styles/login.css'

const Login = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [validationErrors, setValidationErrors] = useState<{ email?: string; password?: string }>({})
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
    const errors: { email?: string; password?: string } = {}
    if (!email) errors.email = 'E-mail é obrigatório'
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
    <div className="login-page">
      {/* Background Orbs */}
      <div className="background-orbs">
        {/* Red Orb Top Right */}
        <div className="orb orb-red-top"></div>
        {/* Blue Orb Bottom Left */}
        <div className="orb orb-blue-bottom"></div>
        {/* Small Red Orb */}
        <div className="orb orb-red-small"></div>
      </div>

      {/* Login Card */}
      <div className="login-card">
        {/* Logo */}
        <div className="logo-section">
          <h1 className="logo-text">
            <span className="logo-global">Global</span>
            <span className="logo-hitss">hitss</span>
          </h1>
          <p className="logo-subtitle">Autenticação Corporativa</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-alert">
            <svg className="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          {/* Email Field */}
          <div className="form-field">
            <label htmlFor="username" className="field-label">
              E-mail Corporativo
            </label>
            <input
              type="email"
              name="username"
              id="username"
              required
              autoComplete="email"
              className={`field-input ${validationErrors.email ? 'input-error' : ''}`}
              placeholder="nome@globalhitss.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {validationErrors.email && (
              <span className="validation-error">{validationErrors.email}</span>
            )}
          </div>

          {/* Password Field */}
          <div className="form-field">
            <label htmlFor="password" className="field-label">
              Senha
            </label>
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                id="password"
                required
                autoComplete="current-password"
                className={`field-input ${validationErrors.password ? 'input-error' : ''}`}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {validationErrors.password && (
              <span className="validation-error">{validationErrors.password}</span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="submit-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="loading-spinner"></span>
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="divider">
          <div className="divider-line"></div>
          <span className="divider-text">SEGURANÇA</span>
          <div className="divider-line"></div>
        </div>

        {/* Security Notice */}
        <div className="security-notice">
          <p className="notice-text">
            Ao clicar em <strong>Entrar</strong>, você será redirecionado para validação
            via <span className="mfa-highlight">Microsoft Authenticator</span> (MFA).
          </p>
          <p className="notice-subtext">
            Protegido por Azure Active Directory
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="login-footer">
        <p>&copy; 2026 Globalhitss. Divisão de Tecnologia Imperial.</p>
      </footer>
    </div>
  )
}

export default Login
