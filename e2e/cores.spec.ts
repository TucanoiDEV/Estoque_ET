import { test, expect, Page } from '@playwright/test'

const ADMIN = { email: 'admin@armazemmachado.demo', senha: 'Admin@123' }

async function abrirEstoqueConfig(page: Page) {
  await page.goto('/login')
  await page.fill('#email', ADMIN.email)
  await page.fill('#senha', ADMIN.senha)
  await page.click('button[type=submit]')
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 15_000 })
  await page.getByRole('button', { name: 'Configurações' }).click()
  await page.getByRole('main').getByRole('button', { name: 'Estoque', exact: true }).click()
  await expect(page.getByText('Cores de produtos')).toBeVisible()
}

test('Cores: adicionar e excluir uma cor', async ({ page }) => {
  await abrirEstoqueConfig(page)

  // Cores padrão aparecem
  await expect(page.getByText('Azul', { exact: true })).toBeVisible()

  // Adiciona uma cor nova
  const cor = 'Magenta Teste'
  await page.getByPlaceholder('Nova cor (ex.: Laranja)').fill(cor)
  await page.getByPlaceholder('Nova cor (ex.: Laranja)').press('Enter')
  await expect(page.getByText(cor, { exact: true })).toBeVisible()

  // Exclui a cor (botão X do chip)
  await page.getByRole('button', { name: `Remover ${cor}` }).click()
  await expect(page.getByText(cor, { exact: true })).toHaveCount(0)

  // Exclui uma cor padrão também (ex.: Cinza)
  await page.getByRole('button', { name: 'Remover Cinza' }).click()
  await expect(page.getByText('Cinza', { exact: true })).toHaveCount(0)
})
