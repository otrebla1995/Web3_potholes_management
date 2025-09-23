export interface ForwardRequestData {
  from: string
  to: string
  value: bigint
  gas: bigint
  deadline: bigint
  data: string
  signature: string
}

export interface MetaTxRequest {
  request: ForwardRequestData
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