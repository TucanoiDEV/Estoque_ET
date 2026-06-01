import { test, expect, Page } from '@playwright/test'

const ADMIN = { email: 'admin@armazemmachado.demo', senha: 'Admin@123' }

async function loginAdmin(page: Page) {
  await page.goto('/login')
  await page.fill('#email', ADMIN.email)
  await page.fill('#senha', ADMIN.senha)
  await page.click('button[type=submit]')
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 15_000 })
}

test('Nova entrada: zero à esquerda é removido ao digitar', async ({ page }) => {
  await loginAdmin(page)
  await page.getByRole('button', { name: 'Nova entrada' }).click()
  await expect(page.getByText('Nova entrada de estoque')).toBeVisible()

  // Campo Quantidade (primeiro input numérico do modal)
  const qtd = page.locator('input[inputmode="numeric"]').first()
  await qtd.fill('0')                  // simula o "0" inicial
  await qtd.pressSequentially('43')    // usuário digita 43 depois do zero
  await expect(qtd).toHaveValue('43')  // deve virar 43, não 043

  // Campo Custo unitário (decimal)
  const custo = page.locator('input[inputmode="decimal"]').first()
  await custo.fill('0')
  await custo.pressSequentially('54')
  await expect(custo).toHaveValue('54') // 054 -> 54

  // Decimais continuam funcionando
  await custo.fill('')
  await custo.pressSequentially('12,50')
  await expect(custo).toHaveValue('12.50')
})
