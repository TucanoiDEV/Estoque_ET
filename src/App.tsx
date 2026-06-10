import { useState, useCallback, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

// Contextos e hooks
import { AuthContext, useAuthProvider } from './hooks/useAuth'
import { useEstoque } from './hooks/useEstoque'
import { useRealtime } from './hooks/useRealtime'
import { usePermissions } from './hooks/usePermissions'

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
import { UsuariosSection } from './components/Configuracoes/UsuariosSection'
import { FornecedoresSection } from './components/Configuracoes/FornecedoresSection'
import { EstoqueSection } from './components/Configuracoes/EstoqueSection'
import { DescontosSection } from './components/Configuracoes/DescontosSection'
import { NotificacoesSection } from './components/Configuracoes/NotificacoesSection'
import { IASection } from './components/Configuracoes/IASection'
import { BackupSection } from './components/Configuracoes/BackupSection'
import { DesenvolvedorSection } from './components/Configuracoes/DesenvolvedorSection'

// Modais
import { NovaEntradaModal } from './components/NovaEntrada/NovaEntradaModal'
import { NovaSaidaModal } from './components/NovaSaida/NovaSaidaModal'
import { NovoProdutoModal } from './components/NovoProduto/NovoProdutoModal'

// ─── Sub-abas do Dashboard ────────────────────────────────────────────────────
type SubAbaDashboard = 'graficos' | 'relatorios' | 'historico'

const subAbasDashboard: { id: SubAbaDashboard; label: string }[] = [
  { id: 'graficos', label: 'Gráficos' },
  { id: 'relatorios', label: 'Relatórios' },
  { id: 'historico', label: 'Histórico' },
]

// ─── Sub-abas de Configurações ────────────────────────────────────────────────
type SubAbaConfig =
  | 'usuarios'
  | 'estoque'
  | 'descontos'
  | 'notificacoes'
  | 'ia'
  | 'backup'
  | 'desenvolvedor'

// `soDev: true` → só aparece para o cargo developer
const subAbasConfig: { id: SubAbaConfig; label: string; soDev?: boolean }[] = [
  { id: 'usuarios', label: 'Usuários' },
  { id: 'estoque', label: 'Estoque' },
  { id: 'descontos', label: 'Descontos' },
  { id: 'notificacoes', label: 'Notificações' },
  { id: 'ia', label: 'Assistente IA' },
  { id: 'backup', label: 'Backup' },
  { id: 'desenvolvedor', label: 'Desenvolvedor', soDev: true },
]

// ─── Layout principal (app autenticado) ──────────────────────────────────────
function AppLayout() {
  const { isAdmin, canAccessDev } = usePermissions()
  const [abaAtiva, setAbaAtiva] = useState<Aba>('dashboard')
  const [subAbaDash, setSubAbaDash] = useState<SubAbaDashboard>('graficos')
  const [subAbaConf, setSubAbaConf] = useState<SubAbaConfig>('usuarios')
  const [modalAberto, setModalAberto] = useState(false)
  const [modalSaidaAberto, setModalSaidaAberto] = useState(false)
  const [modalProdutoAberto, setModalProdutoAberto] = useState(false)
  const [sidebarAberta, setSidebarAberta] = useState(false)

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
    saidas,
    fornecedores,
    loading,
    metricas,
    topProdutos,
    topProdutosVendidos,
    recarregar,
    recarregarProdutos,
    recarregarEntradas,
    recarregarSaidas,
  } = useEstoque()

  // Sync em tempo real
  const onEstoqueChange = useCallback(() => { recarregarProdutos(); recarregarSaidas() }, [recarregarProdutos, recarregarSaidas])
  const onEntradasChange = useCallback(() => { recarregarEntradas() }, [recarregarEntradas])
  const { sincronizando } = useRealtime({ onEstoqueChange, onEntradasChange })

  return (
    <div className={temaEscuro ? 'dark' : 'light'}>
      <div className="min-h-screen bg-dark-bg text-dark-text">
        <Header
          temaEscuro={temaEscuro}
          onToggleTema={() => setTemaEscuro((v) => !v)}
          sincronizando={sincronizando}
          onNovaEntrada={() => setModalAberto(true)}
          onNovaSaida={() => setModalSaidaAberto(true)}
          onNovoProduto={() => setModalProdutoAberto(true)}
          onToggleSidebar={() => setSidebarAberta((v) => !v)}
        />

        <Sidebar
          abaAtiva={abaAtiva}
          onMudarAba={setAbaAtiva}
          aberta={sidebarAberta}
          onFechar={() => setSidebarAberta(false)}
        />

        {/* Conteúdo principal */}
        <main className="ml-0 lg:ml-56 pt-16 min-h-screen">
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
                  <GraficosTab
                    entradas={entradas}
                    saidas={saidas}
                    topProdutos={topProdutos}
                    topVendidos={topProdutosVendidos}
                    loading={loading}
                  />
                )}
                {subAbaDash === 'relatorios' && (
                  <RelatoriosTab produtos={produtos} entradas={entradas} fornecedores={fornecedores} loading={loading} />
                )}
                {subAbaDash === 'historico' && (
                  <HistoricoTab entradas={entradas} saidas={saidas} produtos={produtos} loading={loading} />
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
                <TabelaEstoque produtos={produtos} fornecedores={fornecedores} loading={loading} onRecarregar={recarregar} />
              </div>
            )}

            {/* ── Fornecedores (exclusivo de admin) ── */}
            {abaAtiva === 'fornecedores' && isAdmin() && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-white">Fornecedores</h1>
                  <p className="text-sm text-gray-500 mt-0.5">Gestão completa dos fornecedores do estoque</p>
                </div>
                <div className="bg-dark-card border border-dark-border rounded-xl p-6">
                  <FornecedoresSection entradas={entradas} loadingEntradas={loading} />
                </div>
              </div>
            )}

            {/* ── Configurações (exclusivo de admin) ── */}
            {abaAtiva === 'configuracoes' && isAdmin() && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-white">Configurações</h1>
                  <p className="text-sm text-gray-500 mt-0.5">Gerencie o sistema e preferências</p>
                </div>

                <div className="flex gap-6">
                  {/* Menu lateral de config */}
                  <nav className="w-44 shrink-0 space-y-1">
                    {subAbasConfig.filter((aba) => !aba.soDev || canAccessDev()).map((aba) => (
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
                    {subAbaConf === 'usuarios' && <UsuariosSection />}
                    {subAbaConf === 'estoque' && <EstoqueSection />}
                    {subAbaConf === 'descontos' && <DescontosSection onAplicado={recarregar} />}
                    {subAbaConf === 'notificacoes' && <NotificacoesSection />}
                    {subAbaConf === 'ia' && <IASection />}
                    {subAbaConf === 'backup' && <BackupSection />}
                    {subAbaConf === 'desenvolvedor' && canAccessDev() && <DesenvolvedorSection />}
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

        {/* Modal de saída */}
        {modalSaidaAberto && (
          <NovaSaidaModal
            onFechar={() => setModalSaidaAberto(false)}
            onSalvo={recarregar}
          />
        )}

        {/* Modal de novo produto */}
        {modalProdutoAberto && (
          <NovoProdutoModal
            onFechar={() => setModalProdutoAberto(false)}
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
