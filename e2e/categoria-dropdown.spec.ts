import { test, expect, Page } from '@playwright/test'
import { adicionarNoCombo } from './helpers/combo'

const ADMIN = { email: 'admin@armazemmachado.demo', senha: 'Admin@123' }

async function loginAdmin(page: Page) {
  await page.goto('/login')
  await page.fill('#email', ADMIN.email)
  await page.fill('#senha', ADMIN.senha)
  await page.click('button[type=submit]')
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 15_000 })
}

test('Novo produto: categoria é dropdown pesquisável com adicionar', async ({ page }) => {
  await loginAdmin(page)
  await page.getByRole('button', { name: 'Novo produto' }).click()
  await expect(page.getByRole('heading', { name: 'Cadastrar novo produto' })).toBeVisible()

  // Adiciona uma categoria nova pelo combo (gatilho mostra "Sem categoria")
  await adicionarNoCombo(page, 'Sem categoria', 'Categoria Teste')
  await expect(page.getByRole('button', { name: 'Categoria Teste' })).toBeVisible()

  // Limpa: a categoria persiste no banco, então remove via Configurações
  await page.getByRole('button', { name: 'Cancelar' }).click()
  await expect(page.getByRole('heading', { name: 'Cadastrar novo produto' })).toBeHidden()
  await page.getByRole('button', { name: 'Configurações' }).click()
  await page.getByRole('main').getByRole('button', { name: 'Estoque', exact: true }).click()
  await page.getByRole('button', { name: 'Remover Categoria Teste' }).click()
  await expect(page.getByText('Categoria Teste', { exact: true })).toHaveCount(0)
})
