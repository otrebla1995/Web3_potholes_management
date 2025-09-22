import { ConnectWallet } from '@/components/ConnectWallet'

export default function Home() {
  return (
    <main className="container mx-auto py-8">
      <h1 className="text-4xl font-bold text-center mb-8">
        Potholes Management System
      </h1>
      <ConnectWallet />
    </main>
  )
}