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

  async getNonce(from: string): Promise<bigint> {
    const nonce = await this.forwarder.nonces(from)
    console.log(`Fetched nonce for ${from}:`, nonce.toString())
    return nonce
  }

  async verifySignature(request: any): Promise<boolean> {
    try {
      const isValid = await this.forwarder.verify(request)
      return isValid
    } catch (error) {
      console.error('Signature verification failed:', error)
      return false
    }
  }

  async executeMetaTx(request: any): Promise<string> {
    try {
      console.log('Executing meta-transaction...')
      console.log('Request:', request)
      const tx = await this.forwarder.execute(request)

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