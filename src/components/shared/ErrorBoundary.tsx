import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  erro: Error | null
}

// Captura erros de renderização React e exibe uma tela amigável
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { erro: null }
  }

  static getDerivedStateFromError(erro: Error): State {
    return { erro }
  }

  componentDidCatch(erro: Error, info: ErrorInfo) {
    console.error('[EstoqueSync] Erro capturado:', erro, info)
  }

  render() {
    if (this.state.erro) {
      return (
        <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-[#161b22] border border-[#30363d] rounded-2xl p-8">
            <div className="text-4xl mb-4">⚠️</div>
            <h1 className="text-xl font-bold text-white mb-2">Algo deu errado</h1>
            <p className="text-gray-400 text-sm mb-4">
              O aplicativo encontrou um erro. Verifique o console para detalhes.
            </p>
            <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 mb-6">
              <code className="text-red-400 text-xs break-all">
                {this.state.erro.message}
              </code>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Verifique se o arquivo <code className="text-blue-400">.env</code> está configurado com as credenciais do Supabase.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Recarregar página
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
