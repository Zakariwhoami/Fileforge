import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'

import authRoutes from './routes/auth.js'
import filesRoutes from './routes/files.js'
import adminRoutes from './routes/admin.js'      // imports stay at the top
import { startCleanup } from './services/cleanup.js'

const app = express()                            // 1. create the app first
const PORT = process.env.PORT || 5000

app.set('trust proxy', 1)                        // 2. only needed once deployed behind a host

app.use(helmet())
app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = (process.env.CLIENT_ORIGINS || 'http://localhost:5173').split(',')
      const home = /^http:\/\/(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/
      if (!origin || allowed.includes(origin)) return callback(null, true)
      if (process.env.NODE_ENV !== 'production' && home.test(origin)) return callback(null, true)
      callback(new Error('Not allowed by CORS'))
    },
  })
)
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'FileForge API is running' })
})

app.use('/api/auth', authRoutes)                 // 3. routes come after the app exists
app.use('/api/files', filesRoutes)               //    no verifyToken here anymore
app.use('/api/admin', adminRoutes)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  startCleanup()
})