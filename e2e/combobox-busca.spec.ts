import { test, expect, Page } from '@playwright/test'

const ADMIN = { email: 'admin@armazemmachado.demo', senha: 'Admin@123' }

async function loginAdmin(page: Page) {
  await page.goto('/login')
  await page.fill('#email', ADMIN.email)
  await page.fill('#senha', ADMIN.senha)
  await page.click('button[type=submit]')
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 15_000 })
}

test('Produto: digitar filtra as opções do dropdown', async ({ page }) => {
  await loginAdmin(page)
  await page.getByRole('button', { name: 'Nova entrada' }).click()
  await expect(page.getByText('Nova entrada de estoque')).toBeVisible()

  // Abre o combo de produto
  await page.getByRole('button', { name: /Selecione um produto/ }).click()

  // Sem filtro: várias opções aparecem
  await expect(page.getByRole('button', { name: /Cabo USB-C/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /Álcool Isopropílico/ })).toBeVisible()

  // Digita "cabo" → só "Cabo" permanece; "Álcool" some
  await page.getByTestId('combobox-busca').fill('cabo')
  await expect(page.getByRole('button', { name: /Cabo USB-C/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /Álcool Isopropílico/ })).toHaveCount(0)

  // Busca insensível a acento: "alcool" (sem acento) encontra "Álcool"
  await page.getByTestId('combobox-busca').fill('alcool')
  await expect(page.getByRole('button', { name: /Álcool Isopropílico/ })).toBeVisible()

  // Texto sem correspondência → "Nenhum resultado"
  await page.getByTestId('combobox-busca').fill('zzzzz')
  await expect(page.getByText('Nenhum resultado')).toBeVisible()

  // Limpa e seleciona o Cabo
  await page.getByTestId('combobox-busca').fill('cabo')
  await page.getByRole('button', { name: /Cabo USB-C/ }).click()
  await expect(page.getByRole('button', { name: /Cabo USB-C/ })).toBeVisible() // gatilho mostra a seleção
})
