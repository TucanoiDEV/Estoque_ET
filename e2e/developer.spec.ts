import { test, expect } from '@playwright/test'

// A área "Desenvolvedor" em Configurações é exclusiva do cargo developer.
// Aqui garantimos o caso determinístico: um admin NÃO enxerga a aba.
// (O caso positivo — developer vê a aba e os diagnósticos — foi validado
// manualmente; depende de uma conta com cargo developer no Supabase.)
test('admin não vê a aba Desenvolvedor em Configurações', async ({ page }) => {
  await page.goto('/login')
  await page.fill('#email', 'admin@armazemmachado.demo')
  await page.fill('#senha', 'Admin@123')
  await page.click('button[type=submit]')
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 15000 })

  await page.getByRole('button', { name: 'Configurações' }).click()
  await expect(page.getByRole('heading', { name: 'Configurações' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Desenvolvedor' })).toHaveCount(0)
})
