import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap'
import { useAuth } from '../contexts/AuthContext'

const Login = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [validationErrors, setValidationErrors] = useState<{email?: string; password?: string}>({})
  const [isLoading, setIsLoading] = useState(false)

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
    
    setIsLoading(true)
    setError('')

    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError('Email ou senha inválidos')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-gray-800">Bem-vindo ao Sistema Financeiro</h2>
          <p className="mt-2 text-sm text-gray-600">Por favor, faça login para continuar</p>
        </div>

        {error && (
          <Alert variant="danger" className="mb-4">
            {error}
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label htmlFor="email">E-mail</Form.Label>
            <Form.Control
              id="email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-label="E-mail"
              isInvalid={!!validationErrors.email}
            />
            <Form.Control.Feedback type="invalid">
              {validationErrors.email}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label htmlFor="password">Senha</Form.Label>
            <Form.Control
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-label="Senha"
              isInvalid={!!validationErrors.password}
            />
            <Form.Control.Feedback type="invalid">
              {validationErrors.password}
            </Form.Control.Feedback>
          </Form.Group>

          <Button
            type="submit"
            variant="primary"
            className="w-100"
            disabled={isLoading}
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </Button>
        </Form>
      </div>
    </div>
  )
}

export default Login
