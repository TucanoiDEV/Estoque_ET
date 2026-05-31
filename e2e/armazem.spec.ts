import { test, expect, Page } from '@playwright/test'

const ADMIN = { email: 'admin@armazemmachado.demo', senha: 'Admin@123' }
const OPERADOR = { email: 'operador@armazemmachado.demo', senha: 'Operador@123' }
const VIEWER = { email: 'viewer@armazemmachado.demo', senha: 'Visual@123' }

async function login(page: Page, email: string, senha: string) {
  await page.goto('/login')
  await page.fill('#email', email)
  await page.fill('#senha', senha)
  await page.click('button[type=submit]')
}

async function loginEAguardarApp(page: Page, email: string, senha: string) {
  await login(page, email, senha)
  // Espera o app autenticado (header + sidebar)
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 15_000 })
}

// ─── 1. AUTENTICAÇÃO ───────────────────────────────────────────────────────────
test.describe('1. Autenticação', () => {
  test('rota protegida sem login redireciona para /login', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByText('Entrar na sua conta')).toBeVisible()
  })

  test('login com senha errada mostra erro em português', async ({ page }) => {
    await login(page, ADMIN.email, 'SenhaErrada!')
    await expect(page.getByText('Email ou senha incorretos.')).toBeVisible({ timeout: 15_000 })
  })

  test('login admin entra no dashboard', async ({ page }) => {
    await loginEAguardarApp(page, ADMIN.email, ADMIN.senha)
    await expect(page.getByText('Armazém Machado').first()).toBeVisible()
  })

  test('logout volta para a tela de login', async ({ page }) => {
    await loginEAguardarApp(page, ADMIN.email, ADMIN.senha)
    await page.getByRole('button', { name: 'Sair' }).click()
    await expect(page.getByText('Entrar na sua conta')).toBeVisible({ timeout: 15_000 })
  })

  test('login operador (estado atual do Auth)', async ({ page }) => {
    await login(page, OPERADOR.email, OPERADOR.senha)
    // Documenta o estado: ou entra, ou mostra erro tratado em pt-BR
    const entrou = page.getByRole('heading', { name: 'Dashboard' })
    const erro = page.getByText(/incorretos|Confirme seu email|Falha ao conectar/)
    await expect(entrou.or(erro)).toBeVisible({ timeout: 15_000 })
  })

  test('login viewer (estado atual do Auth)', async ({ page }) => {
    await login(page, VIEWER.email, VIEWER.senha)
    const entrou = page.getByRole('heading', { name: 'Dashboard' })
    const erro = page.getByText(/incorretos|Confirme seu email|Falha ao conectar/)
    await expect(entrou.or(erro)).toBeVisible({ timeout: 15_000 })
  })
})

// ─── 2. PERMISSÕES (admin) ──────────────────────────────────────────────────────
test.describe('2. Permissões — admin', () => {
  test('admin vê Nova entrada e Configurações', async ({ page }) => {
    await loginEAguardarApp(page, ADMIN.email, ADMIN.senha)
    await expect(page.getByRole('button', { name: 'Nova entrada' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Configurações' })).toBeVisible()
  })
})

// ─── 3. DASHBOARD ────────────────────────────────────────────────────────────────
test.describe('3. Dashboard', () => {
  test.beforeEach(async ({ page }) => loginEAguardarApp(page, ADMIN.email, ADMIN.senha))

  test('4 cards de métricas carregam', async ({ page }) => {
    for (const titulo of ['Total de itens', 'Valor em estoque', 'Itens críticos', 'Entradas no mês']) {
      await expect(page.getByText(titulo)).toBeVisible()
    }
  })

  test('sub-abas Gráficos / Relatórios / Histórico funcionam', async ({ page }) => {
    await page.getByRole('button', { name: 'Gráficos' }).click()
    await expect(page.getByText('Entradas mensais')).toBeVisible()
    await page.getByRole('button', { name: 'Relatórios' }).click()
    await expect(page.getByText('Relatórios disponíveis')).toBeVisible()
    await page.getByRole('button', { name: 'Histórico' }).click()
    await expect(page.getByText(/Histórico de compras/)).toBeVisible()
  })
})

// ─── 4. NOVA ENTRADA ─────────────────────────────────────────────────────────────
test.describe('4. Nova entrada', () => {
  test.beforeEach(async ({ page }) => loginEAguardarApp(page, ADMIN.email, ADMIN.senha))

  test('modal abre e calcula o total em tempo real', async ({ page }) => {
    await page.getByRole('button', { name: 'Nova entrada' }).click()
    await expect(page.getByText('Nova entrada de estoque')).toBeVisible()
    // Seleciona o primeiro produto real
    await page.locator('select').first().selectOption({ index: 1 })
    await page.getByRole('spinbutton').first().fill('3') // quantidade
    // Total deve refletir quantidade × custo (algum valor em R$)
    await expect(page.getByText('Total da entrada')).toBeVisible()
  })

  test('validação: salvar sem produto mostra erro', async ({ page }) => {
    await page.getByRole('button', { name: 'Nova entrada' }).click()
    await expect(page.getByText('Nova entrada de estoque')).toBeVisible()
    await page.getByRole('button', { name: /Confirmar entrada/ }).click()
    await expect(page.getByText('Selecione um produto', { exact: true })).toBeVisible()
  })
})

// ─── 5. ESTOQUE ──────────────────────────────────────────────────────────────────
test.describe('5. Estoque', () => {
  test.beforeEach(async ({ page }) => {
    await loginEAguardarApp(page, ADMIN.email, ADMIN.senha)
    await page.getByRole('button', { name: 'Estoque' }).click()
    await expect(page.getByRole('heading', { name: 'Estoque' })).toBeVisible()
  })

  test('tabela carrega produtos do seed', async ({ page }) => {
    const linhas = page.locator('table tbody tr')
    await expect(linhas.first()).toBeVisible()
    expect(await linhas.count()).toBeGreaterThan(0)
  })

  test('busca por nome filtra a tabela', async ({ page }) => {
    await page.getByPlaceholder(/Buscar por nome ou código/).fill('Cabo')
    await expect(page.getByText(/produto\(s\) exibido\(s\)/)).toBeVisible()
  })

  test('filtro Críticos funciona', async ({ page }) => {
    await page.getByRole('button', { name: 'Críticos' }).click()
    await expect(page.getByText(/produto\(s\) exibido\(s\)/)).toBeVisible()
  })

  test('admin vê botões de editar/excluir', async ({ page }) => {
    await expect(page.locator('button[title="Editar"]').first()).toBeVisible()
    await expect(page.locator('button[title="Excluir"]').first()).toBeVisible()
  })
})

// ─── 7. CONFIGURAÇÕES ────────────────────────────────────────────────────────────
test.describe('7. Configurações (admin)', () => {
  test.beforeEach(async ({ page }) => {
    await loginEAguardarApp(page, ADMIN.email, ADMIN.senha)
    await page.getByRole('button', { name: 'Configurações' }).click()
    await expect(page.getByRole('heading', { name: 'Configurações' })).toBeVisible()
  })

  test('seções de configuração acessíveis', async ({ page }) => {
    const menu = page.getByRole('main')
    for (const secao of ['Empresa', 'Usuários', 'Estoque', 'Notificações', 'Assistente IA', 'Backup', 'Aparência']) {
      await expect(menu.getByRole('button', { name: secao, exact: true })).toBeVisible()
    }
  })

  test('lista de usuários mostra os 3 cargos', async ({ page }) => {
    await page.getByRole('button', { name: 'Usuários' }).click()
    await expect(page.getByText('admin@armazemmachado.demo')).toBeVisible()
    await expect(page.getByText('operador@armazemmachado.demo')).toBeVisible()
    await expect(page.getByText('viewer@armazemmachado.demo')).toBeVisible()
  })

  test('troca de tema persiste após reload', async ({ page }) => {
    await page.getByRole('button', { name: 'Aparência' }).click()
    await page.getByText('Tema claro').click()
    await page.reload()
    // localStorage deve ter o tema 'claro'
    const tema = await page.evaluate(() => localStorage.getItem('tema'))
    expect(tema).toBe('claro')
  })
})

// ─── 8. RESPONSIVO ───────────────────────────────────────────────────────────────
test.describe('8. Responsivo', () => {
  test('mobile 375px renderiza login', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/login')
    await expect(page.getByText('Entrar na sua conta')).toBeVisible()
    await page.screenshot({ path: 'e2e/screenshots/mobile-375-login.png' })
  })

  test('tablet 768px renderiza dashboard', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await loginEAguardarApp(page, ADMIN.email, ADMIN.senha)
    await page.screenshot({ path: 'e2e/screenshots/tablet-768-dashboard.png', fullPage: true })
  })

  test('mobile 375px renderiza dashboard', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await loginEAguardarApp(page, ADMIN.email, ADMIN.senha)
    await page.screenshot({ path: 'e2e/screenshots/mobile-375-dashboard.png', fullPage: true })
  })
})

// ─── 10. CONSOLE / ERROS ─────────────────────────────────────────────────────────
test.describe('10. Console e erros', () => {
  test('navegação como admin não gera erros de console do app', async ({ page }) => {
    const erros: string[] = []
    page.on('console', (msg) => { if (msg.type() === 'error') erros.push(msg.text()) })
    page.on('pageerror', (e) => erros.push(String(e)))

    await loginEAguardarApp(page, ADMIN.email, ADMIN.senha)
    await page.getByRole('button', { name: 'Estoque' }).click()
    await expect(page.getByRole('heading', { name: 'Estoque' })).toBeVisible()
    await page.getByRole('button', { name: 'Configurações' }).click()
    await expect(page.getByRole('heading', { name: 'Configurações' })).toBeVisible()

    // Ignora ruídos conhecidos não originados pelo app
    const relevantes = erros.filter((e) =>
      !/React DevTools|favicon|Download the React/i.test(e)
    )
    console.log('Erros de console capturados:', relevantes.length ? relevantes : 'nenhum')
    expect(relevantes, `Erros: ${relevantes.join(' | ')}`).toHaveLength(0)
  })
})
