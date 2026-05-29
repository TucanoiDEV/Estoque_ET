// Serviço de integração com a API do Claude (Anthropic)
// A API Key é configurada pelo usuário Admin nas Configurações

export interface RespostaIA {
  texto: string
  sucesso: boolean
  erro?: string
}

export async function consultarIA(prompt: string, apiKey: string): Promise<RespostaIA> {
  if (!apiKey) {
    return { texto: '', sucesso: false, erro: 'API Key do Claude não configurada.' }
  }

  try {
    // Chamada direta à API da Anthropic
    // Em produção, isso deveria passar por um proxy/edge function para proteger a key
    const resposta = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        system:
          'Você é um assistente de gestão de estoque. Analise dados e forneça insights práticos em português, de forma concisa.',
      }),
    })

    if (!resposta.ok) {
      const erro = await resposta.json()
      return { texto: '', sucesso: false, erro: erro.error?.message ?? 'Erro ao consultar IA.' }
    }

    const dados = await resposta.json()
    const texto = dados.content?.[0]?.text ?? ''
    return { texto, sucesso: true }
  } catch (err) {
    return { texto: '', sucesso: false, erro: 'Falha de conexão com a API do Claude.' }
  }
}

// Gera um alerta inteligente baseado nos dados de estoque crítico
export function gerarPromptEstoqueCritico(itensCriticos: { nome: string; quantidade: number; minimo: number }[]): string {
  const lista = itensCriticos.map((i) => `- ${i.nome}: ${i.quantidade} unidades (mínimo: ${i.minimo})`).join('\n')
  return `Os seguintes produtos estão com estoque crítico:\n${lista}\n\nSugira ações prioritárias de reposição de forma resumida.`
}
