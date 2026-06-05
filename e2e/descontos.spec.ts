import { test, expect, Page } from '@playwright/test'

const ADMIN = { email: 'admin@armazemmachado.demo', senha: 'Admin@123' }

async function abrirDescontos(page: Page) {
  await page.goto('/login')
  await page.fill('#email', ADMIN.email)
  await page.fill('#senha', ADMIN.senha)
  await page.click('button[type=submit]')
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 15_000 })
  await page.getByRole('button', { name: 'Configurações' }).click()
  await page.getByRole('main').getByRole('button', { name: 'Descontos', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Descontos' })).toBeVisible()
}

test('Descontos: seleção de produto + prévia do novo custo (% e valor)', async ({ page }) => {
  await abrirDescontos(page)

  // Seleciona um produto pela busca
  await page.getByPlaceholder('Buscar produto...').fill('Cabo')
  const linha = page.locator('label', { hasText: 'Cabo USB-C' })
  await linha.getByRole('checkbox').check()
  await expect(page.getByText(/1 produto\(s\) selecionado/)).toBeVisible()

  // 100% de desconto → prévia mostra R$ 0,00 (não aplicamos, só conferimos)
  await page.getByPlaceholder('10').fill('100')
  await expect(linha.getByText('R$ 0,00')).toBeVisible()

  // Troca para valor fixo alto → também zera (clamp em 0)
  await page.getByRole('button', { name: 'Valor fixo (R$)' }).click()
  await page.getByPlaceholder('0,00').fill('999999')
  await expect(linha.getByText('R$ 0,00')).toBeVisible()
})

test('Descontos: selecionar todos marca os produtos filtrados', async ({ page }) => {
  await abrirDescontos(page)
  await page.getByPlaceholder('Buscar produto...').fill('Lona')
  // Espera a lista filtrar antes de clicar (evita race com o re-render)
  await expect(page.locator('label', { hasText: 'Lona PE Azul' })).toBeVisible()
  await page.getByRole('button', { name: 'Selecionar todos' }).click()
  // Pelo menos alguns produtos "Lona" são selecionados
  await expect(page.getByText(/[1-9]\d* produto\(s\) selecionado/)).toBeVisible()
})
