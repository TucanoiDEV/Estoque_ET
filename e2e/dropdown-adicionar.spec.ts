import { test, expect, Page } from '@playwright/test'

const ADMIN = { email: 'admin@armazemmachado.demo', senha: 'Admin@123' }

async function loginAdmin(page: Page) {
  await page.goto('/login')
  await page.fill('#email', ADMIN.email)
  await page.fill('#senha', ADMIN.senha)
  await page.click('button[type=submit]')
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 15_000 })
}

test('Novo produto: adicionar uma cor nova no dropdown', async ({ page }) => {
  await loginAdmin(page)
  await page.getByRole('button', { name: 'Novo produto' }).click()
  await expect(page.getByText('Cadastrar novo produto')).toBeVisible()

  // Clica no "+" do campo Cor, digita e confirma
  await page.getByRole('button', { name: 'Adicionar cor' }).click()
  const input = page.getByPlaceholder('Nova cor (ex.: Laranja)')
  await input.fill('Magenta')
  await input.press('Enter')

  // A cor nova deve estar selecionada no dropdown
  const corSelect = page.locator('select').filter({ hasText: 'Magenta' })
  await expect(corSelect).toHaveValue('Magenta')
})

test('Nova entrada: campo Fornecedor tem botão de adicionar', async ({ page }) => {
  await loginAdmin(page)
  await page.getByRole('button', { name: 'Nova entrada' }).click()
  await expect(page.getByText('Nova entrada de estoque')).toBeVisible()

  // O botão de adicionar fornecedor abre o campo de texto
  await page.getByRole('button', { name: 'Adicionar fornecedor' }).click()
  await expect(page.getByPlaceholder('Nome do novo fornecedor...')).toBeVisible()
})
