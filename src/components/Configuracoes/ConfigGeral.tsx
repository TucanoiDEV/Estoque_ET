// Secao Geral de Configuracoes

import { useState } from 'react';
import {
  IconBuilding, IconBell, IconDatabase, IconRobot,
  IconDeviceFloppy, IconPalette, IconUsers, IconCheck,
} from '@tabler/icons-react';
import type { ConfiguracaoApp, Usuario } from '../../types';
import { testarConexao } from '../../services/supabase';

interface ConfigGeralProps {
  config: ConfiguracaoApp;
  usuarios: Usuario[];
  tema: 'claro' | 'escuro';
  onSalvar: (config: ConfiguracaoApp) => Promise<void>;
  onAlternarTema: () => void;
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="toggle-switch">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="toggle-slider" />
    </label>
  );
}

function CardSection({ titulo, icone, children }: {
  titulo: string;
  icone: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-teal-400">{icone}</span>
        <h3 className="text-sm font-semibold text-white">{titulo}</h3>
      </div>
      {children}
    </div>
  );
}

export function ConfigGeral({ config, usuarios, tema, onSalvar, onAlternarTema }: ConfigGeralProps) {
  const [form, setForm] = useState<ConfiguracaoApp>({ ...config });
  const [salvando, setSalvando] = useState(false);
  const [testando, setTestando] = useState(false);
  const [resultadoTeste, setResultadoTeste] = useState<boolean | null>(null);

  const campo = (key: keyof ConfiguracaoApp) => (
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }))
  );
  const toggle = (key: keyof ConfiguracaoApp) => (v: boolean) =>
    setForm(f => ({ ...f, [key]: v }));

  const handleSalvar = async () => {
    setSalvando(true);
    try { await onSalvar(form); }
    finally { setSalvando(false); }
  };

  const handleTestarConexao = async () => {
    setTestando(true);
    setResultadoTeste(null);
    const ok = await testarConexao(form.supabase_url, form.supabase_key);
    setResultadoTeste(ok);
    setTestando(false);
  };

  const inputCls = `w-full px-3 py-2 rounded-lg bg-[#111] border border-[var(--color-border)]
    text-white text-sm focus:border-teal-500 focus:outline-none transition-colors`;
  const labelCls = 'block text-xs text-neutral-400 mb-1';

  const nivelCor = (nivel: string) => {
    if (nivel === 'admin') return 'bg-teal-900/60 text-teal-300 border-teal-700/30';
    if (nivel === 'operador') return 'bg-blue-900/60 text-blue-300 border-blue-700/30';
    return 'bg-neutral-800 text-neutral-300 border-neutral-700/30';
  };

  return (
    <div className="space-y-4">
      <CardSection titulo="Dados da Loja" icone={<IconBuilding size={18} />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Nome da loja</label>
            <input className={inputCls} value={form.nome_loja} onChange={campo('nome_loja')} />
          </div>
          <div>
            <label className={labelCls}>CNPJ</label>
            <input className={inputCls} value={form.cnpj} onChange={campo('cnpj')} placeholder="00.000.000/0000-00" />
          </div>
          <div>
            <label className={labelCls}>Moeda</label>
            <select className={inputCls} value={form.moeda} onChange={campo('moeda')}>
              <option value="BRL">BRL - Real Brasileiro</option>
              <option value="USD">USD - Dolar Americano</option>
              <option value="EUR">EUR - Euro</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Fuso horario</label>
            <select className={inputCls} value={form.fuso_horario} onChange={campo('fuso_horario')}>
              <option value="America/Sao_Paulo">America/Sao_Paulo</option>
              <option value="America/Manaus">America/Manaus</option>
              <option value="America/Recife">America/Recife</option>
              <option value="America/Belem">America/Belem</option>
            </select>
          </div>
        </div>
      </CardSection>

      <CardSection titulo="Notificacoes" icone={<IconBell size={18} />}>
        <div className="space-y-3">
          {([
            { key: 'notif_estoque_critico' as const,   label: 'Estoque critico' },
            { key: 'notif_nova_entrada' as const,       label: 'Nova entrada' },
            { key: 'notif_relatorio_semanal' as const,  label: 'Relatorio semanal' },
            { key: 'sync_automatico' as const,          label: 'Sincronizacao automatica' },
          ] as const).map(item => (
            <div key={item.key} className="flex items-center justify-between">
              <span className="text-sm text-neutral-300">{item.label}</span>
              <Toggle checked={form[item.key] as boolean} onChange={toggle(item.key)} />
            </div>
          ))}
        </div>
      </CardSection>

      <CardSection titulo="Banco de Dados (Supabase)" icone={<IconDatabase size={18} />}>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>URL do projeto Supabase</label>
            <input className={inputCls} value={form.supabase_url} onChange={campo('supabase_url')}
              placeholder="https://seu-projeto.supabase.co" />
          </div>
          <div>
            <label className={labelCls}>Chave anon/public</label>
            <input className={inputCls} type="password" value={form.supabase_key}
              onChange={campo('supabase_key')} placeholder="eyJ..." />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleTestarConexao} disabled={testando || !form.supabase_url}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--color-border)]
                text-sm text-neutral-300 hover:text-white hover:border-teal-500 transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testando ? 'Testando...' : 'Testar conexao'}
            </button>
            {resultadoTeste !== null && (
              <span className={`text-sm ${resultadoTeste ? 'text-teal-400' : 'text-red-400'}`}>
                {resultadoTeste ? 'Conexao OK' : 'Falha na conexao'}
              </span>
            )}
          </div>
        </div>
      </CardSection>

      <CardSection titulo="Assistente IA (Claude)" icone={<IconRobot size={18} />}>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>API Key da Anthropic</label>
            <input className={inputCls} type="password" value={form.claude_api_key}
              onChange={campo('claude_api_key')} placeholder="sk-ant-..." />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-300">Alertas inteligentes de estoque</span>
            <Toggle checked={form.alertas_ia} onChange={toggle('alertas_ia')} />
          </div>
        </div>
      </CardSection>

      <CardSection titulo="Backup Automatico" icone={<IconDeviceFloppy size={18} />}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Frequencia</label>
            <select className={inputCls} value={form.backup_frequencia} onChange={campo('backup_frequencia')}>
              <option value="diario">Diario</option>
              <option value="semanal">Semanal</option>
              <option value="mensal">Mensal</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Destino</label>
            <select className={inputCls} value={form.backup_destino} onChange={campo('backup_destino')}>
              <option value="local">Armazenamento local</option>
              <option value="supabase">Supabase</option>
            </select>
          </div>
        </div>
      </CardSection>

      <CardSection titulo="Aparencia" icone={<IconPalette size={18} />}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white">Tema</p>
            <p className="text-xs text-neutral-400 mt-0.5">
              {tema === 'escuro' ? 'Tema escuro ativo' : 'Tema claro ativo'}
            </p>
          </div>
          <button
            onClick={onAlternarTema}
            className="px-4 py-2 rounded-lg border border-[var(--color-border)]
              text-sm text-neutral-300 hover:text-white hover:border-teal-500 transition-colors"
          >
            Alternar para {tema === 'escuro' ? 'claro' : 'escuro'}
          </button>
        </div>
      </CardSection>

      <CardSection titulo="Usuarios" icone={<IconUsers size={18} />}>
        <div className="space-y-2">
          {usuarios.map(usr => (
            <div key={usr.id}
              className="flex items-center justify-between p-3 rounded-lg bg-[#111] border border-[var(--color-border)]">
              <div>
                <p className="text-sm text-white font-medium">{usr.nome}</p>
                <p className="text-xs text-neutral-400">{usr.email}</p>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${nivelCor(usr.nivel_acesso)}`}>
                {usr.nivel_acesso}
              </span>
            </div>
          ))}
        </div>
      </CardSection>

      <div className="flex justify-end">
        <button
          onClick={handleSalvar} disabled={salvando}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500
            text-white text-sm font-medium disabled:opacity-50 transition-colors"
        >
          <IconCheck size={16} />
          {salvando ? 'Salvando...' : 'Salvar alteracoes'}
        </button>
      </div>
    </div>
  );
}
