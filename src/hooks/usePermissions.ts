import { useAuth } from './useAuth'
import type { Cargo } from '../types'

// Hook de permissões — lê o cargo do usuário logado e expõe checadores
export function usePermissions() {
  const { usuario } = useAuth()
  const cargo: Cargo | undefined = usuario?.cargo

  // O developer é um "super-admin": tem acesso total a tudo que o admin faz
  // (no banco, o RLS também o trata como admin via get_meu_cargo()), e ainda
  // enxerga a área exclusiva de Desenvolvedor.
  const acessoTotal = cargo === 'admin' || cargo === 'developer'

  const isAdmin = () => acessoTotal
  const isOperador = () => cargo === 'operador'
  const isVisualizador = () => cargo === 'visualizador'
  const isDeveloper = () => cargo === 'developer'

  // Modelo de cargos: admin e developer executam ações (escrita/gestão/exportação).
  // Operador e Visualizador são somente-leitura (ver dashboard e estoque).
  const canEdit = () => acessoTotal
  const canDelete = () => acessoTotal
  const canExport = () => acessoTotal
  const canExportLimitado = () => acessoTotal
  const canManageUsers = () => acessoTotal
  const canViewReports = () => acessoTotal
  const canViewOwnReports = () => acessoTotal
  const canRegisterEntrada = () => acessoTotal
  const canRegisterSaida = () => acessoTotal
  const canManageFornecedores = () => acessoTotal
  const canCadastrarFornecedor = () => acessoTotal
  const canChangeSettings = () => acessoTotal
  const canConfigureIA = () => acessoTotal

  // Exclusivo de developer (acima do admin)
  const canAccessDev = () => cargo === 'developer'

  return {
    cargo,
    isAdmin,
    isOperador,
    isVisualizador,
    isDeveloper,
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
    canAccessDev,
  }
}
