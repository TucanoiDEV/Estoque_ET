// Componente raiz do EstoqueSync

import { useState } from 'react';
import type { AbaAtiva } from './types';
import { useEstoque } from './hooks/useEstoque';
import { useToast } from './hooks/useToast';
import { useTheme } from './hooks/useTheme';
import { useSync } from './hooks/useSync';
import { Header } from './components/shared/Header';
import { ToastContainer } from './components/shared/Toast';
import { DashboardTab } from './components/Dashboard/DashboardTab';
import { EstoqueTab } from './components/Estoque/EstoqueTab';
import { ConfiguracoesTab } from './components/Configuracoes/ConfiguracoesTab';
import { NovaEntradaModal } from './components/NovaEntrada/NovaEntradaModal';

export default function App() {
  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>('dashboard');
  const [modalEntrada, setModalEntrada] = useState(false);

  const toast = useToast();
  const { tema, alternarTema, setTema } = useTheme();

  const estoque = useEstoque();

  const { statusSync, conectado, syncAgora } = useSync({
    supabaseUrl:    estoque.config?.supabase_url ?? '',
    supabaseKey:    estoque.config?.supabase_key ?? '',
    syncAutomatico: estoque.config?.sync_automatico ?? false,
    getProdutos:    () => estoque.produtos,
    getEntradas:    () => estoque.entradas,
    onProdutoAtualizado: estoque.atualizarProdutoEstado,
    onEntradaCriada:     () => estoque.recarregar(),
  });

  const handleSyncManual = async () => {
    const ok = await syncAgora();
    if (ok) toast.sucesso('SincronizaÃ§Ã£o concluÃ­da!');
    else toast.aviso('Nenhuma conexÃ£o com Supabase.');
  };

  const handleRegistrarEntrada = async (dados: Parameters<typeof estoque.registrarEntrada>[0]) => {
    try {
      await estoque.registrarEntrada(dados);
      toast.sucesso('Entrada registrada com sucesso!');
    } catch (err) {
      toast.erro('Erro ao registrar entrada: ' + String(err));
      throw err;
    }
  };

  const handleCriarProduto = async (
    dados: Parameters<typeof estoque.criarProduto>[0]
  ): Promise<void> => {
    await estoque.criarProduto(dados);
    toast.sucesso('Produto cadastrado!');
  };

  const handleAtualizarProduto = async (
    id: string,
    dados: Parameters<typeof estoque.atualizarProduto>[1]
  ): Promise<void> => {
    await estoque.atualizarProduto(id, dados);
    toast.sucesso('Produto atualizado!');
  };

  const handleDeletarProduto = async (id: string): Promise<void> => {
    await estoque.deletarProduto(id);
    toast.sucesso('Produto removido.');
  };

  const handleSalvarConfig = async (config: NonNullable<typeof estoque.config>): Promise<void> => {
    await estoque.salvarConfig(config);
    setTema(config.tema);
    toast.sucesso('Configuracoes salvas!');
  };

  const handleCriarFornecedor = async (
    dados: Parameters<typeof estoque.criarFornecedor>[0]
  ): Promise<void> => { await estoque.criarFornecedor(dados); };

  const handleCriarCategoria = async (nome: string): Promise<void> => {
    await estoque.criarCategoria(nome);
  };

  // Tela de carregamento
  if (!estoque.pronto) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-600
            flex items-center justify-center text-black font-bold text-lg mx-auto mb-4 animate-pulse">
            ES
          </div>
          <p className="text-neutral-400 text-sm">Carregando EstoqueSync...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Header
        abaAtiva={abaAtiva}
        onAbaChange={setAbaAtiva}
        onNovaEntrada={() => setModalEntrada(true)}
        tema={tema}
        onAlternarTema={alternarTema}
        statusSync={statusSync}
        conectado={conectado}
        onSyncManual={handleSyncManual}
      />

      <main className="px-6 py-6 max-w-[1600px] mx-auto">
        {abaAtiva === 'dashboard' && estoque.metricas && (
          <DashboardTab
            metricas={estoque.metricas}
            entradas={estoque.entradas}
            relatorios={estoque.relatorios}
          />
        )}

        {abaAtiva === 'estoque' && (
          <EstoqueTab
            produtos={estoque.produtos}
            fornecedores={estoque.fornecedores}
            categorias={estoque.categorias}
            onCriarProduto={handleCriarProduto}
            onAtualizarProduto={handleAtualizarProduto}
            onDeletarProduto={handleDeletarProduto}
          />
        )}

        {abaAtiva === 'configuracoes' && estoque.config && (
          <ConfiguracoesTab
            config={estoque.config}
            fornecedores={estoque.fornecedores}
            categorias={estoque.categorias}
            usuarios={estoque.usuarios}
            tema={tema}
            onSalvarConfig={handleSalvarConfig}
            onAlternarTema={alternarTema}
            onCriarFornecedor={handleCriarFornecedor}
            onDeletarFornecedor={estoque.deletarFornecedor}
            onCriarCategoria={handleCriarCategoria}
            onDeletarCategoria={estoque.deletarCategoria}
          />
        )}
      </main>

      {/* Modal de Nova Entrada */}
      {modalEntrada && (
        <NovaEntradaModal
          produtos={estoque.produtos}
          fornecedores={estoque.fornecedores}
          onConfirmar={handleRegistrarEntrada}
          onFechar={() => setModalEntrada(false)}
        />
      )}

      {/* NotificaÃ§Ãµes toast */}
      <ToastContainer toasts={toast.toasts} onFechar={toast.removerToast} />
    </div>
  );
}

