import { test, expect } from '@playwright/test'

const ADMIN = { email: 'admin@armazemmachado.demo', senha: 'Admin@123' }

// Simula um usuário não-admin forçando o cargo do perfil retornado pelo banco.
test('Configurações fica oculta para não-admin (operador)', async ({ page }) => {
  await page.route('**/rest/v1/usuarios**', async (route) => {
    const resp = await route.fetch()
    let body = await resp.text()
    try {
      const json = JSON.parse(body)
      if (Array.isArray(json)) json.forEach((u: any) => { if (u && typeof u === 'object') u.cargo = 'operador' })
      else if (json && typeof json === 'object') (json as any).cargo = 'operador'
      body = JSON.stringify(json)
    } catch { /* mantém original */ }
    await route.fulfill({ response: resp, body })
  })

  await page.goto('/login')
  await page.fill('#email', ADMIN.email)
  await page.fill('#senha', ADMIN.senha)
  await page.click('button[type=submit]')
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 15_000 })

  // Confirma que o app o trata como operador
  await expect(page.getByText('operador').first()).toBeVisible()

  // A aba Configurações NÃO aparece para o operador
  await expect(page.getByRole('button', { name: 'Configurações' })).toHaveCount(0)

  // Operador é somente-leitura: as ações de escrita também somem
  await expect(page.getByRole('button', { name: 'Nova entrada' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Novo produto' })).toHaveCount(0)

  // Mas ele ainda vê Dashboard e Estoque (leitura)
  await expect(page.getByRole('button', { name: 'Estoque' })).toBeVisible()
})
