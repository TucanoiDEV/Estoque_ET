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

async function selecionarProduto(page: Page, textoParcial: string) {
  await escolherNoCombo(page, /Selecione um produto/, textoParcial, new RegExp(textoParcial))
}

test('Nova entrada: custo muda conforme a unidade do produto', async ({ page }) => {
  await loginAdmin(page)
  await page.getByRole('button', { name: 'Nova entrada' }).click()
  await expect(page.getByText('Nova entrada de estoque')).toBeVisible()

  // Sem produto: rótulo padrão
  await expect(page.getByText('Custo por unidade')).toBeVisible()
  await expect(page.getByText('R$/un', { exact: true })).toBeVisible()

  // Produto em litro → "Custo por litro" / R$/L
  await selecionarProduto(page, 'Álcool Isopropílico')
  await expect(page.getByText('Custo por litro')).toBeVisible()
  await expect(page.getByText('R$/L', { exact: true })).toBeVisible()
})

test('Nova saída: custo muda conforme a unidade do produto', async ({ page }) => {
  await loginAdmin(page)
  await page.getByRole('button', { name: 'Saída', exact: true }).click()
  await expect(page.getByText('Registrar saída de estoque')).toBeVisible()

  await expect(page.getByText('Custo por unidade')).toBeVisible()

  await selecionarProduto(page, 'Álcool Isopropílico')
  await expect(page.getByText('Custo por litro')).toBeVisible()
  await expect(page.getByText('R$/L', { exact: true })).toBeVisible()
})
