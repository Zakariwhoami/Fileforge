import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'

import authRoutes from './routes/auth.js'
import filesRoutes from './routes/files.js'
import { verifyToken } from './middleware/verifyToken.js'
import { startCleanup } from './services/cleanup.js'

const app = express()                      // 1. create the app first
const PORT = process.env.PORT || 5000

app.use(helmet())                          // 2. middleware
app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

app.get('/api/health', (req, res) => {     // 3. routes
  res.json({ success: true, message: 'FileForge API is running' })
})

app.use('/api/auth', authRoutes)
// app.use('/api/files', verifyToken, filesRoutes)  --- because the new route code now checks the token itself, no need for verifytoken
app.use('/api/files', filesRoutes)

app.listen(PORT, () => {                   // 4. start the server
  console.log(`Server running on http://localhost:${PORT}`)
  startCleanup()
})