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

test('Novo produto: adicionar uma cor nova no dropdown', async ({ page }) => {
  await loginAdmin(page)
  await page.getByRole('button', { name: 'Novo produto' }).click()
  await expect(page.getByRole('heading', { name: 'Cadastrar novo produto' })).toBeVisible()

  // Combo de Cor mostra "Sem cor"; adiciona "Magenta" (persiste no localStorage)
  await adicionarNoCombo(page, 'Sem cor', 'Magenta')
  // A cor nova fica selecionada (o gatilho passa a mostrar "Magenta")
  await expect(page.getByRole('button', { name: 'Magenta' })).toBeVisible()
})

test('Nova entrada: campo Fornecedor permite adicionar', async ({ page }) => {
  await loginAdmin(page)
  await page.getByRole('button', { name: 'Nova entrada' }).click()
  await expect(page.getByText('Nova entrada de estoque')).toBeVisible()

  // Abre o combo de Fornecedor ("Sem fornecedor") e digita um nome novo
  await page.getByRole('button', { name: 'Sem fornecedor' }).click()
  await page.getByTestId('combobox-busca').fill('Fornecedor XYZ')
  // A opção de adicionar aparece (não confirmamos, para não gravar no banco)
  await expect(page.getByRole('button', { name: 'Adicionar "Fornecedor XYZ"' })).toBeVisible()
})
