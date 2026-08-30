function getDefaultAuthenticatedRoute(user) {
  if (user?.onboardingStatus === 'COMPLETED') return '/dashboard'
  if (['GMAIL_PENDING', 'SCAN_PENDING'].includes(user?.onboardingStatus)) return '/connect/gmail'
  return '/onboarding'
}

function canAccessAuthenticatedRoute(user, pathname) {
  if (user?.onboardingStatus === 'COMPLETED') return true
  if (pathname === '/onboarding') return true
  return (
    pathname === '/connect/gmail'
    && ['GMAIL_PENDING', 'SCAN_PENDING'].includes(user?.onboardingStatus)
  )
}

function getPostLoginRoute(user, requestedPath) {
  return typeof requestedPath === 'string' && canAccessAuthenticatedRoute(user, requestedPath)
    ? requestedPath
    : getDefaultAuthenticatedRoute(user)
}

export { canAccessAuthenticatedRoute, getDefaultAuthenticatedRoute, getPostLoginRoute }
