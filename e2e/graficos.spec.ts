import { test, expect, Page } from '@playwright/test'

const ADMIN = { email: 'admin@armazemmachado.demo', senha: 'Admin@123' }

async function loginAdmin(page: Page) {
  await page.goto('/login')
  await page.fill('#email', ADMIN.email)
  await page.fill('#senha', ADMIN.senha)
  await page.click('button[type=submit]')
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 15_000 })
}

test('Dashboard: os gráficos aparecem na aba Gráficos', async ({ page }) => {
  await loginAdmin(page)
  // A sub-aba Gráficos é a padrão
  await expect(page.getByRole('heading', { name: 'Entradas por Período' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Saídas por Período' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Top 5 produtos' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Produtos mais vendidos' })).toBeVisible()
})
