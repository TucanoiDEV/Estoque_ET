// Valida o bloqueio de exclusão de fornecedor que possui entradas vinculadas.
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  readFileSync('.env', 'utf8').split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)
const c = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false } })

async function main() {
  await c.auth.signInWithPassword({ email: 'admin@armazemmachado.demo', password: 'Admin@123' })

  // 1. Cria fornecedor de teste
  const { data: forn } = await c.from('fornecedores').insert({ nome: 'TEST-FK' }).select('id').single()
  // 2. Cria entrada vinculada a ele
  const { data: prod } = await c.from('produtos').select('id').limit(1).single()
  const { data: ent } = await c.from('entradas')
    .insert({ produto_id: prod.id, fornecedor_id: forn.id, usuario_id: null, quantidade: 1, nf_numero: 'TEST-FK', status: 'recebido' })
    .select('id').single()
  console.log('✅ Fornecedor + entrada de teste criados')

  // 3. Tenta excluir o fornecedor (deve FALHAR por FK)
  const { error } = await c.from('fornecedores').delete().eq('id', forn.id)
  if (error && (error.code === '23503' || /foreign key/i.test(error.message))) {
    console.log(`✅ BLOQUEADO corretamente — código ${error.code} (fornecedor em uso)`)
  } else if (error) {
    console.log(`⚠️ Bloqueado por outro motivo: ${error.message}`)
  } else {
    console.log('❌ FALHA: excluiu mesmo tendo entrada vinculada!')
  }

  // 4. Limpeza: remove entrada, depois fornecedor
  await c.from('entradas').delete().eq('id', ent.id)
  const { error: erroDel } = await c.from('fornecedores').delete().eq('id', forn.id)
  console.log(erroDel ? `⚠️ Limpeza do fornecedor falhou: ${erroDel.message}` : '✅ Limpeza OK (entrada removida, fornecedor agora exclui)')
  process.exit(0)
}
main().catch((e) => { console.error(e); process.exit(1) })
