// Tipos globais do Armazém Machado

export type Cargo = 'admin' | 'operador' | 'visualizador' | 'developer'

export type StatusEstoque = 'normal' | 'baixo' | 'critico'

export type StatusEntrada = 'recebido' | 'aguardando' | 'cancelado'

export interface Usuario {
  id: string
  nome: string
  email: string
  cargo: Cargo
  avatar_url?: string | null
  created_at: string
}

export interface Produto {
  id: string
  codigo: string
  nome: string
  categoria: string | null
  unidade: string
  cor: string | null
  custo_unitario: number | null
  desconto: number | null // percentual de desconto (0–100)
  desconto_inicio: string | null // data de início da vigência (opcional)
  desconto_fim: string | null // data de fim da vigência (opcional)
  estoque_minimo: number
  local_armazenamento: string | null
  fornecedor_id: string | null
  created_at: string
  fornecedor?: Fornecedor | null
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

export type TipoFrete = 'CIF' | 'FOB' | 'gratis' | 'combinar'

export interface Fornecedor {
  id: string
  nome: string
  contato: string | null
  prazo_entrega: number | null
  condicoes_pagamento: string | null
  // Dados básicos
  representante: string | null
  cnpj: string | null
  inscricao_estadual: string | null
  telefone: string | null
  whatsapp: string | null
  email: string | null
  site: string | null
  ativo: boolean
  // Endereço
  cep: string | null
  endereco: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  cidade: string | null
  estado: string | null
  // Comercial
  pedido_minimo: number | null
  valor_minimo_compra: number | null
  desconto_padrao: number | null
  tipo_frete: TipoFrete | null
  frete_gratis_acima: number | null
  // Observações internas
  observacoes: string | null
  created_at: string
}

// Vínculo produto ↔ fornecedor (tabela fornecedor_produtos)
export interface FornecedorProduto {
  id: string
  fornecedor_id: string
  produto_id: string
  principal: boolean
  created_at: string
  produto?: Produto
}

// Métricas automáticas de um fornecedor, derivadas das entradas (compras).
export interface IndicadoresFornecedor {
  totalComprado: number
  numeroCompras: number
  ticketMedio: number
  ultimaCompra: string | null
  prazoEntregaInformado: number | null
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

export interface Saida {
  id: string
  produto_id: string
  usuario_id: string | null
  quantidade: number
  custo_unitario: number | null
  total: number | null
  motivo: string | null
  observacoes: string | null
  data_saida: string
  created_at: string
  produto?: Produto
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
  atualizarUsuario: (parcial: Partial<Usuario>) => void
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
  top?: { nome: string; quantidade: number; unidade?: string }[] // top produtos do período (para o tooltip)
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
  saidasMes: number
}

// Formulário nova entrada (campos numéricos como string enquanto digitados)
export interface FormNovaEntrada {
  produto_id: string
  quantidade: string
  custo_unitario: string
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
  medida: string
  cor: string
  fornecedor: string
  comDesconto: boolean
}
