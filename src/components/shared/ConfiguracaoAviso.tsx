// Exibe instruções de configuração quando as variáveis de ambiente estão ausentes
export function ConfiguracaoAviso() {
  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-[#161b22] border border-[#30363d] rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">E</div>
          <span className="text-white font-bold text-xl">EstoqueSync</span>
        </div>

        <h2 className="text-lg font-semibold text-white mb-2">Configuração necessária</h2>
        <p className="text-gray-400 text-sm mb-5">
          As credenciais do Supabase não foram encontradas. Siga os passos abaixo:
        </p>

        <ol className="space-y-3 text-sm">
          <li className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0">1</span>
            <div>
              <p className="text-white font-medium">Crie o arquivo <code className="bg-[#0d1117] px-1.5 py-0.5 rounded text-blue-400">.env</code> na raiz do projeto</p>
              <p className="text-gray-500 text-xs mt-0.5">Copie o conteúdo de <code className="text-gray-400">.env.example</code></p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0">2</span>
            <div>
              <p className="text-white font-medium">Adicione suas credenciais do Supabase</p>
              <div className="mt-1.5 bg-[#0d1117] border border-[#30363d] rounded-lg p-3">
                <code className="text-xs text-green-400 block">VITE_SUPABASE_URL=https://xxx.supabase.co</code>
                <code className="text-xs text-green-400 block">VITE_SUPABASE_ANON_KEY=sua-chave-aqui</code>
              </div>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0">3</span>
            <div>
              <p className="text-white font-medium">Reinicie o servidor de desenvolvimento</p>
              <div className="mt-1.5 bg-[#0d1117] border border-[#30363d] rounded-lg p-2.5">
                <code className="text-xs text-purple-400">npm run dev</code>
              </div>
            </div>
          </li>
        </ol>

        <p className="text-xs text-gray-500 mt-5">
          Veja o <code className="text-gray-400">README.md</code> para obter suas credenciais no painel do Supabase.
        </p>
      </div>
    </div>
  )
}
