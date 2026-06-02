import { test, expect, Page } from '@playwright/test'
import { escolherNoCombo } from './helpers/combo'

const ADMIN = { email: 'admin@armazemmachado.demo', senha: 'Admin@123' }
const CAT = 'Cat Integra Teste'

async function abrirConfigEstoque(page: Page) {
  await page.goto('/login')
  await page.fill('#email', ADMIN.email)
  await page.fill('#senha', ADMIN.senha)
  await page.click('button[type=submit]')
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 15_000 })
  await page.getByRole('button', { name: 'Configurações' }).click()
  await page.getByRole('main').getByRole('button', { name: 'Estoque', exact: true }).click()
  await expect(page.getByText('Categorias de produtos')).toBeVisible()
}

test('Categoria das Configurações aparece no cadastro de produto', async ({ page }) => {
  await abrirConfigEstoque(page)

  // Adiciona uma categoria nas Configurações (persiste no banco)
  await page.getByPlaceholder('Nova categoria...').fill(CAT)
  await page.getByPlaceholder('Nova categoria...').press('Enter')
  await expect(page.getByText(CAT, { exact: true })).toBeVisible() // chip

  // Abre o cadastro de produto — a categoria deve estar no combo (pesquisável)
  await page.getByRole('button', { name: 'Novo produto' }).click()
  await expect(page.getByRole('heading', { name: 'Cadastrar novo produto' })).toBeVisible()
  await escolherNoCombo(page, 'Sem categoria', CAT, CAT)
  await expect(page.getByRole('button', { name: CAT, exact: true })).toBeVisible() // gatilho mostra a categoria

  // Fecha o modal e limpa: remove a categoria de teste das Configurações
  await page.getByRole('button', { name: 'Cancelar' }).click()
  await expect(page.getByRole('heading', { name: 'Cadastrar novo produto' })).toBeHidden()
  await page.getByRole('button', { name: `Remover ${CAT}` }).click()
  await expect(page.getByText(CAT, { exact: true })).toHaveCount(0)
})
