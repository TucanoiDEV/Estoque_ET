// Testa o Supabase Realtime: uma sessão insere, a outra deve receber o evento.
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  readFileSync('.env', 'utf8').split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)
const URL = env.VITE_SUPABASE_URL, ANON = env.VITE_SUPABASE_ANON_KEY

async function main() {
  // Sessão A: ouvinte
  const a = createClient(URL, ANON, { auth: { persistSession: false } })
  const { data: sessA } = await a.auth.signInWithPassword({ email: 'admin@armazemmachado.demo', password: 'Admin@123' })
  // Passa o token de auth ao canal realtime (RLS)
  a.realtime.setAuth(sessA.session.access_token)
  // Sessão B: quem escreve
  const b = createClient(URL, ANON, { auth: { persistSession: false } })
  await b.auth.signInWithPassword({ email: 'admin@armazemmachado.demo', password: 'Admin@123' })

  const { data: prod } = await b.from('produtos').select('id').limit(1).maybeSingle()

  let recebido = false
  const canal = a.channel('teste-realtime')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'entradas' }, (payload) => {
      recebido = true
      console.log('  📡 Sessão A recebeu evento realtime:', payload.new?.nf_numero)
    })

  await new Promise((resolve) => {
    canal.subscribe((status) => { if (status === 'SUBSCRIBED') resolve() })
  })
  console.log('✅ Sessão A inscrita no canal realtime')

  // Sessão B insere
  const { data: ent, error } = await b.from('entradas').insert({
    produto_id: prod.id, usuario_id: null, quantidade: 1, nf_numero: 'TEST-RT', status: 'recebido',
  }).select('id').maybeSingle()
  if (error) { console.log('❌ Insert falhou:', error.message); process.exit(1) }
  console.log('✅ Sessão B inseriu entrada')

  // Aguarda até 12s pelo evento
  for (let i = 0; i < 120 && !recebido; i++) await new Promise((r) => setTimeout(r, 100))

  console.log(recebido ? '\n✅ REALTIME FUNCIONA — propagação entre sessões OK'
                       : '\n❌ REALTIME NÃO PROPAGOU — verifique se as tabelas estão na publicação supabase_realtime')

  // Cleanup
  await b.from('entradas').delete().eq('id', ent.id)
  await a.removeChannel(canal)
  process.exit(recebido ? 0 : 1)
}
main().catch((e) => { console.error(e); process.exit(1) })
