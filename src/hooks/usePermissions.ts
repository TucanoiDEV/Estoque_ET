import { useAuth } from './useAuth'
import type { Cargo } from '../types'

// Hook de permissões — lê o cargo do usuário logado e expõe checadores
export function usePermissions() {
  const { usuario } = useAuth()
  const cargo: Cargo | undefined = usuario?.cargo

  const isAdmin = () => cargo === 'admin'
  const isOperador = () => cargo === 'operador'
  const isVisualizador = () => cargo === 'visualizador'

  const canEdit = () => cargo === 'admin' || cargo === 'operador'
  const canDelete = () => cargo === 'admin'
  const canExport = () => cargo === 'admin'
  const canExportLimitado = () => cargo === 'admin' || cargo === 'operador'
  const canManageUsers = () => cargo === 'admin'
  const canViewReports = () => cargo === 'admin'
  const canViewOwnReports = () => cargo === 'admin' || cargo === 'operador'
  const canRegisterEntrada = () => cargo === 'admin' || cargo === 'operador'
  const canRegisterSaida = () => cargo === 'admin' || cargo === 'operador'
  const canManageFornecedores = () => cargo === 'admin'
  const canCadastrarFornecedor = () => cargo === 'admin' || cargo === 'operador'
  const canChangeSettings = () => cargo === 'admin'
  const canConfigureIA = () => cargo === 'admin'

  return {
    cargo,
    isAdmin,
    isOperador,
    isVisualizador,
    canEdit,
    canDelete,
    canExport,
    canExportLimitado,
    canManageUsers,
    canViewReports,
    canViewOwnReports,
    canRegisterEntrada,
    canRegisterSaida,
    canManageFornecedores,
    canCadastrarFornecedor,
    canChangeSettings,
    canConfigureIA,
  }
}
