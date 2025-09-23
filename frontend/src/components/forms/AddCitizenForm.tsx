'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { useOwnerActions } from '@/hooks/useOwnerActions'
import { Users, Plus, Trash2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

export function AddCitizenForm() {
  const [singleAddress, setSingleAddress] = useState('')
  const [batchAddresses, setBatchAddresses] = useState('')
  const [removeAddress, setRemoveAddress] = useState('')
  
  const {
    addCitizen,
    addCitizensBatch,
    removeCitizen,
    isPending,
    isConfirming,
    isValidAddress,
  } = useOwnerActions()

  const handleAddSingle = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isValidAddress(singleAddress)) {
      toast.error('Please enter a valid Ethereum address')
      return
    }
    
    await addCitizen(singleAddress)
    setSingleAddress('')
  }

  const handleAddBatch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const addresses = batchAddresses
      .split('\n')
      .map(addr => addr.trim())
      .filter(addr => addr.length > 0)
    
    // Validate all addresses
    const invalidAddresses = addresses.filter(addr => !isValidAddress(addr))
    if (invalidAddresses.length > 0) {
      toast.error(`Invalid addresses: ${invalidAddresses.join(', ')}`)
      return
    }
    
    if (addresses.length === 0) {
      toast.error('Please enter at least one address')
      return
    }
    
    await addCitizensBatch(addresses)
    setBatchAddresses('')
  }

  const handleRemove = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isValidAddress(removeAddress)) {
      toast.error('Please enter a valid Ethereum address')
      return
    }
    
    await removeCitizen(removeAddress)
    setRemoveAddress('')
  }

  const isLoading = isPending || isConfirming

  return (
    <div className="space-y-6">
      {/* Add Single Citizen */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5 text-green-600" />
            <span>Add Single Citizen</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddSingle} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Wallet Address
              </label>
              <input
                type="text"
                value={singleAddress}
                onChange={(e) => setSingleAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={isLoading}
              />
            </div>
            <Button 
              type="submit" 
              variant="owner" 
              disabled={isLoading || !singleAddress}
              className="w-full"
            >
              {isLoading ? 'Adding...' : 'Add Citizen'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Add Multiple Citizens */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-green-600" />
            <span>Add Multiple Citizens</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddBatch} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Wallet Addresses (one per line)
              </label>
              <textarea
                value={batchAddresses}
                onChange={(e) => setBatchAddresses(e.target.value)}
                placeholder={`0x...\n0x...\n0x...`}
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm h-32 focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={isLoading}
              />
            </div>
            <Button 
              type="submit" 
              variant="owner" 
              disabled={isLoading || !batchAddresses.trim()}
              className="w-full"
            >
              {isLoading ? 'Adding...' : 'Add All Citizens'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Remove Citizen */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trash2 className="h-5 w-5 text-red-600" />
            <span>Remove Citizen</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRemove} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Wallet Address to Remove
              </label>
              <input
                type="text"
                value={removeAddress}
                onChange={(e) => setRemoveAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                disabled={isLoading}
              />
            </div>
            <Button 
              type="submit" 
              variant="destructive" 
              disabled={isLoading || !removeAddress}
              className="w-full"
            >
              {isLoading ? 'Removing...' : 'Remove Citizen'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}