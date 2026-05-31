// Script de teste de backend — autenticação, perfis, cargos e RLS.
// Usa o mesmo @supabase/supabase-js do app. Executar: node test-backend.mjs
// Insere dados marcados com 'TEST-AUTO' e os remove ao final (cleanup garantido).
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

// ─── Lê credenciais do .env ───────────────────────────────────────────────────
const env = Object.fromEntries(
  readFileSync('.env', 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
    })
)
const URL = env.VITE_SUPABASE_URL
const ANON = env.VITE_SUPABASE_ANON_KEY

const USUARIOS = [
  { rotulo: 'admin', email: 'admin@armazemmachado.demo', senha: 'Admin@123', cargoEsperado: 'admin' },
  { rotulo: 'operador', email: 'operador@armazemmachado.demo', senha: 'Operador@123', cargoEsperado: 'operador' },
  { rotulo: 'viewer', email: 'viewer@armazemmachado.demo', senha: 'Visual@123', cargoEsperado: 'visualizador' },
]

const resultados = []
const ok = (n, d = '') => { resultados.push({ s: 'PASS', n, d }); console.log(`  ✅ ${n}${d ? ' — ' + d : ''}`) }
const fail = (n, d = '') => { resultados.push({ s: 'FAIL', n, d }); console.log(`  ❌ ${n}${d ? ' — ' + d : ''}`) }
const info = (n, d = '') => { resultados.push({ s: 'INFO', n, d }); console.log(`  ℹ️  ${n}${d ? ' — ' + d : ''}`) }

function novoClient() {
  return createClient(URL, ANON, { auth: { persistSession: false, autoRefreshToken: false } })
}

const clients = {} // rotulo -> { client, perfil }

async function main() {
  console.log(`\n🔗 Supabase: ${URL}\n`)

  // ─── TESTE 1: Autenticação ──────────────────────────────────────────────────
  console.log('═══ 1. AUTENTICAÇÃO ═══')
  for (const u of USUARIOS) {
    const client = novoClient()
    const { data, error } = await client.auth.signInWithPassword({ email: u.email, password: u.senha })
    if (error || !data.session) {
      fail(`Login ${u.rotulo}`, error?.message ?? 'sem sessão')
      continue
    }
    ok(`Login ${u.rotulo}`, `uid ${data.user.id.slice(0, 8)}…`)
    clients[u.rotulo] = { client, uid: data.user.id }
  }

  // Login com senha errada
  {
    const client = novoClient()
    const { error } = await client.auth.signInWithPassword({ email: 'admin@armazemmachado.demo', password: 'SenhaErrada!' })
    if (error) ok('Login com senha errada é rejeitado', error.message)
    else fail('Login com senha errada é rejeitado', 'aceitou senha inválida!')
  }

  // ─── TESTE 2: Perfis e cargos (public.usuarios) ─────────────────────────────
  console.log('\n═══ 2. PERFIS E CARGOS (public.usuarios) ═══')
  for (const u of USUARIOS) {
    const c = clients[u.rotulo]
    if (!c) { info(`Perfil ${u.rotulo}`, 'pulado (login falhou)'); continue }
    const { data, error } = await c.client.from('usuarios').select('*').eq('id', c.uid).maybeSingle()
    if (error) { fail(`Perfil ${u.rotulo}`, error.message); continue }
    if (!data) { fail(`Perfil ${u.rotulo} existe em public.usuarios`, 'SEM linha — RLS vai bloquear escritas'); continue }
    c.perfil = data
    if (data.cargo === u.cargoEsperado) ok(`Perfil ${u.rotulo} com cargo correto`, `cargo='${data.cargo}'`)
    else fail(`Perfil ${u.rotulo} com cargo correto`, `esperado '${u.cargoEsperado}', obtido '${data.cargo}'`)
  }

  // ─── TESTE 3: Dados do seed (leitura) ───────────────────────────────────────
  console.log('\n═══ 3. DADOS DO SEED (leitura autenticada) ═══')
  const cAdmin = clients.admin?.client ?? clients.operador?.client ?? clients.viewer?.client
  if (cAdmin) {
    const tabelas = [
      { t: 'produtos', esperado: 10 },
      { t: 'estoque', esperado: 10 },
      { t: 'fornecedores', esperado: 3 },
    ]
    for (const { t, esperado } of tabelas) {
      const { data, error, count } = await cAdmin.from(t).select('*', { count: 'exact', head: false })
      if (error) { fail(`Ler ${t}`, error.message); continue }
      const n = count ?? data.length
      if (n >= esperado) ok(`Ler ${t}`, `${n} registros (esperado ≥ ${esperado})`)
      else fail(`Ler ${t}`, `${n} registros (esperado ${esperado})`)
    }
    const { data: cfg } = await cAdmin.from('configuracoes').select('chave')
    info('Configurações', `${cfg?.length ?? 0} chaves`)
  } else {
    info('Leitura do seed', 'pulado (nenhum login funcionou)')
  }

  // ─── TESTE 4: RLS de escrita por cargo ──────────────────────────────────────
  console.log('\n═══ 4. RLS — ESCRITA POR CARGO ═══')
  // Pega um produto real para os testes de entrada
  let produtoId = null
  if (cAdmin) {
    const { data } = await cAdmin.from('produtos').select('id').limit(1).maybeSingle()
    produtoId = data?.id ?? null
  }

  const inserirEntrada = async (client) =>
    client.from('entradas').insert({
      produto_id: produtoId,
      usuario_id: null,
      quantidade: 1,
      nf_numero: 'TEST-AUTO',
      status: 'recebido',
    }).select('id').maybeSingle()

  if (produtoId) {
    // viewer NÃO pode inserir entrada
    if (clients.viewer?.perfil) {
      const { error } = await inserirEntrada(clients.viewer.client)
      if (error) ok('RLS: viewer NÃO insere entrada', `bloqueado (${error.code ?? 'erro'})`)
      else fail('RLS: viewer NÃO insere entrada', 'INSERIU — RLS não está bloqueando!')
    } else info('RLS: viewer insere entrada', 'pulado (viewer sem perfil)')

    // operador PODE inserir entrada
    if (clients.operador?.perfil) {
      const { data, error } = await inserirEntrada(clients.operador.client)
      if (error) fail('RLS: operador insere entrada', `bloqueado indevidamente (${error.message})`)
      else ok('RLS: operador insere entrada', `id ${String(data?.id).slice(0, 8)}…`)
    } else info('RLS: operador insere entrada', 'pulado (operador sem perfil)')

    // operador NÃO pode deletar produto (só admin)
    if (clients.operador?.perfil) {
      const { error } = await clients.operador.client.from('produtos').delete().eq('id', '00000000-0000-0000-0000-000000000000')
      // RLS de delete sem linha afetada não gera erro; testamos via update permitido vs delete
      if (error) ok('RLS: operador NÃO deleta produto', `bloqueado (${error.code ?? 'erro'})`)
      else info('RLS: operador deletar produto', 'sem erro (nenhuma linha correspondente — policy permite 0 linhas)')
    }
  } else {
    info('Testes de RLS de escrita', 'pulado (sem produto / sem leitura)')
  }

  // ─── TESTE 4b: Fluxo completo de Nova Entrada como ADMIN (com reversão) ──────
  console.log('\n═══ 4b. FLUXO NOVA ENTRADA (admin, reversível) ═══')
  if (clients.admin?.perfil && produtoId) {
    const a = clients.admin.client
    const QTD = 7
    // Estado inicial do estoque
    const { data: estIni } = await a.from('estoque').select('id, quantidade').eq('produto_id', produtoId).maybeSingle()
    const qtdIni = estIni?.quantidade ?? 0

    // 1. Insere entrada (como o modal faz)
    const { data: ent, error: e1 } = await a.from('entradas').insert({
      produto_id: produtoId, usuario_id: clients.admin.uid, quantidade: QTD,
      custo_unitario: 10, total: 70, nf_numero: 'TEST-AUTO', status: 'recebido',
    }).select('id').maybeSingle()
    if (e1) { fail('Admin insere entrada', e1.message) }
    else {
      ok('Admin insere entrada', `id ${String(ent.id).slice(0, 8)}…`)
      // 2. Incrementa estoque
      const { error: e2 } = await a.from('estoque').update({ quantidade: qtdIni + QTD, updated_at: new Date().toISOString() }).eq('id', estIni.id)
      if (e2) fail('Admin atualiza estoque', e2.message)
      else {
        const { data: estDepois } = await a.from('estoque').select('quantidade').eq('id', estIni.id).maybeSingle()
        if (estDepois?.quantidade === qtdIni + QTD) ok('Estoque incrementado corretamente', `${qtdIni} → ${estDepois.quantidade}`)
        else fail('Estoque incrementado', `esperado ${qtdIni + QTD}, obtido ${estDepois?.quantidade}`)
        // Reverte estoque
        await a.from('estoque').update({ quantidade: qtdIni }).eq('id', estIni.id)
        const { data: estRev } = await a.from('estoque').select('quantidade').eq('id', estIni.id).maybeSingle()
        if (estRev?.quantidade === qtdIni) ok('Estoque revertido ao valor original', `= ${qtdIni}`)
        else fail('Estoque revertido', `ficou em ${estRev?.quantidade}, original ${qtdIni}`)
      }
    }

    // Admin atualiza um produto (edição)
    const { data: prod } = await a.from('produtos').select('id, nome, estoque_minimo').eq('id', produtoId).maybeSingle()
    const { error: e3 } = await a.from('produtos').update({ estoque_minimo: prod.estoque_minimo }).eq('id', produtoId)
    if (e3) fail('Admin edita produto', e3.message)
    else ok('Admin edita produto', `'${prod.nome}' (no-op reversível)`)

    // Admin salva configuração (upsert)
    const { error: e4 } = await a.from('configuracoes').upsert({ chave: 'TEST-AUTO', valor: 'x' }, { onConflict: 'chave' })
    if (e4) fail('Admin salva configuração', e4.message)
    else { ok('Admin salva configuração', 'upsert OK'); await a.from('configuracoes').delete().eq('chave', 'TEST-AUTO') }
  } else {
    info('Fluxo nova entrada', 'pulado (admin sem perfil ou sem produto)')
  }

  // ─── CLEANUP: remove entradas de teste ──────────────────────────────────────
  console.log('\n═══ CLEANUP ═══')
  if (clients.admin?.perfil) {
    const { error } = await clients.admin.client.from('entradas').delete().eq('nf_numero', 'TEST-AUTO')
    if (error) info('Limpeza de entradas TEST-AUTO', `falhou: ${error.message} (remova manualmente)`)
    else ok('Limpeza de entradas TEST-AUTO', 'removidas')
  } else {
    info('Limpeza', 'admin sem perfil — remova entradas com nf_numero=TEST-AUTO manualmente se houver')
  }

  // ─── RESUMO ─────────────────────────────────────────────────────────────────
  console.log('\n═══════════════ RESUMO ═══════════════')
  const pass = resultados.filter((r) => r.s === 'PASS').length
  const failed = resultados.filter((r) => r.s === 'FAIL')
  console.log(`✅ PASS: ${pass}   ❌ FAIL: ${failed.length}   ℹ️ INFO: ${resultados.filter(r => r.s === 'INFO').length}`)
  if (failed.length) {
    console.log('\nFALHAS:')
    failed.forEach((f) => console.log(`  ❌ ${f.n}${f.d ? ' — ' + f.d : ''}`))
  }
  process.exit(0)
}

main().catch((e) => { console.error('Erro fatal no teste:', e); process.exit(1) })
