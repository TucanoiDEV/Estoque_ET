import { test, expect, Page } from '@playwright/test'

const ADMIN = { email: 'admin@armazemmachado.demo', senha: 'Admin@123' }

async function abrirFornecedores(page: Page) {
  await page.goto('/login')
  await page.fill('#email', ADMIN.email)
  await page.fill('#senha', ADMIN.senha)
  await page.click('button[type=submit]')
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 15_000 })
  await page.getByRole('button', { name: 'Configurações' }).click()
  await page.getByRole('main').getByRole('button', { name: 'Fornecedores', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Fornecedores' })).toBeVisible()
}

test('Fornecedores: adicionar e excluir (round-trip)', async ({ page }) => {
  page.on('dialog', (d) => d.accept()) // aceita o confirm() de exclusão
  await abrirFornecedores(page)

  // Lista carrega os fornecedores do seed
  await expect(page.getByRole('cell', { name: 'TechParts Brasil' })).toBeVisible()

  // Adiciona um fornecedor de teste
  const nome = 'TESTE E2E LTDA'
  await page.getByRole('button', { name: 'Novo fornecedor' }).click()
  await expect(page.getByRole('heading', { name: 'Novo fornecedor' })).toBeVisible()
  await page.getByPlaceholder('Ex: TechParts Brasil').fill(nome)
  await page.getByRole('button', { name: 'Salvar' }).click()
  await expect(page.getByRole('cell', { name: nome })).toBeVisible()

  // Exclui o fornecedor de teste (sem entradas vinculadas → deve excluir)
  const linha = page.getByRole('row', { name: new RegExp(nome) })
  await linha.getByRole('button', { name: 'Excluir' }).click()
  await expect(page.getByRole('cell', { name: nome })).toHaveCount(0)
})
