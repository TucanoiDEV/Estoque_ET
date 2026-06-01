import { test, expect, Page } from '@playwright/test'

const ADMIN = { email: 'admin@armazemmachado.demo', senha: 'Admin@123' }

async function abrirNovoProduto(page: Page) {
  await page.goto('/login')
  await page.fill('#email', ADMIN.email)
  await page.fill('#senha', ADMIN.senha)
  await page.click('button[type=submit]')
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 15_000 })
  await page.getByRole('button', { name: 'Novo produto' }).click()
  await expect(page.getByRole('heading', { name: 'Cadastrar novo produto' })).toBeVisible()
}

test('Novo produto: categoria é dropdown com botão de adicionar', async ({ page }) => {
  await abrirNovoProduto(page)

  // Botão de adicionar categoria existe e abre o campo de texto
  await page.getByRole('button', { name: 'Adicionar categoria' }).click()
  const input = page.getByPlaceholder('Nova categoria (ex.: Lona PVC)')
  await expect(input).toBeVisible()

  // Adiciona uma categoria nova e ela fica selecionada
  await input.fill('Categoria Teste')
  await input.press('Enter')
  const select = page.locator('select').filter({ hasText: 'Categoria Teste' })
  await expect(select).toHaveValue('Categoria Teste')

  // Limpa: a categoria persiste no banco, então remove via Configurações
  await page.getByRole('button', { name: 'Cancelar' }).click()
  await expect(page.getByRole('heading', { name: 'Cadastrar novo produto' })).toBeHidden()
  await page.getByRole('button', { name: 'Configurações' }).click()
  await page.getByRole('main').getByRole('button', { name: 'Estoque', exact: true }).click()
  await page.getByRole('button', { name: 'Remover Categoria Teste' }).click()
  await expect(page.getByText('Categoria Teste', { exact: true })).toHaveCount(0)
})
