import { ComboBox, type ComboOpcao } from './ComboBox'

export type Opcao = ComboOpcao

interface Props {
  label: string
  value: string
  opcoes: Opcao[]
  onChange: (valor: string) => void
  // Recebe o texto digitado; retorna o valor a selecionar (ou null se falhar).
  onAdicionar: (texto: string) => Promise<string | null> | string | null
  obrigatorio?: boolean
  erro?: string
  textoVazio?: string // primeira opção (ex.: "Sem fornecedor"). Omitir torna obrigatório escolher.
  placeholderNovo?: string
}

// Dropdown pesquisável com opção de adicionar novos itens (fino wrapper de ComboBox).
export function SelectComAdicionar({
  label,
  value,
  opcoes,
  onChange,
  onAdicionar,
  obrigatorio,
  erro,
  textoVazio,
  placeholderNovo,
}: Props) {
  return (
    <ComboBox
      label={label}
      value={value}
      opcoes={opcoes}
      onChange={onChange}
      obrigatorio={obrigatorio}
      erro={erro}
      vazioLabel={textoVazio}
      onAdicionar={onAdicionar}
      placeholderBusca={placeholderNovo ?? 'Buscar ou adicionar...'}
    />
  )
}
