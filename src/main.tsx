import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { ErrorBoundary } from './components/shared/ErrorBoundary.tsx'
import { ConfiguracaoAviso } from './components/shared/ConfiguracaoAviso.tsx'
import { supabaseConfigurado } from './services/supabase.ts'
import './index.css'

// Remove o fallback HTML assim que o React assumir o controle
function removerFallback() {
  const el = document.getElementById('loading-fallback')
  if (el) el.remove()
}

const root = ReactDOM.createRoot(document.getElementById('root')!)

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      {supabaseConfigurado ? <App /> : <ConfiguracaoAviso />}
    </ErrorBoundary>
  </React.StrictMode>,
)

// Aguarda 200ms para garantir que React renderizou antes de remover o fallback
setTimeout(removerFallback, 200)
