// Serviço de integração com a API Claude para alertas inteligentes

import type { ProdutoComEstoque } from '../types';

interface AlertaIA {
  tipo: 'critico' | 'aviso' | 'sugestao';
  mensagem: string;
  produto?: string;
}

// Analisa o estoque com IA e retorna alertas
export async function analisarEstoque(
  apiKey: string,
  produtos: ProdutoComEstoque[]
): Promise<AlertaIA[]> {
  if (!apiKey) return [];

  const criticos = produtos.filter(p => p.status === 'critico');
  const baixos = produtos.filter(p => p.status === 'baixo');

  if (criticos.length === 0 && baixos.length === 0) return [];

  const resumo = [
    ...criticos.map(p => `CRÍTICO: ${p.nome} (${p.quantidade}${p.unidade}, mínimo: ${p.estoque_minimo}${p.unidade})`),
    ...baixos.map(p => `BAIXO: ${p.nome} (${p.quantidade}${p.unidade}, mínimo: ${p.estoque_minimo}${p.unidade})`),
  ].join('\n');

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: `Analise o estoque abaixo e retorne um JSON com array de alertas.
Cada alerta deve ter: tipo ("critico"|"aviso"|"sugestao"), mensagem (curta, em português), produto (nome do produto).
Responda APENAS o JSON, sem markdown.

Estoque:
${resumo}`,
          },
        ],
      }),
    });

    if (!res.ok) return alertasFallback(criticos, baixos);

    const data = await res.json() as { content: { text: string }[] };
    const text = data.content?.[0]?.text ?? '[]';
    return JSON.parse(text) as AlertaIA[];
  } catch {
    return alertasFallback(criticos, baixos);
  }
}

function alertasFallback(
  criticos: ProdutoComEstoque[],
  baixos: ProdutoComEstoque[]
): AlertaIA[] {
  return [
    ...criticos.map(p => ({
      tipo: 'critico' as const,
      mensagem: `${p.nome} está em nível crítico (${p.quantidade}${p.unidade})`,
      produto: p.nome,
    })),
    ...baixos.map(p => ({
      tipo: 'aviso' as const,
      mensagem: `${p.nome} está abaixo do mínimo (${p.quantidade}${p.unidade})`,
      produto: p.nome,
    })),
  ];
}
