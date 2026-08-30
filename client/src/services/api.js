import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true,
})

const SESSION_ENDED_EVENT = 'owntrace:session-ended'
const sessionEndedCodes = new Set(['INVALID_SESSION', 'UNAUTHENTICATED'])

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      typeof window !== 'undefined'
      && sessionEndedCodes.has(error.response?.data?.code)
    ) {
      window.dispatchEvent(new Event(SESSION_ENDED_EVENT))
    }
    return Promise.reject(error)
  },
)

export { SESSION_ENDED_EVENT }
export default api
