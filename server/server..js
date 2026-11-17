
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(helmet())
app.use(cors({
  origin: 'http://localhost:5173'
}))
app.use(express.json())

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to FileForge API',
    status: 'Running'
  })
})

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'FileForge server is healthy'
  })
})

app.listen(PORT, () => {
  console.log(`FileForge API running on port ${PORT}`)
})
