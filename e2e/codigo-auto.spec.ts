import { test, expect, Page } from '@playwright/test'
import { escolherNoCombo } from './helpers/combo'

const ADMIN = { email: 'admin@armazemmachado.demo', senha: 'Admin@123' }

async function loginAdmin(page: Page) {
  await page.goto('/login')
  await page.fill('#email', ADMIN.email)
  await page.fill('#senha', ADMIN.senha)
  await page.click('button[type=submit]')
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 15_000 })
}

test('Novo produto: código é gerado automaticamente a partir da categoria', async ({ page }) => {
  await loginAdmin(page)
  await page.getByRole('button', { name: 'Novo produto' }).click()
  await expect(page.getByRole('heading', { name: 'Cadastrar novo produto' })).toBeVisible()

  // Não há mais campo para digitar o código
  await expect(page.getByPlaceholder('EX-001')).toHaveCount(0)

  // Sem categoria → prefixo XXX
  await expect(page.getByText('XXX-001')).toBeVisible()

  // Categoria "Eletrônicos" (já existem ELE-001..003) → próximo ELE-004
  await escolherNoCombo(page, 'Sem categoria', 'Eletr', 'Eletrônicos')
  await expect(page.getByText('ELE-004')).toBeVisible()
})
