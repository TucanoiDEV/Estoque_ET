# EstoqueSync

Gerenciador de estoque offline-first para loja de tecidos.
**Stack:** React + TypeScript + Tauri 2.0 + SQLite (local) + Supabase (nuvem) + Tailwind CSS.

---

## Pré-requisitos

| Ferramenta | Versão mínima |
|---|---|
| Node.js | 18+ |
| npm | 9+ |
| Rust | 1.77+ |
| Tauri CLI | 2.x |

Instale o Rust: https://rustup.rs  
Instale o Tauri CLI: `npm install -g @tauri-apps/cli@^2`

---

## Setup

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar o Supabase (opcional para sync em nuvem)

1. Crie um projeto em https://supabase.com
2. Vá em **SQL Editor** e execute o conteúdo de `schema.sql`
3. No app, acesse **Configurações → Geral** e preencha URL e Chave anon

### 3. Rodar em desenvolvimento (browser, sem Tauri)

```bash
npm run dev
```
Acesse http://localhost:1420

O app funciona em modo browser com armazenamento em memória (dados reiniciam ao recarregar).

### 4. Rodar como app desktop (Tauri)

```bash
npm run tauri dev
```

O banco SQLite é criado em `%APPDATA%\com.estoquesync.app\estoque.db` (Windows).

### 5. Gerar instalador (.exe para Windows)

```bash
npm run tauri build
```

O instalador fica em `src-tauri/target/release/bundle/`.

### 6. Build para Android (APK)

```bash
npm run tauri android build
```

Requer Android SDK e NDK. Consulte: https://tauri.app/start/prerequisites/#android

---

## Estrutura do projeto

```
src/
  components/
    Dashboard/      # Métricas, Gráficos, Relatórios, Histórico
    Estoque/        # Tabela de produtos com CRUD
    Configuracoes/  # Geral, Fornecedores, Categorias
    NovaEntrada/    # Modal de entrada de estoque
    shared/         # Header, Toast, SyncIndicator
  hooks/
    useEstoque.ts   # Estado principal do estoque
    useSync.ts      # Sincronização Supabase
    useTheme.ts     # Tema claro/escuro
    useToast.ts     # Notificações
  services/
    db.ts           # SQLite (Tauri) + fallback memória (browser)
    supabase.ts     # Cliente e Realtime Supabase
    sync.ts         # Lógica de sincronização offline-first
    claude.ts       # Integração Claude AI para alertas
  data/
    seedData.ts     # 12 produtos + 6 fornecedores + histórico 6 meses
  types/
    index.ts        # Todas as interfaces TypeScript
src-tauri/
  src/main.rs       # Entrypoint Tauri com plugin SQL
  tauri.conf.json   # Configuração da janela e bundle
  capabilities/     # Permissões de segurança Tauri 2.0
schema.sql          # Schema PostgreSQL para o Supabase
```

---

## Funcionalidades

- **Dashboard**: 4 cards de métricas + gráficos (entradas/vendas, faturamento/lucro, produtos mais movimentados)
- **Estoque**: tabela com busca, filtro por tipo, CRUD completo, indicador de status (Normal / Baixo / Crítico)
- **Nova Entrada**: modal com busca de produto, cálculo automático de total, data, NF, local e observações
- **Configurações**: dados da loja, notificações, Supabase, IA (Claude), backup, tema, usuários
- **Offline-first**: sempre salva localmente no SQLite; sincroniza com Supabase quando conectado
- **Realtime**: atualiza automaticamente via Supabase Realtime Subscriptions
- **Exportar PDF**: relatórios mensais exportáveis via jsPDF
- **Tema claro/escuro**: toggle no header

---

## Variáveis de ambiente (opcional)

Crie um `.env.local` para pré-configurar o Supabase:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```
