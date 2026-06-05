import { test, expect, Page } from '@playwright/test'

const ADMIN = { email: 'admin@armazemmachado.demo', senha: 'Admin@123' }

async function loginAdmin(page: Page) {
  await page.goto('/login')
  await page.fill('#email', ADMIN.email)
  await page.fill('#senha', ADMIN.senha)
  await page.click('button[type=submit]')
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 15_000 })
}

async function irDescontos(page: Page) {
  await page.getByRole('button', { name: 'Configurações' }).click()
  await page.getByRole('main').getByRole('button', { name: 'Descontos', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Descontos' })).toBeVisible()
}

test('Desconto aplicado reflete no Estoque e na Saída (round-trip)', async ({ page }) => {
  page.on('dialog', (d) => d.accept()) // aceita os confirm()
  await loginAdmin(page)

  // 1. Aplica 10% no "Cabo USB-C" pela aba Descontos
  await irDescontos(page)
  await page.getByPlaceholder('Buscar produto...').fill('Cabo')
  const linha = page.locator('label', { hasText: 'Cabo USB-C' })
  await expect(linha).toBeVisible()
  await linha.getByRole('checkbox').check()
  await page.getByPlaceholder('10').fill('10')
  await page.getByRole('button', { name: 'Aplicar desconto' }).click()
  await expect(page.getByText(/Desconto aplicado/)).toBeVisible()

  // 2. Estoque mostra o desconto (badge −10%)
  await page.getByRole('complementary').getByRole('button', { name: 'Estoque' }).click()
  await page.getByPlaceholder('Buscar por nome ou código...').fill('Cabo')
  const linhaEstoque = page.getByRole('row', { name: /Cabo USB-C/ })
  await expect(linhaEstoque.getByText(/10%/)).toBeVisible()

  // Filtro "Com desconto" mantém o Cabo
  await page.getByRole('button', { name: 'Com desconto' }).click()
  await expect(page.getByRole('cell', { name: 'Cabo USB-C 2m' })).toBeVisible()

  // 3. Saída pré-preenche o preço com desconto
  await page.getByRole('button', { name: 'Saída', exact: true }).click()
  await page.getByRole('button', { name: /Selecione um produto/ }).click()
  await page.getByTestId('combobox-busca').fill('Cabo')
  await page.getByTestId('combobox-lista').getByRole('button', { name: /Cabo USB-C/ }).click()
  await expect(page.getByText(/10% aplicado/)).toBeVisible()
  await page.getByRole('button', { name: 'Cancelar' }).click()

  // 4. Limpa: remove o desconto do Cabo
  await irDescontos(page)
  await page.getByPlaceholder('Buscar produto...').fill('Cabo')
  const linha2 = page.locator('label', { hasText: 'Cabo USB-C' })
  await expect(linha2).toBeVisible()
  await linha2.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Remover desconto' }).click()
  await expect(page.getByText(/Desconto removido/)).toBeVisible()
})
