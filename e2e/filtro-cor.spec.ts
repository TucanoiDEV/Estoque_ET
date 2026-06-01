import { test, expect, Page } from '@playwright/test'

const ADMIN = { email: 'admin@armazemmachado.demo', senha: 'Admin@123' }

async function abrirEstoque(page: Page) {
  await page.goto('/login')
  await page.fill('#email', ADMIN.email)
  await page.fill('#senha', ADMIN.senha)
  await page.click('button[type=submit]')
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 15_000 })
  await page.getByRole('button', { name: 'Estoque' }).click()
  await expect(page.getByRole('heading', { name: 'Estoque' })).toBeVisible()
}

test('Estoque: filtro por cor é independente e filtra a tabela', async ({ page }) => {
  await abrirEstoque(page)

  // O filtro de cor aparece sem precisar escolher categoria
  const filtroCor = page.locator('select').filter({ hasText: 'Todas as cores' })
  await expect(filtroCor).toBeVisible()

  // Filtra por "Azul"
  await filtroCor.selectOption('Azul')

  // Um produto azul aparece; um produto preto some
  await expect(page.getByRole('cell', { name: 'Lona PE Azul 150 Microns' })).toBeVisible()
  await expect(page.getByRole('cell', { name: 'Lona Sombrite Preta 50%' })).toHaveCount(0)

  // Volta para todas as cores
  await filtroCor.selectOption('')
  await expect(page.getByRole('cell', { name: 'Lona Sombrite Preta 50%' })).toBeVisible()
})
