import { useState, useCallback, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

// Contextos e hooks
import { AuthContext, useAuthProvider } from './hooks/useAuth'
import { useEstoque } from './hooks/useEstoque'
import { useRealtime } from './hooks/useRealtime'

// Componentes compartilhados
import { Header } from './components/shared/Header'
import { Sidebar, type Aba } from './components/shared/Sidebar'
import { ToastProvider } from './components/shared/Toast'

// Páginas e rotas
import { LoginPage } from './components/Auth/LoginPage'
import { ProtectedRoute } from './components/Auth/ProtectedRoute'

// Abas do dashboard
import { MetricCards } from './components/Dashboard/MetricCards'
import { GraficosTab } from './components/Dashboard/GraficosTab'
import { RelatoriosTab } from './components/Dashboard/RelatoriosTab'
import { HistoricoTab } from './components/Dashboard/HistoricoTab'

// Estoque
import { TabelaEstoque } from './components/Estoque/TabelaEstoque'

// Configurações
import { EmpresaSection } from './components/Configuracoes/EmpresaSection'
import { UsuariosSection } from './components/Configuracoes/UsuariosSection'
import { EstoqueSection } from './components/Configuracoes/EstoqueSection'
import { NotificacoesSection } from './components/Configuracoes/NotificacoesSection'
import { IASection } from './components/Configuracoes/IASection'
import { BackupSection } from './components/Configuracoes/BackupSection'
import { AparenciaSection } from './components/Configuracoes/AparenciaSection'

// Modal
import { NovaEntradaModal } from './components/NovaEntrada/NovaEntradaModal'

// ─── Sub-abas do Dashboard ────────────────────────────────────────────────────
type SubAbaDashboard = 'graficos' | 'relatorios' | 'historico'

const subAbasDashboard: { id: SubAbaDashboard; label: string }[] = [
  { id: 'graficos', label: 'Gráficos' },
  { id: 'relatorios', label: 'Relatórios' },
  { id: 'historico', label: 'Histórico' },
]

// ─── Sub-abas de Configurações ────────────────────────────────────────────────
type SubAbaConfig =
  | 'empresa'
  | 'usuarios'
  | 'estoque'
  | 'notificacoes'
  | 'ia'
  | 'backup'
  | 'aparencia'

const subAbasConfig: { id: SubAbaConfig; label: string }[] = [
  { id: 'empresa', label: 'Empresa' },
  { id: 'usuarios', label: 'Usuários' },
  { id: 'estoque', label: 'Estoque' },
  { id: 'notificacoes', label: 'Notificações' },
  { id: 'ia', label: 'Assistente IA' },
  { id: 'backup', label: 'Backup' },
  { id: 'aparencia', label: 'Aparência' },
]

// ─── Layout principal (app autenticado) ──────────────────────────────────────
function AppLayout() {
  const [abaAtiva, setAbaAtiva] = useState<Aba>('dashboard')
  const [subAbaDash, setSubAbaDash] = useState<SubAbaDashboard>('graficos')
  const [subAbaConf, setSubAbaConf] = useState<SubAbaConfig>('empresa')
  const [modalAberto, setModalAberto] = useState(false)

  // Tema — persiste no localStorage
  const [temaEscuro, setTemaEscuro] = useState<boolean>(() => {
    const salvo = localStorage.getItem('tema')
    return salvo !== null ? salvo === 'escuro' : true
  })

  useEffect(() => {
    localStorage.setItem('tema', temaEscuro ? 'escuro' : 'claro')
    document.documentElement.classList.toggle('dark', temaEscuro)
  }, [temaEscuro])

  // Dados do estoque
  const {
    produtos,
    entradas,
    fornecedores,
    loading,
    metricas,
    dadosGraficoMensal,
    topProdutos,
    recarregar,
    recarregarProdutos,
    recarregarEntradas,
  } = useEstoque()

  // Sync em tempo real
  const onEstoqueChange = useCallback(() => { recarregarProdutos() }, [recarregarProdutos])
  const onEntradasChange = useCallback(() => { recarregarEntradas() }, [recarregarEntradas])
  const { sincronizando } = useRealtime({ onEstoqueChange, onEntradasChange })

  return (
    <div className={temaEscuro ? 'dark' : ''}>
      <div className="min-h-screen bg-dark-bg text-white">
        <Header
          temaEscuro={temaEscuro}
          onToggleTema={() => setTemaEscuro((v) => !v)}
          sincronizando={sincronizando}
          onNovaEntrada={() => setModalAberto(true)}
        />

        <Sidebar abaAtiva={abaAtiva} onMudarAba={setAbaAtiva} />

        {/* Conteúdo principal */}
        <main className="ml-56 pt-16 min-h-screen">
          <div className="p-6 max-w-7xl mx-auto">

            {/* ── Dashboard ── */}
            {abaAtiva === 'dashboard' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                  <p className="text-sm text-gray-500 mt-0.5">Visão geral do seu estoque</p>
                </div>

                <MetricCards metricas={metricas} loading={loading} />

                {/* Sub-abas do dashboard */}
                <div className="flex gap-1 border-b border-dark-border pb-0">
                  {subAbasDashboard.map((aba) => (
                    <button
                      key={aba.id}
                      onClick={() => setSubAbaDash(aba.id)}
                      className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                        subAbaDash === aba.id
                          ? 'text-brand-blue border-brand-blue'
                          : 'text-gray-400 border-transparent hover:text-white'
                      }`}
                    >
                      {aba.label}
                    </button>
                  ))}
                </div>

                {subAbaDash === 'graficos' && (
                  <GraficosTab dadosMensais={dadosGraficoMensal} topProdutos={topProdutos} loading={loading} />
                )}
                {subAbaDash === 'relatorios' && (
                  <RelatoriosTab produtos={produtos} entradas={entradas} fornecedores={fornecedores} loading={loading} />
                )}
                {subAbaDash === 'historico' && (
                  <HistoricoTab entradas={entradas} loading={loading} />
                )}
              </div>
            )}

            {/* ── Estoque ── */}
            {abaAtiva === 'estoque' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-white">Estoque</h1>
                  <p className="text-sm text-gray-500 mt-0.5">Gerencie seus produtos e quantidades</p>
                </div>
                <TabelaEstoque produtos={produtos} loading={loading} onRecarregar={recarregar} />
              </div>
            )}

            {/* ── Configurações ── */}
            {abaAtiva === 'configuracoes' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-white">Configurações</h1>
                  <p className="text-sm text-gray-500 mt-0.5">Gerencie o sistema e preferências</p>
                </div>

                <div className="flex gap-6">
                  {/* Menu lateral de config */}
                  <nav className="w-44 shrink-0 space-y-1">
                    {subAbasConfig.map((aba) => (
                      <button
                        key={aba.id}
                        onClick={() => setSubAbaConf(aba.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          subAbaConf === aba.id
                            ? 'bg-brand-blue/10 text-brand-blue'
                            : 'text-gray-400 hover:text-white hover:bg-dark-hover'
                        }`}
                      >
                        {aba.label}
                      </button>
                    ))}
                  </nav>

                  {/* Painel da seção selecionada */}
                  <div className="flex-1 bg-dark-card border border-dark-border rounded-xl p-6 min-h-96">
                    {subAbaConf === 'empresa' && <EmpresaSection />}
                    {subAbaConf === 'usuarios' && <UsuariosSection />}
                    {subAbaConf === 'estoque' && <EstoqueSection />}
                    {subAbaConf === 'notificacoes' && <NotificacoesSection />}
                    {subAbaConf === 'ia' && <IASection />}
                    {subAbaConf === 'backup' && <BackupSection />}
                    {subAbaConf === 'aparencia' && (
                      <AparenciaSection temaEscuro={temaEscuro} onToggleTema={() => setTemaEscuro((v) => !v)} />
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>

        {/* Modal de nova entrada */}
        {modalAberto && (
          <NovaEntradaModal
            onFechar={() => setModalAberto(false)}
            onSalvo={recarregar}
          />
        )}
      </div>
    </div>
  )
}

// ─── Raiz do App com contextos ────────────────────────────────────────────────
export default function App() {
  const authValue = useAuthProvider()

  return (
    <AuthContext.Provider value={authValue}>
      <ToastProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthContext.Provider>
  )
}
