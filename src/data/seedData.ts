// Dados de exemplo para demonstração do sistema EstoqueSync

import type {
  ProdutoComEstoque, Fornecedor, Entrada, Relatorio,
  DadoGraficoMensal, DadoVendasMensal, DadoProdutoMovimentado,
  ConfiguracaoApp, Usuario, Categoria,
} from '../types';

export const fornecedoresSeed: Fornecedor[] = [
  { id: 'forn-1', nome: 'Tecidos São Paulo', contato: '(11) 9999-0001', email: 'contato@tecidossp.com', prazo_entrega: 7, condicoes_pagamento: '30/60 dias', ativo: true, created_at: '2024-01-10T10:00:00Z' },
  { id: 'forn-2', nome: 'Fornecedor ABC', contato: '(11) 9999-0002', email: 'abc@fornecedor.com', prazo_entrega: 5, condicoes_pagamento: 'À vista', ativo: true, created_at: '2024-01-15T10:00:00Z' },
  { id: 'forn-3', nome: 'Malhas & Cia', contato: '(11) 9999-0003', email: 'malhas@cia.com', prazo_entrega: 10, condicoes_pagamento: '30 dias', ativo: true, created_at: '2024-02-01T10:00:00Z' },
  { id: 'forn-4', nome: 'Tecidos do Brasil', contato: '(11) 9999-0004', email: 'tecidos@brasil.com', prazo_entrega: 8, condicoes_pagamento: '30/60/90 dias', ativo: true, created_at: '2024-02-10T10:00:00Z' },
  { id: 'forn-5', nome: 'Tecidos Finos', contato: '(11) 9999-0005', email: 'finos@tecidos.com', prazo_entrega: 12, condicoes_pagamento: '60 dias', ativo: true, created_at: '2024-03-01T10:00:00Z' },
  { id: 'forn-6', nome: 'Casa dos Tecidos', contato: '(11) 9999-0006', email: 'casa@tecidos.com', prazo_entrega: 6, condicoes_pagamento: 'À vista / 30 dias', ativo: true, created_at: '2024-03-15T10:00:00Z' },
];

export const produtosSeed: ProdutoComEstoque[] = [
  { id: 'prod-1',  codigo: 'TEC001',  nome: 'Algodão Premium',    categoria: 'Branco',      tipo: 'Algodão',   unidade: 'm',  custo_unitario: 30,  estoque_minimo: 50,  quantidade: 250, status: 'normal',  fornecedor_id: 'forn-1', fornecedor_nome: 'Tecidos São Paulo', cor: '#f5f5f0', created_at: '2024-01-20T10:00:00Z' },
  { id: 'prod-2',  codigo: 'TEC002',  nome: 'Seda Natural',       categoria: 'Azul',        tipo: 'Seda',      unidade: 'm',  custo_unitario: 80,  estoque_minimo: 30,  quantidade: 80,  status: 'normal',  fornecedor_id: 'forn-2', fornecedor_nome: 'Fornecedor ABC',    cor: '#3b82f6', created_at: '2024-01-22T10:00:00Z' },
  { id: 'prod-3',  codigo: 'PROD001', nome: 'Tigela Cerâmica',    categoria: 'Utensílios',  tipo: 'Unitário',  unidade: 'un', custo_unitario: 25,  estoque_minimo: 30,  quantidade: 150, status: 'normal',  fornecedor_id: 'forn-3', fornecedor_nome: 'Malhas & Cia',      created_at: '2024-02-05T10:00:00Z' },
  { id: 'prod-4',  codigo: 'TEC003',  nome: 'Linho Branco',       categoria: 'Branco',      tipo: 'Linho',     unidade: 'm',  custo_unitario: 40,  estoque_minimo: 100, quantidade: 180, status: 'normal',  fornecedor_id: 'forn-4', fornecedor_nome: 'Tecidos do Brasil', cor: '#fafaf8', created_at: '2024-02-08T10:00:00Z' },
  { id: 'prod-5',  codigo: 'TEC004',  nome: 'Malha PV',           categoria: 'Preto',       tipo: 'Malha',     unidade: 'm',  custo_unitario: 14,  estoque_minimo: 150, quantidade: 320, status: 'normal',  fornecedor_id: 'forn-3', fornecedor_nome: 'Malhas & Cia',      cor: '#1a1a1a', created_at: '2024-02-10T10:00:00Z' },
  { id: 'prod-6',  codigo: 'TEC005',  nome: 'Cetim Rosa',         categoria: 'Rosa',        tipo: 'Cetim',     unidade: 'm',  custo_unitario: 55,  estoque_minimo: 40,  quantidade: 25,  status: 'baixo',   fornecedor_id: 'forn-5', fornecedor_nome: 'Tecidos Finos',     cor: '#ec4899', created_at: '2024-02-15T10:00:00Z' },
  { id: 'prod-7',  codigo: 'TEC006',  nome: 'Tricoline Floral',   categoria: 'Colorido',    tipo: 'Tricoline', unidade: 'm',  custo_unitario: 22,  estoque_minimo: 60,  quantidade: 95,  status: 'normal',  fornecedor_id: 'forn-1', fornecedor_nome: 'Tecidos São Paulo', created_at: '2024-02-20T10:00:00Z' },
  { id: 'prod-8',  codigo: 'TEC007',  nome: 'Oxford Azul',        categoria: 'Azul Marinho',tipo: 'Oxford',    unidade: 'm',  custo_unitario: 35,  estoque_minimo: 80,  quantidade: 140, status: 'normal',  fornecedor_id: 'forn-4', fornecedor_nome: 'Tecidos do Brasil', cor: '#1d4ed8', created_at: '2024-03-01T10:00:00Z' },
  { id: 'prod-9',  codigo: 'TEC008',  nome: 'Viscose Estampada',  categoria: 'Colorido',    tipo: 'Viscose',   unidade: 'm',  custo_unitario: 28,  estoque_minimo: 50,  quantidade: 210, status: 'normal',  fornecedor_id: 'forn-2', fornecedor_nome: 'Fornecedor ABC',    created_at: '2024-03-05T10:00:00Z' },
  { id: 'prod-10', codigo: 'TEC009',  nome: 'Crepe Georgette',    categoria: 'Bege',        tipo: 'Crepe',     unidade: 'm',  custo_unitario: 45,  estoque_minimo: 30,  quantidade: 65,  status: 'normal',  fornecedor_id: 'forn-5', fornecedor_nome: 'Tecidos Finos',     cor: '#d4c5a9', created_at: '2024-03-10T10:00:00Z' },
  { id: 'prod-11', codigo: 'TEC010',  nome: 'Jeans Pesado',       categoria: 'Azul',        tipo: 'Jeans',     unidade: 'm',  custo_unitario: 38,  estoque_minimo: 100, quantidade: 175, status: 'normal',  fornecedor_id: 'forn-4', fornecedor_nome: 'Tecidos do Brasil', cor: '#2563eb', created_at: '2024-03-15T10:00:00Z' },
  { id: 'prod-12', codigo: 'TEC011',  nome: 'Voil Branco',        categoria: 'Branco',      tipo: 'Voil',      unidade: 'm',  custo_unitario: 18,  estoque_minimo: 80,  quantidade: 18,  status: 'critico', fornecedor_id: 'forn-6', fornecedor_nome: 'Casa dos Tecidos',  cor: '#ffffff', created_at: '2024-03-20T10:00:00Z' },
];

// Histórico de entradas dos últimos 6 meses
export const entradasSeed: Entrada[] = [
  { id: 'ent-1',  produto_id: 'prod-1',  produto_nome: 'Algodão Premium',   fornecedor_id: 'forn-1', fornecedor_nome: 'Tecidos São Paulo', quantidade: 100, custo_unitario: 29.50, total: 2950,  nf_numero: 'NF-001234', data_recebimento: '2024-12-05', local_armazenamento: 'Setor A', observacoes: '', sincronizado: true,  created_at: '2024-12-05T09:00:00Z' },
  { id: 'ent-2',  produto_id: 'prod-4',  produto_nome: 'Linho Branco',       fornecedor_id: 'forn-4', fornecedor_nome: 'Tecidos do Brasil',  quantidade: 80,  custo_unitario: 39.00, total: 3120,  nf_numero: 'NF-001235', data_recebimento: '2024-12-08', local_armazenamento: 'Setor B', observacoes: '', sincronizado: true,  created_at: '2024-12-08T10:00:00Z' },
  { id: 'ent-3',  produto_id: 'prod-5',  produto_nome: 'Malha PV',           fornecedor_id: 'forn-3', fornecedor_nome: 'Malhas & Cia',       quantidade: 200, custo_unitario: 13.80, total: 2760,  nf_numero: 'NF-001236', data_recebimento: '2024-12-12', local_armazenamento: 'Setor C', observacoes: 'Lote especial', sincronizado: true,  created_at: '2024-12-12T11:00:00Z' },
  { id: 'ent-4',  produto_id: 'prod-2',  produto_nome: 'Seda Natural',       fornecedor_id: 'forn-2', fornecedor_nome: 'Fornecedor ABC',     quantidade: 50,  custo_unitario: 78.00, total: 3900,  nf_numero: 'NF-001240', data_recebimento: '2025-01-07', local_armazenamento: 'Setor A', observacoes: '', sincronizado: true,  created_at: '2025-01-07T09:30:00Z' },
  { id: 'ent-5',  produto_id: 'prod-7',  produto_nome: 'Tricoline Floral',   fornecedor_id: 'forn-1', fornecedor_nome: 'Tecidos São Paulo', quantidade: 120, custo_unitario: 21.50, total: 2580,  nf_numero: 'NF-001241', data_recebimento: '2025-01-10', local_armazenamento: 'Setor D', observacoes: '', sincronizado: true,  created_at: '2025-01-10T14:00:00Z' },
  { id: 'ent-6',  produto_id: 'prod-8',  produto_nome: 'Oxford Azul',        fornecedor_id: 'forn-4', fornecedor_nome: 'Tecidos do Brasil',  quantidade: 90,  custo_unitario: 34.00, total: 3060,  nf_numero: 'NF-001242', data_recebimento: '2025-01-15', local_armazenamento: 'Setor B', observacoes: '', sincronizado: true,  created_at: '2025-01-15T10:00:00Z' },
  { id: 'ent-7',  produto_id: 'prod-9',  produto_nome: 'Viscose Estampada',  fornecedor_id: 'forn-2', fornecedor_nome: 'Fornecedor ABC',     quantidade: 150, custo_unitario: 27.00, total: 4050,  nf_numero: 'NF-001250', data_recebimento: '2025-02-03', local_armazenamento: 'Setor D', observacoes: '', sincronizado: true,  created_at: '2025-02-03T09:00:00Z' },
  { id: 'ent-8',  produto_id: 'prod-1',  produto_nome: 'Algodão Premium',   fornecedor_id: 'forn-1', fornecedor_nome: 'Tecidos São Paulo', quantidade: 100, custo_unitario: 30.00, total: 3000,  nf_numero: 'NF-001251', data_recebimento: '2025-02-08', local_armazenamento: 'Setor A', observacoes: '', sincronizado: true,  created_at: '2025-02-08T11:00:00Z' },
  { id: 'ent-9',  produto_id: 'prod-10', produto_nome: 'Crepe Georgette',    fornecedor_id: 'forn-5', fornecedor_nome: 'Tecidos Finos',     quantidade: 60,  custo_unitario: 44.00, total: 2640,  nf_numero: 'NF-001252', data_recebimento: '2025-02-12', local_armazenamento: 'Setor A', observacoes: 'Pedido urgente', sincronizado: true,  created_at: '2025-02-12T14:30:00Z' },
  { id: 'ent-10', produto_id: 'prod-11', produto_nome: 'Jeans Pesado',       fornecedor_id: 'forn-4', fornecedor_nome: 'Tecidos do Brasil',  quantidade: 100, custo_unitario: 37.50, total: 3750,  nf_numero: 'NF-001260', data_recebimento: '2025-03-05', local_armazenamento: 'Setor C', observacoes: '', sincronizado: true,  created_at: '2025-03-05T09:00:00Z' },
  { id: 'ent-11', produto_id: 'prod-6',  produto_nome: 'Cetim Rosa',         fornecedor_id: 'forn-5', fornecedor_nome: 'Tecidos Finos',     quantidade: 80,  custo_unitario: 54.00, total: 4320,  nf_numero: 'NF-001261', data_recebimento: '2025-03-10', local_armazenamento: 'Setor A', observacoes: '', sincronizado: true,  created_at: '2025-03-10T10:00:00Z' },
  { id: 'ent-12', produto_id: 'prod-3',  produto_nome: 'Tigela Cerâmica',    fornecedor_id: 'forn-3', fornecedor_nome: 'Malhas & Cia',       quantidade: 100, custo_unitario: 24.50, total: 2450,  nf_numero: 'NF-001262', data_recebimento: '2025-03-15', local_armazenamento: 'Setor E', observacoes: '', sincronizado: true,  created_at: '2025-03-15T11:00:00Z' },
  { id: 'ent-13', produto_id: 'prod-2',  produto_nome: 'Seda Natural',       fornecedor_id: 'forn-2', fornecedor_nome: 'Fornecedor ABC',     quantidade: 60,  custo_unitario: 79.00, total: 4740,  nf_numero: 'NF-001270', data_recebimento: '2025-04-02', local_armazenamento: 'Setor A', observacoes: '', sincronizado: true,  created_at: '2025-04-02T09:00:00Z' },
  { id: 'ent-14', produto_id: 'prod-4',  produto_nome: 'Linho Branco',       fornecedor_id: 'forn-4', fornecedor_nome: 'Tecidos do Brasil',  quantidade: 120, custo_unitario: 40.00, total: 4800,  nf_numero: 'NF-001271', data_recebimento: '2025-04-08', local_armazenamento: 'Setor B', observacoes: '', sincronizado: true,  created_at: '2025-04-08T10:00:00Z' },
  { id: 'ent-15', produto_id: 'prod-5',  produto_nome: 'Malha PV',           fornecedor_id: 'forn-3', fornecedor_nome: 'Malhas & Cia',       quantidade: 200, custo_unitario: 14.00, total: 2800,  nf_numero: 'NF-001272', data_recebimento: '2025-04-15', local_armazenamento: 'Setor C', observacoes: '', sincronizado: true,  created_at: '2025-04-15T14:00:00Z' },
  { id: 'ent-16', produto_id: 'prod-7',  produto_nome: 'Tricoline Floral',   fornecedor_id: 'forn-1', fornecedor_nome: 'Tecidos São Paulo', quantidade: 80,  custo_unitario: 22.00, total: 1760,  nf_numero: 'NF-001280', data_recebimento: '2025-05-05', local_armazenamento: 'Setor D', observacoes: '', sincronizado: true,  created_at: '2025-05-05T09:00:00Z' },
  { id: 'ent-17', produto_id: 'prod-1',  produto_nome: 'Algodão Premium',   fornecedor_id: 'forn-1', fornecedor_nome: 'Tecidos São Paulo', quantidade: 120, custo_unitario: 30.00, total: 3600,  nf_numero: 'NF-001281', data_recebimento: '2025-05-12', local_armazenamento: 'Setor A', observacoes: '', sincronizado: true,  created_at: '2025-05-12T11:00:00Z' },
  { id: 'ent-18', produto_id: 'prod-9',  produto_nome: 'Viscose Estampada',  fornecedor_id: 'forn-2', fornecedor_nome: 'Fornecedor ABC',     quantidade: 100, custo_unitario: 28.00, total: 2800,  nf_numero: 'NF-001282', data_recebimento: '2025-05-18', local_armazenamento: 'Setor D', observacoes: '', sincronizado: true,  created_at: '2025-05-18T10:00:00Z' },
  { id: 'ent-19', produto_id: 'prod-8',  produto_nome: 'Oxford Azul',        fornecedor_id: 'forn-4', fornecedor_nome: 'Tecidos do Brasil',  quantidade: 80,  custo_unitario: 35.00, total: 2800,  nf_numero: 'NF-001290', data_recebimento: '2025-06-03', local_armazenamento: 'Setor B', observacoes: '', sincronizado: false, created_at: '2025-06-03T09:00:00Z' },
  { id: 'ent-20', produto_id: 'prod-11', produto_nome: 'Jeans Pesado',       fornecedor_id: 'forn-4', fornecedor_nome: 'Tecidos do Brasil',  quantidade: 60,  custo_unitario: 38.00, total: 2280,  nf_numero: 'NF-001291', data_recebimento: '2025-06-08', local_armazenamento: 'Setor C', observacoes: '', sincronizado: false, created_at: '2025-06-08T10:00:00Z' },
  { id: 'ent-21', produto_id: 'prod-12', produto_nome: 'Voil Branco',        fornecedor_id: 'forn-6', fornecedor_nome: 'Casa dos Tecidos',  quantidade: 100, custo_unitario: 18.00, total: 1800,  nf_numero: 'NF-001292', data_recebimento: '2025-06-10', local_armazenamento: 'Setor A', observacoes: '', sincronizado: false, created_at: '2025-06-10T11:00:00Z' },
  { id: 'ent-22', produto_id: 'prod-2',  produto_nome: 'Seda Natural',       fornecedor_id: 'forn-2', fornecedor_nome: 'Fornecedor ABC',     quantidade: 40,  custo_unitario: 80.00, total: 3200,  nf_numero: 'NF-001293', data_recebimento: '2025-06-15', local_armazenamento: 'Setor A', observacoes: 'Urgente', sincronizado: false, created_at: '2025-06-15T14:00:00Z' },
];

export const dadosGraficoMensal: DadoGraficoMensal[] = [
  { mes: 'Jan', entradas: 185, vendas: 132 },
  { mes: 'Fev', entradas: 228, vendas: 167 },
  { mes: 'Mar', entradas: 205, vendas: 184 },
  { mes: 'Abr', entradas: 267, vendas: 215 },
  { mes: 'Mai', entradas: 315, vendas: 248 },
  { mes: 'Jun', entradas: 382, vendas: 293 },
];

export const dadosVendasMensal: DadoVendasMensal[] = [
  { mes: 'Jan', faturamento: 15800, lucro: 4200 },
  { mes: 'Fev', faturamento: 18920, lucro: 5650 },
  { mes: 'Mar', faturamento: 21400, lucro: 6800 },
  { mes: 'Abr', faturamento: 25600, lucro: 8400 },
  { mes: 'Mai', faturamento: 30200, lucro: 10800 },
  { mes: 'Jun', faturamento: 36100, lucro: 12900 },
];

export const dadosProdutosMovimentados: DadoProdutoMovimentado[] = [
  { nome: 'Algodão Premium', junho: 65, maio: 55, abril: 48 },
  { nome: 'Seda Natural',    junho: 54, maio: 44, abril: 37 },
  { nome: 'Linho Branco',    junho: 46, maio: 37, abril: 30 },
  { nome: 'Malha PV',        junho: 36, maio: 29, abril: 24 },
];

export const relatoriosSeed: Relatorio[] = [
  { id: 'rel-1', nome: 'Relatório Mensal - Junho 2025',    tipo: 'mensal', periodo: 'Jun/2025', total_entradas: 43, valor_total: 36100, itens_movimentados: 8,  created_at: '2025-06-01T00:00:00Z' },
  { id: 'rel-2', nome: 'Relatório Mensal - Maio 2025',     tipo: 'mensal', periodo: 'Mai/2025', total_entradas: 38, valor_total: 30200, itens_movimentados: 7,  created_at: '2025-05-01T00:00:00Z' },
  { id: 'rel-3', nome: 'Relatório Mensal - Abril 2025',    tipo: 'mensal', periodo: 'Abr/2025', total_entradas: 35, valor_total: 25600, itens_movimentados: 6,  created_at: '2025-04-01T00:00:00Z' },
  { id: 'rel-4', nome: 'Relatório Mensal - Março 2025',    tipo: 'mensal', periodo: 'Mar/2025', total_entradas: 29, valor_total: 21400, itens_movimentados: 7,  created_at: '2025-03-01T00:00:00Z' },
  { id: 'rel-5', nome: 'Relatório Mensal - Fevereiro 2025',tipo: 'mensal', periodo: 'Fev/2025', total_entradas: 24, valor_total: 18920, itens_movimentados: 5,  created_at: '2025-02-01T00:00:00Z' },
  { id: 'rel-6', nome: 'Relatório Mensal - Janeiro 2025',  tipo: 'mensal', periodo: 'Jan/2025', total_entradas: 20, valor_total: 15800, itens_movimentados: 4,  created_at: '2025-01-01T00:00:00Z' },
];

export const categoriasSeed: Categoria[] = [
  { id: 'cat-1', nome: 'Algodão' },
  { id: 'cat-2', nome: 'Seda' },
  { id: 'cat-3', nome: 'Linho' },
  { id: 'cat-4', nome: 'Malha' },
  { id: 'cat-5', nome: 'Cetim' },
  { id: 'cat-6', nome: 'Jeans' },
  { id: 'cat-7', nome: 'Tricoline' },
  { id: 'cat-8', nome: 'Oxford' },
  { id: 'cat-9', nome: 'Viscose' },
  { id: 'cat-10', nome: 'Crepe' },
  { id: 'cat-11', nome: 'Voil' },
];

export const usuariosSeed: Usuario[] = [
  { id: 'usr-1', nome: 'Administrador', email: 'admin@loja.com', nivel_acesso: 'admin',      ativo: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 'usr-2', nome: 'Operador Estoque', email: 'estoque@loja.com', nivel_acesso: 'operador',    ativo: true, created_at: '2024-01-10T00:00:00Z' },
  { id: 'usr-3', nome: 'Visualizador',  email: 'view@loja.com',    nivel_acesso: 'visualizador', ativo: true, created_at: '2024-02-01T00:00:00Z' },
];

export const configPadraoSeed: ConfiguracaoApp = {
  nome_loja: 'Loja de Tecidos Premium',
  cnpj: '12.345.678/0001-90',
  moeda: 'BRL',
  fuso_horario: 'America/Sao_Paulo',
  tema: 'escuro',
  supabase_url: '',
  supabase_key: '',
  sync_automatico: true,
  notif_estoque_critico: true,
  notif_nova_entrada: true,
  notif_relatorio_semanal: false,
  claude_api_key: '',
  alertas_ia: false,
  backup_frequencia: 'diario',
  backup_destino: 'local',
  estoque_minimo_padrao: 50,
};
