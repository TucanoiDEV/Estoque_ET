import { useRef, useState, FormEvent, ChangeEvent } from 'react'
import { createPortal } from 'react-dom'
import { IconX, IconLoader2, IconUser, IconCamera, IconLock } from '@tabler/icons-react'
import { supabase, db } from '../../services/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../shared/Toast'

interface Props {
  onFechar: () => void
}

const TAMANHO_MAX_MB = 5

export function EditarPerfilModal({ onFechar }: Props) {
  const { usuario, atualizarUsuario } = useAuth()
  const { mostrarToast } = useToast()
  const inputFotoRef = useRef<HTMLInputElement>(null)

  const [enviandoFoto, setEnviandoFoto] = useState(false)

  // Redefinir senha (troca direta, sem e-mail)
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [salvandoSenha, setSalvandoSenha] = useState(false)
  const [erroSenha, setErroSenha] = useState<string | null>(null)

  async function aoSelecionarFoto(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    e.target.value = '' // permite reenviar o mesmo arquivo depois
    if (!arquivo || !usuario) return

    if (!arquivo.type.startsWith('image/')) {
      mostrarToast('Selecione um arquivo de imagem.', 'erro')
      return
    }
    if (arquivo.size > TAMANHO_MAX_MB * 1024 * 1024) {
      mostrarToast(`A imagem deve ter no máximo ${TAMANHO_MAX_MB} MB.`, 'erro')
      return
    }

    setEnviandoFoto(true)
    try {
      const ext = (arquivo.name.split('.').pop() ?? 'png').toLowerCase()
      const caminho = `${usuario.id}/avatar.${ext}`

      const { error: erroUpload } = await supabase.storage
        .from('avatars')
        .upload(caminho, arquivo, { upsert: true, contentType: arquivo.type })
      if (erroUpload) {
        console.error('[Perfil] Falha no upload para o Storage:', erroUpload)
        throw new Error(erroUpload.message)
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(caminho)
      // Cache-busting para a nova foto aparecer na hora
      const url = `${data.publicUrl}?t=${Date.now()}`

      const { error: erroBanco } = await db.usuarios().update({ avatar_url: url }).eq('id', usuario.id)
      if (erroBanco) {
        console.error('[Perfil] Falha ao salvar avatar_url em usuarios:', erroBanco)
        throw new Error(erroBanco.message)
      }

      atualizarUsuario({ avatar_url: url })
      mostrarToast('Foto atualizada com sucesso!', 'sucesso')
    } catch (err) {
      console.error('[Perfil] Erro ao atualizar foto:', err)
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      const bucketFaltando = msg.toLowerCase().includes('bucket') || msg.toLowerCase().includes('not found')
      const semPermissao = msg.toLowerCase().includes('row-level security') || msg.toLowerCase().includes('policy')
      mostrarToast(
        bucketFaltando
          ? 'Bucket "avatars" não encontrado. Rode supabase/perfil.sql no Supabase.'
          : semPermissao
            ? 'Sem permissão no Storage. Confira se as policies do perfil.sql foram criadas.'
            : `Erro ao enviar a foto: ${msg}`,
        'erro'
      )
    } finally {
      setEnviandoFoto(false)
    }
  }

  async function salvarSenha(e: FormEvent) {
    e.preventDefault()
    setErroSenha(null)

    if (novaSenha.length < 6) {
      setErroSenha('A senha deve ter ao menos 6 caracteres.')
      return
    }
    if (novaSenha !== confirmarSenha) {
      setErroSenha('As senhas não coincidem.')
      return
    }

    setSalvandoSenha(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: novaSenha })
      if (error) throw new Error(error.message)
      mostrarToast('Senha redefinida com sucesso!', 'sucesso')
      setNovaSenha('')
      setConfirmarSenha('')
      setMostrarSenha(false)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      setErroSenha(msg)
      mostrarToast(`Erro ao redefinir senha: ${msg}`, 'erro')
    } finally {
      setSalvandoSenha(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-dark-card border border-dark-border rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-border sticky top-0 bg-dark-card z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-blue/15 rounded-lg flex items-center justify-center">
              <IconUser size={16} className="text-brand-blue" />
            </div>
            <h2 className="text-base font-bold text-white">Editar perfil</h2>
          </div>
          <button
            onClick={onFechar}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-dark-hover transition-colors"
          >
            <IconX size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Foto */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-36 h-36 rounded-full bg-dark-hover border border-dark-border overflow-hidden flex items-center justify-center">
                {usuario?.avatar_url ? (
                  <img src={usuario.avatar_url} alt="Foto de perfil" className="w-full h-full object-cover" />
                ) : (
                  <IconUser size={60} className="text-gray-500" />
                )}
                {enviandoFoto && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <IconLoader2 size={28} className="animate-spin text-white" />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => inputFotoRef.current?.click()}
                disabled={enviandoFoto}
                title="Selecionar foto"
                className="absolute bottom-1 right-1 w-10 h-10 rounded-full bg-brand-blue hover:bg-blue-600 text-white flex items-center justify-center shadow-lg disabled:opacity-60"
              >
                <IconCamera size={18} />
              </button>
            </div>
            <button
              type="button"
              onClick={() => inputFotoRef.current?.click()}
              disabled={enviandoFoto}
              className="text-sm font-medium text-brand-blue hover:text-blue-400 disabled:opacity-60"
            >
              Selecionar foto dos arquivos
            </button>
            <input
              ref={inputFotoRef}
              type="file"
              accept="image/*"
              onChange={aoSelecionarFoto}
              className="hidden"
            />
            <p className="text-[11px] text-gray-500">PNG ou JPG, até {TAMANHO_MAX_MB} MB.</p>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
            <div className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-gray-300">
              {usuario?.email ?? '—'}
            </div>
          </div>

          {/* Redefinir senha */}
          <div className="border-t border-dark-border pt-5">
            {!mostrarSenha ? (
              <button
                type="button"
                onClick={() => setMostrarSenha(true)}
                className="flex items-center gap-2 text-sm font-medium text-white hover:text-brand-blue transition-colors"
              >
                <IconLock size={16} />
                Redefinir senha
              </button>
            ) : (
              <form onSubmit={salvarSenha} className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <IconLock size={16} className="text-brand-blue" />
                  Redefinir senha
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Nova senha</label>
                  <input
                    type="password"
                    value={novaSenha}
                    onChange={(e) => { setNovaSenha(e.target.value); setErroSenha(null) }}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-blue transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Confirmar nova senha</label>
                  <input
                    type="password"
                    value={confirmarSenha}
                    onChange={(e) => { setConfirmarSenha(e.target.value); setErroSenha(null) }}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-blue transition-colors"
                  />
                </div>
                {erroSenha && <p className="text-xs text-brand-red">{erroSenha}</p>}
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => { setMostrarSenha(false); setNovaSenha(''); setConfirmarSenha(''); setErroSenha(null) }}
                    className="flex-1 py-2 rounded-lg text-sm font-semibold text-gray-400 border border-dark-border hover:bg-dark-hover transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={salvandoSenha}
                    className="flex-1 py-2 rounded-lg text-sm font-semibold bg-brand-blue hover:bg-blue-600 text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {salvandoSenha && <IconLoader2 size={14} className="animate-spin" />}
                    {salvandoSenha ? 'Salvando...' : 'Salvar nova senha'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Fechar */}
          <button
            type="button"
            onClick={onFechar}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-gray-400 border border-dark-border hover:bg-dark-hover transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
