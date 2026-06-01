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

test('Novo produto: rótulo do custo muda conforme a unidade', async ({ page }) => {
  await abrirNovoProduto(page)
  const unidade = page.locator('select').filter({ hasText: 'Unidade (UN)' })

  // Padrão UN
  await expect(page.getByText('Custo por unidade')).toBeVisible()
  await expect(page.getByText('R$/un')).toBeVisible()

  // Troca para Metro
  await unidade.selectOption('M')
  await expect(page.getByText('Custo por metro')).toBeVisible()
  await expect(page.getByText('R$/m', { exact: true })).toBeVisible()

  // Troca para Quilograma
  await unidade.selectOption('KG')
  await expect(page.getByText('Custo por quilograma')).toBeVisible()
  await expect(page.getByText('R$/kg')).toBeVisible()
})
