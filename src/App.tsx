import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Upload from './pages/Upload'
import Config from './pages/Config'
import Forecast from './pages/Forecast'
import PlanilhasFinanceiras from './pages/PlanilhasFinanceiras'
import Documentacao from './pages/Documentacao'
import GestaoProfissionais from './pages/GestaoProfissionais'
import ConsultaSAP from './pages/ConsultaSAP'
import Layout from './components/Layout'

// Componente para rotas protegidas
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth()
  return user ? <Layout>{children}</Layout> : <Navigate to="/login" />
}

function App() {
  const { user } = useAuth()

  return (
    <div data-testid="app-container">
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" /> : <Login />}
        />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/planilhas"
          element={
            <PrivateRoute>
              <PlanilhasFinanceiras />
            </PrivateRoute>
          }
        />
        <Route
          path="/forecast"
          element={
            <PrivateRoute>
              <Forecast />
            </PrivateRoute>
          }
        />
        <Route
          path="/gestao-profissionais"
          element={
            <PrivateRoute>
              <GestaoProfissionais />
            </PrivateRoute>
          }
        />
        <Route
          path="/upload"
          element={
            <PrivateRoute>
              <Upload />
            </PrivateRoute>
          }
        />
        <Route
          path="/documentacao"
          element={
            <PrivateRoute>
              <Documentacao />
            </PrivateRoute>
          }
        />
        <Route
          path="/consulta-sap"
          element={
            <PrivateRoute>
              <ConsultaSAP />
            </PrivateRoute>
          }
        />
        <Route
          path="/config"
          element={
            <PrivateRoute>
              <Config />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  )
}

export default App
