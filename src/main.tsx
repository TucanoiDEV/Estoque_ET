import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

function removerFallback() {
  const el = document.getElementById('loading-fallback')
  if (el) el.remove()
}

async function iniciar() {
  try {
    const { supabaseConfigurado } = await import('./services/supabase')
    const { default: App } = await import('./App')
    const { ErrorBoundary } = await import('./components/shared/ErrorBoundary')
    const { ConfiguracaoAviso } = await import('./components/shared/ConfiguracaoAviso')

    const root = ReactDOM.createRoot(document.getElementById('root')!)

    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          {supabaseConfigurado ? <App /> : <ConfiguracaoAviso />}
        </ErrorBoundary>
      </React.StrictMode>
    )

    setTimeout(removerFallback, 300)
  } catch (err) {
    console.error('[Armazém Machado] Erro fatal:', err)
    const rootEl = document.getElementById('root')
    if (rootEl) {
      rootEl.innerHTML = `<div style="min-height:100vh;background:#0d1117;display:flex;align-items:center;justify-content:center;padding:24px;font-family:monospace"><div style="background:#161b22;border:1px solid #ef4444;border-radius:16px;padding:32px;max-width:600px;width:100%"><h2 style="color:#ef4444;margin:0 0 16px">Erro ao iniciar</h2><pre style="color:#fca5a5;font-size:13px;white-space:pre-wrap;margin:0">${String(err)}</pre></div></div>`
    }
    removerFallback()
  }
}

iniciar()
