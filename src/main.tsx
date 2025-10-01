import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ConfigProvider } from './contexts/ConfigContext'
import { ThemeProvider } from './contexts/ThemeContext'
import router from './router'

// Styles
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import './styles/custom.css'

// Ensure the root element exists
const rootElement = document.getElementById('root')
if (!rootElement) {
  const root = document.createElement('div')
  root.id = 'root'
  document.body.appendChild(root)
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <ConfigProvider>
        <ThemeProvider>
          <RouterProvider router={router} />
        </ThemeProvider>
      </ConfigProvider>
    </AuthProvider>
  </React.StrictMode>,
)
