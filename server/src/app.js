import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import healthRouter from './routes/health.routes.js'

const app = express()

app.disable('x-powered-by')
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }),
)
app.use(express.json({ limit: '100kb' }))
app.use(cookieParser())

app.use('/api/health', healthRouter)

export default app
