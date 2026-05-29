// Tipos principais do sistema EstoqueSync

export type NivelAcesso = 'admin' | 'operador' | 'visualizador';
export type StatusEstoque = 'normal' | 'baixo' | 'critico';
export type Unidade = 'm' | 'un' | 'kg' | 'L' | 'rolo';
export type AbaAtiva = 'dashboard' | 'estoque' | 'configuracoes';
export type AbaConfig = 'geral' | 'fornecedores' | 'categorias';
export type AbaDashboard = 'graficos' | 'relatorios' | 'historico';

export interface Produto {
  id: string;
  codigo: string;
  nome: string;
  categoria: string;
  tipo: string;
  unidade: Unidade;
  custo_unitario: number;
  estoque_minimo: number;
  local_armazenamento?: string;
  cor?: string;
  fornecedor_id?: string;
  created_at: string;
}

export interface ProdutoComEstoque extends Produto {
  quantidade: number;
  status: StatusEstoque;
  fornecedor_nome?: string;
}

export interface Entrada {
  id: string;
  produto_id: string;
  produto_nome?: string;
  fornecedor_id: string;
  fornecedor_nome?: string;
  quantidade: number;
  custo_unitario: number;
  total: number;
  nf_numero?: string;
  data_recebimento: string;
  local_armazenamento?: string;
  observacoes?: string;
  sincronizado: boolean;
  created_at: string;
}

export interface Fornecedor {
  id: string;
  nome: string;
  contato?: string;
  email?: string;
  prazo_entrega?: number;
  condicoes_pagamento?: string;
  ativo: boolean;
  created_at: string;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  nivel_acesso: NivelAcesso;
  ativo: boolean;
  created_at: string;
}

export interface MetricasDashboard {
  total_itens: number;
  valor_total: number;
  itens_criticos: number;
  entradas_mes: number;
  total_fornecedores: number;
  variacao_semanal: number;
  variacao_valor_pct: number;
}

export interface DadoGraficoMensal {
  mes: string;
  entradas: number;
  vendas: number;
}

export interface DadoVendasMensal {
  mes: string;
  faturamento: number;
  lucro: number;
}

export interface DadoProdutoMovimentado {
  nome: string;
  junho: number;
  maio: number;
  abril: number;
}

export interface Relatorio {
  id: string;
  nome: string;
  tipo: 'mensal' | 'semanal' | 'anual';
  periodo: string;
  total_entradas: number;
  valor_total: number;
  itens_movimentados: number;
  created_at: string;
}

export interface ToastNotificacao {
  id: string;
  tipo: 'sucesso' | 'erro' | 'aviso' | 'info';
  mensagem: string;
  duracao?: number;
}

export interface ConfiguracaoApp {
  nome_loja: string;
  cnpj: string;
  moeda: string;
  fuso_horario: string;
  tema: 'claro' | 'escuro';
  supabase_url: string;
  supabase_key: string;
  sync_automatico: boolean;
  notif_estoque_critico: boolean;
  notif_nova_entrada: boolean;
  notif_relatorio_semanal: boolean;
  claude_api_key: string;
  alertas_ia: boolean;
  backup_frequencia: 'diario' | 'semanal' | 'mensal';
  backup_destino: string;
  estoque_minimo_padrao: number;
}

export interface NovaEntradaForm {
  produto_id: string;
  quantidade: number;
  custo_unitario: number;
  fornecedor_id: string;
  data_recebimento: string;
  nf_numero: string;
  local_armazenamento: string;
  observacoes: string;
}

export interface Categoria {
  id: string;
  nome: string;
  cor?: string;
}
