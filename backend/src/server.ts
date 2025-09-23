import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

// Load environment variables FIRST
dotenv.config()

import relayRoutes from './routes/relay'

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))
app.use(express.json())

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
  next()
})

// Routes
app.use('/api/relay', relayRoutes)

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'pothole-relayer'
  })
})

// Error handling
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', error)
  res.status(500).json({ error: 'Internal server error' })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Relayer server running on port ${PORT}`)
  console.log(`🌍 Frontend URL: ${process.env.FRONTEND_URL}`)
  console.log(`⛓️  Chain ID: ${process.env.CHAIN_ID}`)
  console.log(`📝 Forwarder: ${process.env.FORWARDER_ADDRESS}`)
})

export default app