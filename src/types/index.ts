// Tipos globais do EstoqueSync

export type Cargo = 'admin' | 'operador' | 'visualizador'

export type StatusEstoque = 'normal' | 'baixo' | 'critico'

export type StatusEntrada = 'recebido' | 'aguardando' | 'cancelado'

export interface Usuario {
  id: string
  nome: string
  email: string
  cargo: Cargo
  created_at: string
}

export interface Produto {
  id: string
  codigo: string
  nome: string
  categoria: string | null
  unidade: string
  custo_unitario: number | null
  estoque_minimo: number
  local_armazenamento: string | null
  created_at: string
}

export interface EstoqueItem {
  id: string
  produto_id: string
  quantidade: number
  updated_at: string
  produto?: Produto
}

export interface ProdutoComEstoque extends Produto {
  quantidade: number
  status: StatusEstoque
}

export interface Fornecedor {
  id: string
  nome: string
  contato: string | null
  prazo_entrega: number | null
  condicoes_pagamento: string | null
  created_at: string
}

export interface Entrada {
  id: string
  produto_id: string
  fornecedor_id: string | null
  usuario_id: string
  quantidade: number
  custo_unitario: number | null
  total: number | null
  nf_numero: string | null
  data_recebimento: string
  local_armazenamento: string | null
  observacoes: string | null
  status: StatusEntrada
  created_at: string
  produto?: Produto
  fornecedor?: Fornecedor
  usuario?: Usuario
}

export interface Configuracao {
  id: string
  chave: string
  valor: string | null
  updated_at: string
}

// Contexto de autenticação
export interface AuthContextType {
  usuario: Usuario | null
  loading: boolean
  login: (email: string, senha: string) => Promise<void>
  logout: () => Promise<void>
}

// Contexto de tema
export interface TemaContextType {
  temaEscuro: boolean
  toggleTema: () => void
}

// Contexto de toast
export type TipoToast = 'sucesso' | 'erro' | 'aviso' | 'info'

export interface ToastItem {
  id: string
  mensagem: string
  tipo: TipoToast
}

export interface ToastContextType {
  toasts: ToastItem[]
  mostrarToast: (mensagem: string, tipo?: TipoToast) => void
  removerToast: (id: string) => void
}

// Dados para gráficos
export interface DadoGrafico {
  mes: string
  quantidade: number
  total: number
}

export interface DadoProdutoMovimentado {
  nome: string
  movimentacoes: number
}

// Métricas do dashboard
export interface MetricasDashboard {
  totalItens: number
  valorTotal: number
  itensCriticos: number
  entradasMes: number
}

// Formulário nova entrada
export interface FormNovaEntrada {
  produto_id: string
  quantidade: number
  custo_unitario: number
  fornecedor_id: string
  data_recebimento: string
  nf_numero: string
  local_armazenamento: string
  observacoes: string
}

// Filtros de estoque
export interface FiltrosEstoque {
  busca: string
  categoria: string
  status: StatusEstoque | 'todos'
}
