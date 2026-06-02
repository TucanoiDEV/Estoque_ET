# Armazém Machado

Sistema de gerenciamento de estoque em tempo real — React + TypeScript + Supabase + Vercel.

## Pré-requisitos

- Node.js 18+
- Conta gratuita no [Supabase](https://supabase.com)
- Conta gratuita na [Vercel](https://vercel.com)

---

## 1. Criar o projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto
2. Anote a **URL do projeto** e a **anon key** — você vai precisar delas

---

## 2. Executar o schema SQL

1. No painel do Supabase, vá em **SQL Editor**
2. Cole e execute o conteúdo de `supabase/schema.sql`
3. Em seguida, execute `supabase/seed.sql` para inserir dados de exemplo

### Criar usuários de demonstração

No painel Supabase, vá em **Authentication > Users** e crie:

| Email                        | Senha      | Cargo        |
| ---------------------------- | ---------- | ------------ |
| admin@armazemmachado.demo       | Admin@123  | admin        |
| operador@armazemmachado.demo    | Oper@123   | operador     |
| viewer@armazemmachado.demo      | View@123   | visualizador |

Após criar, copie os UUIDs gerados e execute no SQL Editor:

```sql
INSERT INTO public.usuarios (id, nome, email, cargo) VALUES
  ('<UUID_ADMIN>',     'Administrador', 'admin@armazemmachado.demo',    'admin'),
  ('<UUID_OPERADOR>',  'Operador',      'operador@armazemmachado.demo', 'operador'),
  ('<UUID_VIEWER>',    'Visualizador',  'viewer@armazemmachado.demo',   'visualizador');
```

---

## 3. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` com os valores do seu projeto Supabase:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

---

## 4. Rodar localmente

```bash
npm install
npm run dev
```

Acesse: `http://localhost:5173`

---

## 5. Deploy na Vercel

### Via CLI

```bash
npm install -g vercel
vercel --prod
```

### Via GitHub

1. Faça push do projeto para um repositório GitHub
2. Importe o repositório na [Vercel](https://vercel.com/new)
3. Configure as variáveis de ambiente:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Clique em **Deploy**

O arquivo `vercel.json` já está configurado para o roteamento SPA.

---

## 6. Primeiro acesso

1. Acesse o domínio da Vercel (ou `localhost:5173`)
2. Faça login com `admin@armazemmachado.demo` / `Admin@123`
3. Na aba **Configurações > Empresa**, configure o nome da sua empresa
4. Para usar o Assistente IA, acesse **Configurações > Assistente IA** e informe sua API Key da Anthropic

---

## Estrutura do projeto

```
src/
  components/
    Auth/           # Login e rota protegida
    Dashboard/      # Gráficos, relatórios e histórico
    Estoque/        # Tabela e filtros de estoque
    Configuracoes/  # 7 seções de configuração
    NovaEntrada/    # Modal de entrada de produtos
    shared/         # Header, Sidebar, Toast, SyncIndicator
  hooks/
    useAuth.ts        # Autenticação
    useEstoque.ts     # Dados de estoque
    useRealtime.ts    # Sincronização em tempo real
    usePermissions.ts # Sistema de cargos
  services/
    supabase.ts   # Cliente Supabase
    claude.ts     # Integração com API Claude
  types/
    index.ts      # Tipos TypeScript
supabase/
  schema.sql  # Schema do banco de dados
  seed.sql    # Dados de exemplo
```

## Cargos e permissões

| Ação                    | Admin | Operador | Visualizador |
| ----------------------- | :---: | :------: | :----------: |
| Ver dashboard           | ✅    | ✅       | ✅           |
| Ver estoque             | ✅    | ✅       | ✅           |
| Registrar entrada       | ✅    | ❌       | ❌           |
| Registrar saída         | ✅    | ❌       | ❌           |
| Editar produto          | ✅    | ❌       | ❌           |
| Excluir produto         | ✅    | ❌       | ❌           |
| Exportar relatórios     | ✅    | ❌       | ❌           |
| Gerenciar usuários      | ✅    | ❌       | ❌           |
| Alterar configurações   | ✅    | ❌       | ❌           |
| Configurar API Claude   | ✅    | ❌       | ❌           |
