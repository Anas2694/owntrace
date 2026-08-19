import { serializeUser } from '../services/auth.service.js'
import { getDashboardData } from '../services/dashboard.service.js'

async function getDashboard(request, response) {
  const user = serializeUser(request.user)
  const dashboardData = await getDashboardData(request.auth.userId)

  response.status(200).json({
    success: true,
    dashboard: {
      user,
      ...dashboardData,
    },
  })
}

export { getDashboard }
