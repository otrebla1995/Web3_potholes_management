'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { UserX, Shield, Phone, Mail, Building2 } from 'lucide-react'

export function UnauthorizedView() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <UserX className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Access Restricted</h1>
          <p className="text-lg text-slate-600">
            You need to be registered to use the PotholeTracker system
          </p>
        </div>

        {/* Registration Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Registration Required</span>
            </CardTitle>
            <CardDescription>
              To report potholes and participate in the system, you need to be registered as a citizen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h3 className="font-medium text-blue-900 mb-2">For Citizens:</h3>
                <p className="text-sm text-blue-800">
                  Contact your local municipality to get registered as a citizen. 
                  Once registered, you can report potholes and earn PBC tokens for helping your community.
                </p>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <h3 className="font-medium text-green-900 mb-2">For Municipal Staff:</h3>
                <p className="text-sm text-green-800">
                  If you're a municipal employee, contact your system administrator to be added as an authorized municipal authority.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>Get in touch to request access</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-md">
                <Building2 className="h-5 w-5 text-slate-600" />
                <div>
                  <div className="font-medium text-slate-900">Municipality Office</div>
                  <div className="text-sm text-slate-600">Visit your local office</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-md">
                <Phone className="h-5 w-5 text-slate-600" />
                <div>
                  <div className="font-medium text-slate-900">Call Center</div>
                  <div className="text-sm text-slate-600">+1 (555) 123-4567</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-md">
                <Mail className="h-5 w-5 text-slate-600" />
                <div>
                  <div className="font-medium text-slate-900">Email Support</div>
                  <div className="text-sm text-slate-600">info@municipality.gov</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-md">
                <Shield className="h-5 w-5 text-slate-600" />
                <div>
                  <div className="font-medium text-slate-900">System Admin</div>
                  <div className="text-sm text-slate-600">For technical issues</div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <Button variant="outline">
                Learn More About Registration
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}