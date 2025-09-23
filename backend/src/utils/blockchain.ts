import { ethers, JsonRpcProvider, Wallet, Contract } from 'ethers'
import { RelayerConfig } from '../types/metaTx'
import PotholesForwarderArtifact from '../../../contracts/artifacts/contracts/PotholesForwarder.sol/PotholesForwarder.json'

// Real PotholesForwarder ABI
export const FORWARDER_ABI = PotholesForwarderArtifact.abi

export class BlockchainService {
  private provider: JsonRpcProvider
  private wallet: Wallet
  private forwarder: Contract

  constructor(config: RelayerConfig) {
    this.provider = new JsonRpcProvider(config.rpcUrl)
    // console.log('Private key length:', config.relayerPrivateKey?.length)
    // console.log('Private key type:', typeof config.relayerPrivateKey)
    // console.log('Private key starts with 0x:', config.relayerPrivateKey?.startsWith('0x'))
    this.wallet = new Wallet(config.relayerPrivateKey, this.provider)
    this.forwarder = new Contract(
      config.forwarderAddress,
      FORWARDER_ABI,
      this.wallet
    )
  }

  async getNonce(from: string): Promise<string> {
    const nonce = await this.forwarder.nonces(from)
    return nonce.toString()
  }

  async verifySignature(request: any, signature: string): Promise<boolean> {
    try {
      // Transform request to match ForwardRequestData struct
      const forwardRequestData = {
        from: request.from,
        to: request.to,
        value: request.value,
        gas: request.gas,
        deadline: request.deadline || Math.floor(Date.now() / 1000) + 3600, // 1 hour from now if not provided
        data: request.data,
        signature: signature
      }

      const isValid = await this.forwarder.verify(forwardRequestData)
      return isValid
    } catch (error) {
      console.error('Signature verification failed:', error)
      return false
    }
  }

  async executeMetaTx(request: any, signature: string): Promise<string> {
    try {
      console.log('Executing meta-transaction...')
      console.log('Request:', request)
      console.log('Signature:', signature)

      // Transform request to match ForwardRequestData struct
      const forwardRequestData = {
        from: request.from,
        to: request.to,
        value: request.value,
        gas: request.gas,
        deadline: request.deadline || Math.floor(Date.now() / 1000) + 3600, // 1 hour from now if not provided
        data: request.data,
        signature: signature
      }

      const tx = await this.forwarder.execute(forwardRequestData, {
        gasLimit: 300000, // Generous gas limit
        value: request.value || 0 // Include value if present
      })

      console.log('Transaction sent:', tx.hash)

      // Wait for confirmation
      const receipt = await tx.wait()
      console.log('Transaction confirmed in block:', receipt.blockNumber)

      return tx.hash
    } catch (error) {
      console.error('Meta-transaction execution failed:', error)
      throw error
    }
  }

  async getBalance(): Promise<string> {
    const balance = await this.provider.getBalance(this.wallet.address)
    return ethers.formatEther(balance)
  }

  getRelayerAddress(): string {
    return this.wallet.address
  }
}