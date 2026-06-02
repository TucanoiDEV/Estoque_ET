# CLAUDE.md

Orientações para o Claude Code trabalhar neste repositório. Escrito em português porque
todo o código, schema e UI usam nomenclatura em português (pt-BR) — **mantenha esse padrão**.

## O que é

**Armazém Machado** (pacote `estoque-sync`) — sistema de gestão de estoque em tempo real.
SPA React + TypeScript no front, Supabase (Postgres + Auth + Realtime + Storage) no back,
deploy na Vercel. Sem backend próprio: o navegador fala direto com o Supabase, e a segurança
é feita por **RLS** (Row Level Security) no banco.

Domínio: produtos, estoque (quantidade por produto), entradas (compras/recebimentos),
saídas (baixas), fornecedores, usuários com cargos. UI em tema escuro, Tailwind.

## Comandos

```bash
npm run dev          # Vite dev server em http://localhost:5173
npm run build        # tsc (type-check) + vite build → dist/
npm run lint         # ESLint — ATENÇÃO: --max-warnings 0 (qualquer warning quebra)
npm run preview      # Pré-visualiza o build de produção

npx playwright test                    # Roda os testes E2E (pasta e2e/)
npx playwright test e2e/cores.spec.ts  # Um arquivo só
```

- **`npm run build` é o portão de qualidade**: ele roda `tsc` antes do bundle, então erro de
  tipo quebra o build. Rode-o (ou `npx tsc --noEmit`) após mexer em tipos.
- **E2E precisa do dev server já rodando** em `localhost:5173` — o `playwright.config.ts` NÃO
  sobe servidor sozinho (sem campo `webServer`). Suba `npm run dev` antes. Os testes também
  exigem `.env` válido e dados no Supabase (login real).
- Scripts soltos na raiz (`test-backend.mjs`, `test-realtime.mjs`, `test-fornecedor-fk.mjs`,
  `setup-usuarios.mjs`) são utilitários ad-hoc de verificação contra o Supabase — não fazem
  parte de uma suíte; rode com `node <arquivo>.mjs` quando precisar.

## Configuração obrigatória

Precisa de `.env` (copie de `.env.example`) com:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Sem isso, [src/services/supabase.ts](src/services/supabase.ts) usa valores placeholder e o app
sobe mas não conecta (`supabaseConfigurado` fica `false`). **O `.env` não é versionado.**

## Banco de dados (Supabase)

Setup de um banco novo — rode no SQL Editor, nesta ordem:

1. [supabase/schema.sql](supabase/schema.sql) — **arquivo completo e idempotente**: tabelas,
   RLS, grants, função `get_meu_cargo()`, trigger de auto-cadastro de usuário, bucket de
   avatares e Realtime.
2. [supabase/seed.sql](supabase/seed.sql) — dados de exemplo.
3. Crie os usuários em Authentication > Users (ver README) e ajuste o cargo na tabela `usuarios`.

Os demais arquivos `supabase/*.sql` (`migration_*`, `saidas.sql`, `perfil.sql`,
`fix_permissoes.sql`) são **migrações para bancos antigos** criados antes da consolidação no
`schema.sql`. Para banco novo, NÃO precisa rodá-los. Se adicionar coluna/tabela, atualize o
`schema.sql` (DDL) E mantenha os tipos em [src/types/index.ts](src/types/index.ts) em sincronia.

**Modelo de RLS** (não quebre isto): toda tabela tem RLS ligado. A função
`get_meu_cargo()` (SECURITY DEFINER) devolve o cargo do usuário logado sem cair em recursão de
policy. Padrão geral:
- `SELECT`: liberado para qualquer autenticado.
- `INSERT/UPDATE`: admin + operador.
- `DELETE` e configurações: só admin.
- `usuarios`: cada um edita o próprio perfil; o `WITH CHECK` impede um não-admin mudar o
  próprio `cargo` (escalonamento). Só admin gerencia outros usuários.

## Arquitetura do front

- **Roteamento mínimo** ([src/App.tsx](src/App.tsx)): só `/login` e `/*` (protegida por
  `ProtectedRoute`). A navegação entre Dashboard / Estoque / Configurações é por **estado de
  aba** (`useState`), não por rotas. Configurações é só-admin.
- **Estado de dados**: hook central [src/hooks/useEstoque.ts](src/hooks/useEstoque.ts) carrega
  produtos+estoque, entradas, saídas e fornecedores, e deriva todas as métricas/gráficos no
  cliente (nada de RPC). Expõe `recarregar*()` para refetch.
- **Tempo real**: [src/hooks/useRealtime.ts](src/hooks/useRealtime.ts) escuta mudanças
  (estoque/entradas) e dispara os `recarregar*` via callbacks. Tabelas publicadas no Realtime
  estão no `schema.sql`.
- **Auth**: [src/hooks/useAuth.ts](src/hooks/useAuth.ts) provê `AuthContext`; sessão persistida
  pelo Supabase.
- **Permissões na UI**: [src/hooks/usePermissions.ts](src/hooks/usePermissions.ts) expõe
  checadores (`canEdit`, `canDelete`, `canRegisterSaida`, `canConfigureIA`, ...). É a fonte
  única de verdade para mostrar/esconder ações — **a RLS é o backup no servidor; sempre os dois**.
- **Acesso a dados**: SEMPRE via o helper `db` de [src/services/supabase.ts](src/services/supabase.ts)
  (`db.produtos()`, `db.saidas()`, ...), não `supabase.from(...)` espalhado.

## Convenções

- **Português em tudo**: nomes de variáveis, funções, componentes, colunas, props
  (`mostrarToast`, `recarregar`, `aoSelecionarFoto`, `quantidade`). Siga.
- **Componentes** por domínio em `src/components/<Area>/`; compartilhados em `components/shared/`.
- **Modais** usam `createPortal` para `document.body` e recebem `onFechar` / `onSalvo`.
- **Feedback ao usuário** via `useToast()` (`mostrarToast(msg, 'sucesso'|'erro'|'aviso'|'info')`),
  não `alert`.
- **Estilo**: Tailwind, tema escuro. Use os tokens custom do [tailwind.config.js](tailwind.config.js)
  (`bg-dark-bg`, `text-brand-blue`, `brand-purple`, etc.), não cores cruas.
- **Ícones**: `@tabler/icons-react`.
- **Datas/números**: helpers em [src/utils/](src/utils/) (`data.ts`, `numero.ts`) e `date-fns`.
- Campos numéricos em formulários ficam como **string** enquanto digitados (ver
  `FormNovaEntrada` em types) e só são convertidos ao salvar.

## Pontos de atenção / dívida conhecida

- **Integração com Claude é um STUB.** [src/services/claude.ts](src/services/claude.ts) tem
  `consultarIA()` (usado só no botão "Testar conexão" de
  [IASection.tsx](src/components/Configuracoes/IASection.tsx)) e `gerarPromptEstoqueCritico()`
  (definido, **nunca chamado**). O toggle `alertas_ia` é salvo no banco mas nada o lê. Ou seja,
  a feature de "alertas inteligentes" prometida na UI **não está plugada**.
- **Segurança da API key do Claude.** Ela é salva em texto puro na tabela `configuracoes`, que
  qualquer usuário autenticado pode ler (policy `configuracoes_select = true`), e a chamada vai
  direto do navegador (`anthropic-dangerous-direct-browser-access`). Para produção, mover para
  uma **Supabase Edge Function** (key no servidor, fora do alcance do browser e da tabela).
- **Cálculos no cliente**: métricas e gráficos são computados em `useEstoque` sobre TODAS as
  linhas carregadas. Funciona no volume atual; se a base crescer muito, considerar agregação no
  Postgres (views/RPC) e paginação.
- `npm run lint` é estrito (`--max-warnings 0`): warning de ESLint reprova. Resolva, não silencie
  (a menos que já exista um `eslint-disable` pontual, como em `useEstoque.ts`).

## Deploy

Vercel, SPA com rewrite em [vercel.json](vercel.json). Variáveis `VITE_SUPABASE_URL` e
`VITE_SUPABASE_ANON_KEY` configuradas no painel da Vercel. `dist/` é gerado no build (não
versionado).
