import { useState, useEffect } from 'react'
import { IconTrash, IconEdit, IconLoader2, IconUser } from '@tabler/icons-react'
import { db } from '../../services/supabase'
import { useToast } from '../shared/Toast'
import { usePermissions } from '../../hooks/usePermissions'
import { useAuth } from '../../hooks/useAuth'
import type { Usuario, Cargo } from '../../types'

const badgeCargo: Record<Cargo, string> = {
  developer: 'bg-brand-green/20 text-brand-green',
  admin: 'bg-brand-purple/20 text-brand-purple',
  operador: 'bg-brand-blue/20 text-brand-blue',
  visualizador: 'bg-gray-500/20 text-gray-400',
}

export function UsuariosSection() {
  const { mostrarToast } = useToast()
  const { canManageUsers } = usePermissions()
  const { usuario: usuarioLogado } = useAuth()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState<Usuario | null>(null)
  const [novoCargo, setNovoCargo] = useState<Cargo>('visualizador')
  const [salvando, setSalvando] = useState(false)

  async function carregar() {
    setLoading(true)
    const { data } = await db.usuarios().select('*').order('nome')
    setUsuarios((data as Usuario[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { carregar() }, [])

  async function salvarCargo() {
    if (!editando) return
    setSalvando(true)
    const { error } = await db.usuarios().update({ cargo: novoCargo }).eq('id', editando.id)
    if (error) {
      mostrarToast('Erro ao atualizar cargo.', 'erro')
    } else {
      mostrarToast('Cargo atualizado!', 'sucesso')
      setEditando(null)
      carregar()
    }
    setSalvando(false)
  }

  async function remover(usuario: Usuario) {
    if (usuario.id === usuarioLogado?.id) {
      mostrarToast('Você não pode remover sua própria conta.', 'aviso')
      return
    }
    if (!confirm(`Remover usuário "${usuario.nome}"?`)) return
    await db.usuarios().delete().eq('id', usuario.id)
    mostrarToast(`Usuário "${usuario.nome}" removido.`, 'sucesso')
    carregar()
  }

  if (!canManageUsers()) {
    return (
      <div className="py-12 text-center text-gray-500 text-sm">
        Apenas administradores podem gerenciar usuários.
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-white">Usuários do sistema</h3>
        <p className="text-xs text-gray-500 mt-0.5">Gerencie cargos e acessos</p>
      </div>

      {/* Modal edição de cargo */}
      {editando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-dark-card border border-dark-border rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-base font-bold text-white mb-4">Editar cargo</h2>
            <p className="text-sm text-gray-400 mb-4">Usuário: <span className="text-white">{editando.nome}</span></p>
            <select
              value={novoCargo}
              onChange={(e) => setNovoCargo(e.target.value as Cargo)}
              className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-blue mb-5"
            >
              <option value="developer">Developer</option>
              <option value="admin">Admin</option>
              <option value="operador">Operador</option>
              <option value="visualizador">Visualizador</option>
            </select>
            <div className="flex gap-3">
              <button onClick={() => setEditando(null)} className="flex-1 py-2 rounded-lg text-sm text-gray-400 border border-dark-border hover:bg-dark-hover">Cancelar</button>
              <button onClick={salvarCargo} disabled={salvando} className="flex-1 py-2 rounded-lg text-sm font-semibold bg-brand-blue text-white hover:bg-blue-600 disabled:opacity-60 flex items-center justify-center gap-2">
                {salvando && <IconLoader2 size={14} className="animate-spin" />}
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="animate-pulse space-y-2">
          {[0,1,2].map((i) => <div key={i} className="h-14 bg-dark-hover rounded-xl" />)}
        </div>
      ) : (
        <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-border">
                {['Usuário', 'Email', 'Cargo', ''].map((col) => (
                  <th key={col} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="border-b border-dark-border/50 hover:bg-dark-hover/40">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-dark-hover flex items-center justify-center">
                        <IconUser size={13} className="text-gray-400" />
                      </div>
                      <span className="font-medium text-white">{u.nome}</span>
                      {u.id === usuarioLogado?.id && (
                        <span className="text-xs text-gray-500">(você)</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-400">{u.email}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeCargo[u.cargo]}`}>
                      {u.cargo}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditando(u); setNovoCargo(u.cargo) }} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-brand-blue hover:bg-brand-blue/10">
                        <IconEdit size={15} />
                      </button>
                      <button onClick={() => remover(u)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-brand-red hover:bg-brand-red/10">
                        <IconTrash size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
