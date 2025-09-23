import { ethers } from 'ethers'
import { ForwardRequestData, MetaTxRequest, RelayResponse, RelayerConfig } from '../types/metaTx'
import { BlockchainService } from '../utils/blockchain'

export class RelayerService {
  private blockchain: BlockchainService
  private config: RelayerConfig

  constructor(config: RelayerConfig) {
    // console.log('Initializing RelayerService with config:', config)
    this.config = config
    this.blockchain = new BlockchainService(config)
  }

  async processMetaTx(metaTxRequest: MetaTxRequest): Promise<RelayResponse> {
    console.log('Processing meta-transaction request...')
    
    try {

      const { request } = metaTxRequest

      // 1. Validate request format
      if (!this.isValidRequest(request)) {
        return {
          success: false,
          error: 'Invalid request format'
        }
      }

      // 2. Convert request to contract format
      const contractRequest = {
        from: request.from,
        to: request.to,
        value: BigInt(request.value),
        gas: BigInt(request.gas),
        deadline: BigInt(request.deadline),
        data: request.data,
        signature: request.signature
      }

      // 3. Verify signature
      console.log('Verifying signature...')
      const isValidSignature = await this.blockchain.verifySignature(
        contractRequest
      )

      if (!isValidSignature) {
        return {
          success: false,
          error: 'Invalid signature'
        }
      }

      console.log('Signature verified')

      // 4. Check relayer balance
      const relayerBalance = await this.blockchain.getBalance()
      console.log('Relayer balance:', relayerBalance, 'ETH')

      if (parseFloat(relayerBalance) < 0.01) {
        return {
          success: false,
          error: 'Insufficient relayer balance'
        }
      }

      // 5. Execute the meta-transaction
      console.log('Executing meta-transaction...')
      const txHash = await this.blockchain.executeMetaTx(contractRequest)

      return {
        success: true,
        txHash,
        message: 'Meta-transaction executed successfully'
      }

    } catch (error: any) {
      console.error('Relayer service error:', error)
      return {
        success: false,
        error: error.message || 'Failed to process meta-transaction'
      }
    }
  }

  private isValidRequest(request: ForwardRequestData): boolean {
    return !!(
      request.from &&
      request.to &&
      request.value !== undefined &&
      request.gas &&
      request.deadline !== undefined &&
      request.data
    )
  }

  async getNonce(address: string): Promise<bigint> {
    console.log(`Getting nonce for address: ${address}`)
    return this.blockchain.getNonce(address)
  }

  async getStatus() {
    const relayerAddress = this.blockchain.getRelayerAddress()
    const balance = await this.blockchain.getBalance()
    
    return {
      relayerAddress,
      balance: `${balance} ETH`,
      chainId: this.config.chainId,
      forwarderAddress: this.config.forwarderAddress,
      status: 'active'
    }
  }
}