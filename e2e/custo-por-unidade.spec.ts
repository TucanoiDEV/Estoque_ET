import { test, expect, Page } from '@playwright/test'
import { escolherNoCombo } from './helpers/combo'

const ADMIN = { email: 'admin@armazemmachado.demo', senha: 'Admin@123' }

async function abrirNovoProduto(page: Page) {
  await page.goto('/login')
  await page.fill('#email', ADMIN.email)
  await page.fill('#senha', ADMIN.senha)
  await page.click('button[type=submit]')
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 15_000 })
  await page.getByRole('button', { name: 'Novo produto' }).click()
  await expect(page.getByRole('heading', { name: 'Cadastrar novo produto' })).toBeVisible()
}

test('Novo produto: rótulo do custo muda conforme a unidade', async ({ page }) => {
  await abrirNovoProduto(page)

  // Padrão UN (o sufixo R$/un aparece no custo e na venda → .first() = o do custo)
  await expect(page.getByText('Custo por unidade')).toBeVisible()
  await expect(page.getByText('R$/un').first()).toBeVisible()

  // Troca para Metro (combo de unidade mostra "Unidade (UN)")
  await escolherNoCombo(page, 'Unidade (UN)', 'Metro', 'Metro (M)')
  await expect(page.getByText('Custo por metro')).toBeVisible()
  await expect(page.getByText('R$/m', { exact: true }).first()).toBeVisible()

  // Troca para Quilograma (agora o gatilho mostra "Metro (M)")
  await escolherNoCombo(page, 'Metro (M)', 'Quilograma', 'Quilograma (KG)')
  await expect(page.getByText('Custo por quilograma')).toBeVisible()
  await expect(page.getByText('R$/kg').first()).toBeVisible()
})
