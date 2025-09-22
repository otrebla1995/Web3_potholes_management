'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'

export function ConnectWallet() {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
      <ConnectButton />
    </div>
  )
}