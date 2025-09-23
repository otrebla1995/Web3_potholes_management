export interface ForwardRequest {
  from: string
  to: string
  value: string
  gas: string
  nonce: string
  data: string
}

export interface MetaTxRequest {
  request: ForwardRequest
  signature: string
}

export interface RelayResponse {
  success: boolean
  txHash?: string
  error?: string
  message?: string
}

export interface RelayerConfig {
  rpcUrl: string
  chainId: number
  forwarderAddress: string
  relayerPrivateKey: string
  gasLimit: number
}