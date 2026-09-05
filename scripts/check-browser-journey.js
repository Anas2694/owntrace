async (page) => {
  const base = 'http://localhost:5175'
  const failures = []
  const checks = []
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  const assert = (condition, message) => { if (!condition) throw new Error(message); checks.push(message) }
  await page.context().clearCookies()
  await page.goto(base)
  for (const name of ['Accounts', 'Subscriptions', 'Breach reports', 'Privacy actions']) {
    await page.getByRole('button', { name, exact: true }).click()
    assert(await page.getByRole('button', { name, exact: true }).getAttribute('aria-pressed') === 'true', `Identity area: ${name}`)
  }
  assert(await page.getByText('Illustration, not live data', { exact: true }).isVisible(), '3D map is labelled illustrative')
  const brokenAnchors = await page.locator('a[href^="#"]').evaluateAll((links) => links.map((link) => link.getAttribute('href')).filter((href) => href.length > 1 && !document.getElementById(href.slice(1))))
  assert(brokenAnchors.length === 0, 'Landing section links resolve')
  await page.goto(`${base}/register`)
  const email = `browser-${Date.now()}@example.com`
  const password = 'Synthetic QA password 2026!'
  await page.getByLabel('Name', { exact: true }).fill('Browser QA')
  await page.getByLabel('Email address').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByLabel('Confirm password').fill(password)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL('**/onboarding')
  await page.getByRole('button', { name: 'Review the privacy approach' }).click()
  await page.getByRole('button', { name: 'Understand mail connections' }).click()
  await page.getByRole('button', { name: 'Continue to mail connections' }).click()
  await page.waitForURL('**/connect')
  await page.getByRole('link', { name: 'Review privacy setup' }).click()
  await page.getByRole('button', { name: 'Back', exact: true }).click()
  await page.getByRole('button', { name: 'Back', exact: true }).click()
  await page.getByRole('button', { name: 'Review the privacy approach' }).click()
  await page.getByRole('button', { name: 'Understand mail connections' }).click()
  await page.getByRole('button', { name: 'Continue to mail connections' }).click()
  await page.waitForURL('**/connect')
  assert(await page.getByRole('alert').count() === 0, 'Reviewing earlier onboarding steps does not regress progress')
  await page.getByRole('button', { name: 'Continue without connecting' }).click()
  await page.waitForURL('**/dashboard')
  await page.getByRole('heading', { name: 'What needs your attention?' }).waitFor()
  assert(await page.getByRole('heading', { name: 'What needs your attention?' }).isVisible(), 'Optional provider setup reaches dashboard')
  await page.goto(`${base}/login`)
  await page.waitForURL('**/dashboard')
  checks.push('Signed-in visitors skip the login page')
  const routes = ['/', '/dashboard', '/accounts', '/account-actions', '/identity', '/subscriptions', '/breaches', '/exposures', '/privacy-health', '/privacy-inbox', '/privacy-requests', '/notifications', '/settings', '/connect', '/connect/gmail', '/connect/microsoft', '/privacy-policy', '/terms']
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 950 })
    for (const path of routes) {
      await page.goto(base + path)
      await page.waitForLoadState('networkidle')
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)
      if (overflow) failures.push(`${width}px ${path}: horizontal overflow`)
      if (!(await page.locator('h1').count())) failures.push(`${width}px ${path}: missing heading`)
    }
    checks.push(`${routes.length} routes checked at ${width}px`)
  }
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${base}/dashboard`)
  await page.getByRole('button', { name: 'Open navigation' }).click()
  await page.locator('summary').click()
  for (let index = 0; index < 22; index++) {
    await page.keyboard.press('Tab')
    assert(await page.locator('.privacy-sidebar').evaluate((el) => el.contains(document.activeElement)), `Mobile menu focus stays inside (${index + 1})`)
  }
  await page.keyboard.press('Escape')
  assert(await page.getByRole('button', { name: 'Open navigation' }).evaluate((el) => el === document.activeElement), 'Escape returns focus to menu button')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(base)
  await page.getByRole('button', { name: 'Subscriptions', exact: true }).focus()
  await page.keyboard.press('Enter')
  assert(await page.getByRole('button', { name: 'Subscriptions', exact: true }).getAttribute('aria-pressed') === 'true', '3D explanation works with keyboard and reduced motion')
  await page.screenshot({ path: '.playwright-cli/pr22-home-mobile.png', fullPage: true })
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto(`${base}/dashboard`)
  await page.screenshot({ path: '.playwright-cli/pr22-dashboard.png' })
  assert(errors.length === 0, `No uncaught browser errors (${errors.length})`)
  assert(failures.length === 0, failures.join('; ') || 'All tested layouts fit')
  return { checks, failures, errors }
}
