'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { useOwnerActions } from '@/hooks/useOwnerActions'
import { Building2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

export function AddMunicipalForm() {
  const [addAddress, setAddAddress] = useState('')
  const [removeAddress, setRemoveAddress] = useState('')
  
  const {
    addMunicipalAuthority,
    removeMunicipalAuthority,
    isPending,
    isConfirming,
    isValidAddress,
  } = useOwnerActions()

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isValidAddress(addAddress)) {
      toast.error('Please enter a valid Ethereum address')
      return
    }
    
    await addMunicipalAuthority(addAddress)
    setAddAddress('')
  }

  const handleRemove = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isValidAddress(removeAddress)) {
      toast.error('Please enter a valid Ethereum address')
      return
    }
    
    await removeMunicipalAuthority(removeAddress)
    setRemoveAddress('')
  }

  const isLoading = isPending || isConfirming

  return (
    <div className="space-y-6">
      {/* Add Municipal Authority */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5 text-blue-600" />
            <span>Add Municipal Authority</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Authority Wallet Address
              </label>
              <input
                type="text"
                value={addAddress}
                onChange={(e) => setAddAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>
            <Button 
              type="submit" 
              variant="municipal" 
              disabled={isLoading || !addAddress}
              className="w-full"
            >
              {isLoading ? 'Adding...' : 'Add Authority'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Remove Municipal Authority */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trash2 className="h-5 w-5 text-red-600" />
            <span>Remove Municipal Authority</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRemove} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Authority Address to Remove
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
              {isLoading ? 'Removing...' : 'Remove Authority'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}