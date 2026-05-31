// Cria os usuários operador e viewer que faltam no Auth e ajusta os cargos.
// Depende do trigger handle_new_user (fix_permissoes.sql) para criar o perfil.
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  readFileSync('.env', 'utf8').split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)
const URL = env.VITE_SUPABASE_URL
const ANON = env.VITE_SUPABASE_ANON_KEY

const NOVOS = [
  { email: 'operador@armazemmachado.demo', senha: 'Operador@123', nome: 'Operador', cargo: 'operador' },
  { email: 'viewer@armazemmachado.demo', senha: 'Visual@123', nome: 'Visualizador', cargo: 'visualizador' },
]

async function main() {
  console.log(`\n🔗 ${URL}\n`)

  // 1. Cria via signUp
  for (const u of NOVOS) {
    const c = createClient(URL, ANON, { auth: { persistSession: false } })
    const { data, error } = await c.auth.signUp({ email: u.email, password: u.senha })
    if (error) {
      if (error.message.toLowerCase().includes('already')) console.log(`ℹ️  ${u.email} já existe`)
      else console.log(`❌ signUp ${u.email}: ${error.message}`)
    } else {
      const confirmado = !!data.session
      console.log(`✅ signUp ${u.email} — ${confirmado ? 'ativo (sem confirmação de email)' : 'criado, PODE precisar confirmar email'}`)
    }
  }

  // 2. Loga como admin e ajusta os cargos na tabela usuarios
  const admin = createClient(URL, ANON, { auth: { persistSession: false } })
  const { error: eLogin } = await admin.auth.signInWithPassword({ email: 'admin@armazemmachado.demo', password: 'Admin@123' })
  if (eLogin) { console.log(`\n❌ Não consegui logar como admin para ajustar cargos: ${eLogin.message}`); process.exit(1) }

  console.log('\n— Ajustando cargos —')
  for (const u of NOVOS) {
    // Acha o id pelo email (o trigger já criou a linha como 'operador')
    const { data: linha } = await admin.from('usuarios').select('id, cargo').eq('email', u.email).maybeSingle()
    if (!linha) { console.log(`ℹ️  ${u.email}: ainda sem linha em usuarios (trigger pode não ter rodado / email não confirmado)`); continue }
    if (linha.cargo === u.cargo) { console.log(`✅ ${u.email}: cargo já '${u.cargo}'`); continue }
    const { error } = await admin.from('usuarios').update({ cargo: u.cargo, nome: u.nome }).eq('id', linha.id)
    if (error) console.log(`❌ ${u.email}: erro ao ajustar cargo — ${error.message}`)
    else console.log(`✅ ${u.email}: cargo ajustado '${linha.cargo}' → '${u.cargo}'`)
  }

  // 3. Lista final
  const { data: todos } = await admin.from('usuarios').select('email, cargo, nome').order('email')
  console.log('\n— Usuários em public.usuarios —')
  ;(todos ?? []).forEach((u) => console.log(`  • ${u.email}  [${u.cargo}]  ${u.nome}`))
  process.exit(0)
}
main().catch((e) => { console.error(e); process.exit(1) })
