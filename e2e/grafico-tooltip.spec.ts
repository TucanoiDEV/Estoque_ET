import { test, expect, Page } from '@playwright/test'

const ADMIN = { email: 'admin@armazemmachado.demo', senha: 'Admin@123' }

async function loginAdmin(page: Page) {
  await page.goto('/login')
  await page.fill('#email', ADMIN.email)
  await page.fill('#senha', ADMIN.senha)
  await page.click('button[type=submit]')
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 15_000 })
}

test('Gráfico de Saídas: tooltip mostra o top 5 produtos do período', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 })
  await loginAdmin(page)
  await page.getByRole('button', { name: 'Gráficos' }).click()

  const card = page.locator('div.bg-dark-card').filter({ has: page.getByRole('heading', { name: 'Saídas por Período' }) }).first()
  const surface = card.locator('.recharts-surface').first()
  await surface.scrollIntoViewIfNeeded()
  const box = await surface.boundingBox()
  if (!box) throw new Error('gráfico de saídas não encontrado')

  // Varre o eixo X até o ponto cujo tooltip traz o top de produtos (mês com saídas)
  let achou = false
  for (let i = 0; i <= 40 && !achou; i++) {
    await page.mouse.move(box.x + box.width * (1 - i * 0.025), box.y + box.height * 0.4)
    await page.waitForTimeout(60)
    achou = await page.getByText('Top 5 produtos do período').isVisible().catch(() => false)
  }
  expect(achou, 'o tooltip deveria listar o top de produtos do período').toBeTruthy()

  // O tooltip lista produtos numerados (1., 2., ...)
  const tooltip = page.locator('div').filter({ hasText: 'Top 5 produtos do período' }).last()
  await expect(tooltip.getByText(/^1\./)).toBeVisible()
})
