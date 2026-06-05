import { test, expect, Page } from '@playwright/test'

const ADMIN = { email: 'admin@armazemmachado.demo', senha: 'Admin@123' }

async function abrirEstoque(page: Page) {
  await page.goto('/login')
  await page.fill('#email', ADMIN.email)
  await page.fill('#senha', ADMIN.senha)
  await page.click('button[type=submit]')
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 15_000 })
  await page.getByRole('complementary').getByRole('button', { name: 'Estoque' }).click()
  await expect(page.getByRole('heading', { name: 'Estoque' })).toBeVisible()
}

test('Estoque: busca encontra produto acentuado sem acento e em maiúscula', async ({ page }) => {
  await abrirEstoque(page)
  const busca = page.getByPlaceholder('Buscar por nome ou código...')

  // Sem acento
  await busca.fill('alcool')
  await expect(page.getByRole('cell', { name: 'Álcool Isopropílico 1L' })).toBeVisible()

  // Maiúsculas
  await busca.fill('ALCOOL')
  await expect(page.getByRole('cell', { name: 'Álcool Isopropílico 1L' })).toBeVisible()
})

test('Estoque: filtro "Com desconto" existe e alterna', async ({ page }) => {
  await abrirEstoque(page)
  const filtro = page.getByRole('button', { name: 'Com desconto' })
  await expect(filtro).toBeVisible()
  await filtro.click() // alterna sem erro
})
