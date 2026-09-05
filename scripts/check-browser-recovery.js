async (page) => {
  const base = 'http://localhost:5175'
  await page.unrouteAll({ behavior: 'ignoreErrors' })
  const checks = []
  const assert = (value, message) => { if (!value) throw new Error(message); checks.push(message) }
  const session = await (await page.request.get(`${base}/api/auth/session`)).json()
  if (!session.user) throw new Error('Run check-browser-journey.js first to create the disposable QA session.')

  await page.route('**/api/auth/session', (route) => route.fulfill({ status: 503, json: { code: 'SESSION_UNAVAILABLE', message: 'Temporarily unavailable' } }))
  await page.goto(`${base}/dashboard`)
  await page.getByRole('button', { name: 'Try again' }).waitFor()
  await page.unroute('**/api/auth/session')
  await page.getByRole('button', { name: 'Try again' }).click()
  await page.getByRole('heading', { name: 'What needs your attention?' }).waitFor()
  checks.push('Transient session failure recovers without signing in again')

  await page.route('**/api/account-actions?*', (route) => route.fulfill({ status: 503, json: { message: 'Actions unavailable' } }))
  await page.goto(`${base}/dashboard`)
  await page.getByRole('button', { name: 'Retry overview' }).waitFor()
  assert(await page.getByRole('heading', { name: 'Recent account evidence' }).isVisible(), 'Dashboard keeps available results after one endpoint fails')
  await page.unroute('**/api/account-actions?*')
  await page.getByRole('button', { name: 'Retry overview' }).click()
  await page.getByRole('heading', { name: 'Suggested actions' }).waitFor()

  let actionStatus = 'OPEN'
  const action = { id: '123456789012345678901234', title: 'Synthetic account review', description: 'Test-only action', priority: 'LOW', reason: 'Fixture evidence', account: { serviceName: 'QA fixture' } }
  await page.route('**/api/account-actions?*', (route) => {
    const url = route.request().url()
    const selected = url.match(/[?&]status=([^&]+)/)?.[1]
    const pageNumber = Number(url.match(/[?&]page=(\d+)/)?.[1])
    return route.fulfill({ json: { actions: selected === actionStatus ? [{ ...action, status: actionStatus }] : [], pagination: { page: pageNumber, totalPages: 2, total: 13, limit: 12 } } })
  })
  await page.route('**/api/account-actions/123456789012345678901234', (route) => { actionStatus = route.request().postDataJSON().status; return route.fulfill({ json: { success: true } }) })
  await page.goto(`${base}/privacy-inbox`)
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await page.getByText('Page 2 of 2', { exact: true }).waitFor()
  assert(await page.getByRole('button', { name: 'Next', exact: true }).isDisabled(), 'Pagination respects totalPages and stops on last page')
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await page.getByText('No actions in this view', { exact: true }).waitFor()
  await page.getByLabel('Show actions').selectOption('IN_PROGRESS')
  await page.getByRole('button', { name: 'Mark completed' }).click()
  await page.getByLabel('Show actions').selectOption('COMPLETED')
  await page.getByRole('button', { name: 'Return to review' }).waitFor()
  assert(actionStatus === 'COMPLETED', 'Started actions remain accessible and can be completed')
  await page.unroute('**/api/account-actions?*')
  await page.unroute('**/api/account-actions/123456789012345678901234')

  for (const provider of ['google', 'microsoft']) {
    let sync = null
    let failBatch = true
    const connection = { id: 'synthetic-connection', email: 'fixture@example.com', status: 'CONNECTED' }
    await page.route(`**/api/${provider}/connection`, (route) => route.fulfill({ json: { [provider]: { available: true, connection, capabilities: { confirmed: [], inferred: [], unsupported: [] }, syncPolicy: { batchSize: 25, messageLimit: 2000 } } } }))
    await page.route(`**/api/${provider}/sync`, (route) => {
      if (route.request().method() === 'POST') sync = { status: 'QUEUED', processedCount: 0, storedCount: 0 }
      return route.fulfill({ json: { sync } })
    })
    await page.route(`**/api/${provider}/sync/next`, (route) => {
      if (failBatch) { sync = { ...sync, status: 'FAILED', lastErrorCode: 'PROVIDER_RATE_LIMITED' }; return route.fulfill({ status: 429, json: { message: 'Synthetic provider rate limit. Try later.' } }) }
      sync = { status: 'COMPLETED', processedCount: 25, storedCount: 0 }
      return route.fulfill({ json: { sync } })
    })
    await page.goto(`${base}/connect/${provider === 'google' ? 'gmail' : 'microsoft'}`)
    await page.getByRole('button', { name: 'Start metadata scan' }).click()
    await page.getByRole('alert').filter({ hasText: 'Synthetic provider rate limit' }).waitFor()
    await page.getByRole('heading', { name: 'Scan needs attention' }).waitFor()
    assert(await page.getByRole('alert').filter({ hasText: 'Synthetic provider rate limit' }).isVisible(), `${provider}: provider error survives status reload`)
    failBatch = false
    await page.getByRole('button', { name: 'Start metadata scan' }).click()
    await page.getByRole('link', { name: 'Review discovered accounts' }).click()
    await page.waitForURL('**/accounts')
    checks.push(`${provider}: successful retry links to discovered accounts`)
    await page.unroute(`**/api/${provider}/connection`)
    await page.unroute(`**/api/${provider}/sync`)
    await page.unroute(`**/api/${provider}/sync/next`)
  }
  await page.goto(`${base}/dashboard`)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('button', { name: 'Open navigation' }).click()
  await page.getByRole('button', { name: 'Sign out', exact: true }).click()
  await page.waitForURL(base + '/')
  await page.goto(`${base}/dashboard`)
  await page.waitForURL('**/login')
  checks.push('Logout clears session and protects dashboard')
  await page.setViewportSize({ width: 1440, height: 1000 })
  return { checks, note: 'Provider and populated action responses are synthetic browser fixtures; other API calls use the isolated QA database.' }
}
