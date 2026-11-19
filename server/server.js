
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'

import authRoutes from './routes/auth.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(helmet())

app.use(cors({
  origin: 'http://localhost:5173'
}))

app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'FileForge API is running'
  })
})

app.use('/api/auth', authRoutes)

app.listen(PORT, () => {
  console.log(`FileForge running on port ${PORT}`)
})
