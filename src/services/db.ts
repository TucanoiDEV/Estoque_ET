// Serviço de banco de dados com suporte a SQLite (Tauri) e armazenamento em memória (browser)

import { v4 as uuidv4 } from 'uuid';
import type {
  Produto, ProdutoComEstoque, Entrada, Fornecedor, Categoria,
  Usuario, ConfiguracaoApp, StatusEstoque,
} from '../types';
import {
  produtosSeed, fornecedoresSeed, entradasSeed,
  categoriasSeed, usuariosSeed, configPadraoSeed,
} from '../data/seedData';

// Detecta ambiente Tauri
const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

// ——— Armazenamento em memória (fallback browser) ———
interface MemStore {
  produtos: ProdutoComEstoque[];
  entradas: Entrada[];
  fornecedores: Fornecedor[];
  categorias: Categoria[];
  usuarios: Usuario[];
  config: ConfiguracaoApp;
}

const mem: MemStore = {
  produtos: JSON.parse(JSON.stringify(produtosSeed)),
  entradas: JSON.parse(JSON.stringify(entradasSeed)),
  fornecedores: JSON.parse(JSON.stringify(fornecedoresSeed)),
  categorias: JSON.parse(JSON.stringify(categoriasSeed)),
  usuarios: JSON.parse(JSON.stringify(usuariosSeed)),
  config: JSON.parse(JSON.stringify(configPadraoSeed)),
};

// ——— Instância do banco SQLite (Tauri) ———
let tauriDb: any = null;

function calcularStatus(quantidade: number, estoque_minimo: number): StatusEstoque {
  if (quantidade === 0) return 'critico';
  if (quantidade <= estoque_minimo * 0.5) return 'critico';
  if (quantidade <= estoque_minimo) return 'baixo';
  return 'normal';
}

// ——— Inicialização ———
export async function initDB(): Promise<void> {
  if (isTauri) {
    try {
      const { default: Database } = await import('@tauri-apps/plugin-sql');
      tauriDb = await Database.load('sqlite:estoque.db');
      await criarTabelas();
      await popularDadosIniciais();
    } catch (err) {
      console.warn('SQLite não disponível, usando armazenamento em memória:', err);
    }
  }
}

async function criarTabelas(): Promise<void> {
  if (!tauriDb) return;

  await tauriDb.execute(`
    CREATE TABLE IF NOT EXISTS produtos (
      id TEXT PRIMARY KEY,
      codigo TEXT UNIQUE NOT NULL,
      nome TEXT NOT NULL,
      categoria TEXT NOT NULL,
      tipo TEXT NOT NULL,
      unidade TEXT NOT NULL DEFAULT 'm',
      custo_unitario REAL NOT NULL DEFAULT 0,
      estoque_minimo REAL NOT NULL DEFAULT 0,
      quantidade REAL NOT NULL DEFAULT 0,
      local_armazenamento TEXT,
      cor TEXT,
      fornecedor_id TEXT,
      fornecedor_nome TEXT,
      created_at TEXT NOT NULL
    )
  `);

  await tauriDb.execute(`
    CREATE TABLE IF NOT EXISTS entradas (
      id TEXT PRIMARY KEY,
      produto_id TEXT NOT NULL,
      produto_nome TEXT,
      fornecedor_id TEXT NOT NULL,
      fornecedor_nome TEXT,
      quantidade REAL NOT NULL,
      custo_unitario REAL NOT NULL,
      total REAL NOT NULL,
      nf_numero TEXT,
      data_recebimento TEXT NOT NULL,
      local_armazenamento TEXT,
      observacoes TEXT,
      sincronizado INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (produto_id) REFERENCES produtos(id)
    )
  `);

  await tauriDb.execute(`
    CREATE TABLE IF NOT EXISTS fornecedores (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      contato TEXT,
      email TEXT,
      prazo_entrega INTEGER,
      condicoes_pagamento TEXT,
      ativo INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    )
  `);

  await tauriDb.execute(`
    CREATE TABLE IF NOT EXISTS categorias (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL UNIQUE,
      cor TEXT
    )
  `);

  await tauriDb.execute(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      nivel_acesso TEXT NOT NULL,
      ativo INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    )
  `);

  await tauriDb.execute(`
    CREATE TABLE IF NOT EXISTS configuracoes (
      chave TEXT PRIMARY KEY,
      valor TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
}

async function popularDadosIniciais(): Promise<void> {
  if (!tauriDb) return;

  // Verifica se ja ha dados
  const rows = (await tauriDb.select('SELECT COUNT(*) as count FROM produtos')) as { count: number }[];
  if (rows[0].count > 0) return;

  // Insere produtos seed
  for (const p of produtosSeed) {
    await tauriDb.execute(
      `INSERT OR IGNORE INTO produtos VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [p.id, p.codigo, p.nome, p.categoria, p.tipo, p.unidade,
       p.custo_unitario, p.estoque_minimo, p.quantidade,
       p.local_armazenamento ?? null, p.cor ?? null,
       p.fornecedor_id ?? null, p.fornecedor_nome ?? null, p.created_at]
    );
  }

  // Insere fornecedores seed
  for (const f of fornecedoresSeed) {
    await tauriDb.execute(
      `INSERT OR IGNORE INTO fornecedores VALUES (?,?,?,?,?,?,?,?)`,
      [f.id, f.nome, f.contato ?? null, f.email ?? null,
       f.prazo_entrega ?? null, f.condicoes_pagamento ?? null,
       f.ativo ? 1 : 0, f.created_at]
    );
  }

  // Insere entradas seed
  for (const e of entradasSeed) {
    await tauriDb.execute(
      `INSERT OR IGNORE INTO entradas VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [e.id, e.produto_id, e.produto_nome ?? null, e.fornecedor_id,
       e.fornecedor_nome ?? null, e.quantidade, e.custo_unitario, e.total,
       e.nf_numero ?? null, e.data_recebimento, e.local_armazenamento ?? null,
       e.observacoes ?? null, e.sincronizado ? 1 : 0, e.created_at]
    );
  }

  // Insere categorias seed
  for (const c of categoriasSeed) {
    await tauriDb.execute(
      `INSERT OR IGNORE INTO categorias VALUES (?,?,?)`,
      [c.id, c.nome, c.cor ?? null]
    );
  }
}

// ——— Produtos ———
export async function getProdutos(): Promise<ProdutoComEstoque[]> {
  if (tauriDb) {
    const rows = (await tauriDb.select(`SELECT * FROM produtos ORDER BY codigo`)) as ProdutoComEstoque[];
    return rows.map((r: ProdutoComEstoque) => ({
      ...r,
      status: calcularStatus(r.quantidade, r.estoque_minimo),
    }));
  }
  return mem.produtos.map(p => ({
    ...p,
    status: calcularStatus(p.quantidade, p.estoque_minimo),
  }));
}

export async function criarProduto(
  dados: Omit<ProdutoComEstoque, 'id' | 'created_at' | 'status'>
): Promise<ProdutoComEstoque> {
  const now = new Date().toISOString();
  const id = uuidv4();
  const produto: ProdutoComEstoque = {
    ...dados,
    id,
    created_at: now,
    status: calcularStatus(dados.quantidade, dados.estoque_minimo),
  };

  if (tauriDb) {
    await tauriDb.execute(
      `INSERT INTO produtos VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, dados.codigo, dados.nome, dados.categoria, dados.tipo, dados.unidade,
       dados.custo_unitario, dados.estoque_minimo, dados.quantidade,
       dados.local_armazenamento ?? null, dados.cor ?? null,
       dados.fornecedor_id ?? null, dados.fornecedor_nome ?? null, now]
    );
  } else {
    mem.produtos.push(produto);
  }

  return produto;
}

export async function atualizarProduto(
  id: string,
  dados: Partial<Omit<Produto, 'id' | 'created_at'> & { quantidade: number }>
): Promise<void> {
  if (tauriDb) {
    const campos = Object.entries(dados)
      .map(([k]) => `${k} = ?`)
      .join(', ');
    await tauriDb.execute(
      `UPDATE produtos SET ${campos} WHERE id = ?`,
      [...Object.values(dados), id]
    );
  } else {
    const idx = mem.produtos.findIndex(p => p.id === id);
    if (idx !== -1) {
      mem.produtos[idx] = {
        ...mem.produtos[idx],
        ...dados,
        status: calcularStatus(
          dados.quantidade ?? mem.produtos[idx].quantidade,
          dados.estoque_minimo ?? mem.produtos[idx].estoque_minimo
        ),
      };
    }
  }
}

export async function deletarProduto(id: string): Promise<void> {
  if (tauriDb) {
    await tauriDb.execute(`DELETE FROM produtos WHERE id = ?`, [id]);
  } else {
    mem.produtos = mem.produtos.filter(p => p.id !== id);
  }
}

// ——— Entradas ———
export async function getEntradas(): Promise<Entrada[]> {
  if (tauriDb) {
    return (await tauriDb.select(`SELECT * FROM entradas ORDER BY data_recebimento DESC`)) as Entrada[];
  }
  return [...mem.entradas].sort((a, b) =>
    new Date(b.data_recebimento).getTime() - new Date(a.data_recebimento).getTime()
  );
}

export async function criarEntrada(
  dados: Omit<Entrada, 'id' | 'created_at' | 'sincronizado'>
): Promise<Entrada> {
  const now = new Date().toISOString();
  const id = uuidv4();
  const entrada: Entrada = { ...dados, id, sincronizado: false, created_at: now };

  if (tauriDb) {
    await tauriDb.execute(
      `INSERT INTO entradas VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, dados.produto_id, dados.produto_nome ?? null,
       dados.fornecedor_id, dados.fornecedor_nome ?? null,
       dados.quantidade, dados.custo_unitario, dados.total,
       dados.nf_numero ?? null, dados.data_recebimento,
       dados.local_armazenamento ?? null, dados.observacoes ?? null,
       0, now]
    );
    // Atualiza quantidade do produto
    await tauriDb.execute(
      `UPDATE produtos SET quantidade = quantidade + ? WHERE id = ?`,
      [dados.quantidade, dados.produto_id]
    );
  } else {
    mem.entradas.unshift(entrada);
    const prod = mem.produtos.find(p => p.id === dados.produto_id);
    if (prod) {
      prod.quantidade += dados.quantidade;
      prod.status = calcularStatus(prod.quantidade, prod.estoque_minimo);
    }
  }

  return entrada;
}

// ——— Fornecedores ———
export async function getFornecedores(): Promise<Fornecedor[]> {
  if (tauriDb) {
    return (await tauriDb.select(`SELECT * FROM fornecedores ORDER BY nome`)) as Fornecedor[];
  }
  return [...mem.fornecedores].sort((a, b) => a.nome.localeCompare(b.nome));
}

export async function criarFornecedor(
  dados: Omit<Fornecedor, 'id' | 'created_at'>
): Promise<Fornecedor> {
  const now = new Date().toISOString();
  const id = uuidv4();
  const fornecedor: Fornecedor = { ...dados, id, created_at: now };

  if (tauriDb) {
    await tauriDb.execute(
      `INSERT INTO fornecedores VALUES (?,?,?,?,?,?,?,?)`,
      [id, dados.nome, dados.contato ?? null, dados.email ?? null,
       dados.prazo_entrega ?? null, dados.condicoes_pagamento ?? null,
       dados.ativo ? 1 : 0, now]
    );
  } else {
    mem.fornecedores.push(fornecedor);
  }

  return fornecedor;
}

export async function deletarFornecedor(id: string): Promise<void> {
  if (tauriDb) {
    await tauriDb.execute(`DELETE FROM fornecedores WHERE id = ?`, [id]);
  } else {
    mem.fornecedores = mem.fornecedores.filter(f => f.id !== id);
  }
}

// ——— Categorias ———
export async function getCategorias(): Promise<Categoria[]> {
  if (tauriDb) {
    return (await tauriDb.select(`SELECT * FROM categorias ORDER BY nome`)) as Categoria[];
  }
  return [...mem.categorias].sort((a, b) => a.nome.localeCompare(b.nome));
}

export async function criarCategoria(nome: string): Promise<Categoria> {
  const id = uuidv4();
  const cat: Categoria = { id, nome };

  if (tauriDb) {
    await tauriDb.execute(`INSERT INTO categorias VALUES (?,?,?)`, [id, nome, null]);
  } else {
    mem.categorias.push(cat);
  }

  return cat;
}

export async function deletarCategoria(id: string): Promise<void> {
  if (tauriDb) {
    await tauriDb.execute(`DELETE FROM categorias WHERE id = ?`, [id]);
  } else {
    mem.categorias = mem.categorias.filter(c => c.id !== id);
  }
}

// ——— Configurações ———
export async function getConfig(): Promise<ConfiguracaoApp> {
  if (tauriDb) {
    const rows = (await tauriDb.select(`SELECT chave, valor FROM configuracoes`)) as { chave: string; valor: string }[];
    const map: Record<string, string> = {};
    rows.forEach((r: { chave: string; valor: string }) => (map[r.chave] = r.valor));

    // Mescla com o padrão
    return {
      ...configPadraoSeed,
      nome_loja:               map['nome_loja']               ?? configPadraoSeed.nome_loja,
      cnpj:                    map['cnpj']                    ?? configPadraoSeed.cnpj,
      supabase_url:            map['supabase_url']            ?? '',
      supabase_key:            map['supabase_key']            ?? '',
      sync_automatico:         map['sync_automatico']         === 'true',
      notif_estoque_critico:   map['notif_estoque_critico']   !== 'false',
      notif_nova_entrada:      map['notif_nova_entrada']      !== 'false',
      notif_relatorio_semanal: map['notif_relatorio_semanal'] === 'true',
      claude_api_key:          map['claude_api_key']          ?? '',
      alertas_ia:              map['alertas_ia']              === 'true',
      tema:                    (map['tema'] as 'claro' | 'escuro') ?? 'escuro',
    };
  }
  return { ...mem.config };
}

export async function salvarConfig(config: ConfiguracaoApp): Promise<void> {
  const now = new Date().toISOString();

  if (tauriDb) {
    const entries = Object.entries(config) as [string, unknown][];
    for (const [k, v] of entries) {
      await tauriDb.execute(
        `INSERT INTO configuracoes (chave, valor, updated_at) VALUES (?,?,?)
         ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor, updated_at = excluded.updated_at`,
        [k, String(v), now]
      );
    }
  } else {
    mem.config = { ...config };
  }
}

// ——— Métricas para o Dashboard ———
export async function getMetricas() {
  const produtos = await getProdutos();
  const entradas = await getEntradas();
  const fornecedores = await getFornecedores();

  const agora = new Date();
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
  const semanaAtras = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);

  const totalItens = produtos.reduce((s, p) => s + p.quantidade, 0);
  const valorTotal = produtos.reduce((s, p) => s + p.quantidade * p.custo_unitario, 0);
  const itensCriticos = produtos.filter(p => p.status === 'critico' || p.status === 'baixo').length;

  const entradasMes = entradas.filter(e =>
    new Date(e.data_recebimento) >= inicioMes
  ).length;

  const entradasSemana = entradas.filter(e =>
    new Date(e.data_recebimento) >= semanaAtras
  ).length;

  return {
    total_itens: Math.round(totalItens),
    valor_total: Math.round(valorTotal),
    itens_criticos: itensCriticos,
    entradas_mes: entradasMes,
    total_fornecedores: fornecedores.length,
    variacao_semanal: entradasSemana,
    variacao_valor_pct: 5.2,
  };
}
