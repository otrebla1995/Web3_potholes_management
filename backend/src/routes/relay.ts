import { Router, Request, Response } from 'express'
import { RelayerService } from '../services/RelayerService'
import { RelayerConfig } from '../types/metaTx'

const router = Router()

// Initialize relayer service
const relayerConfig: RelayerConfig = {
  rpcUrl: process.env.RPC_URL || 'http://localhost:8545',
  chainId: parseInt(process.env.CHAIN_ID || '31337'),
  forwarderAddress: process.env.FORWARDER_ADDRESS!,
  relayerPrivateKey: process.env.RELAYER_PRIVATE_KEY!,
  gasLimit: parseInt(process.env.GAS_LIMIT || '200000')
}

const relayerService = new RelayerService(relayerConfig)

// POST /api/relay - Process meta-transaction
router.post('/', async (req: Request, res: Response) => {
  console.log('Received relay request')
  
  try {
    const metaTxRequest = req.body
    
    if (!metaTxRequest.request) {
      return res.status(400).json({
        success: false,
        error: 'Missing request'
      })
    }

    const result = await relayerService.processMetaTx(metaTxRequest)
    
    if (result.success) {
      res.json(result)
    } else {
      res.status(400).json(result)
    }

  } catch (error) {
    console.error('API Error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
})

// GET /api/relay/nonce - Get nonce for an address
router.get('/nonce', async (req: Request, res: Response) => {
  const address = req.query.address as string
  if (!address) {
    return res.status(400).json({ error: 'Missing address parameter' })
  }

  try {
    const nonce = await relayerService.getNonce(address)
    res.json({ nonce: nonce.toString() })
  } catch (error) {
    console.error('Nonce error:', error)
    res.status(500).json({ error: 'Failed to get nonce' })
  }
})

// GET /api/relay/status - Get relayer status
router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = await relayerService.getStatus()
    res.json(status)
  } catch (error) {
    console.error('Status error:', error)
    res.status(500).json({ error: 'Failed to get status' })
  }
})

export default router