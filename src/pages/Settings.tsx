import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Building2, Receipt, Users } from 'lucide-react'

export default function Settings() {
  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto pb-24 lg:pb-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-poppins text-primary">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure your store and team</p>
      </div>

      <div className="grid gap-6">
        <Card className="glass-card border-none shadow-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              <CardTitle>Business Details</CardTitle>
            </div>
            <CardDescription>Update your store information displayed on receipts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Business Name</label>
              <Input defaultValue="Savaliya Ice Cream" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Address</label>
              <Input defaultValue="Main Bazaar, City" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Phone Number</label>
              <Input defaultValue="+91 9876543210" />
            </div>
            <Button>Save Details</Button>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              <CardTitle>Tax & Charges</CardTitle>
            </div>
            <CardDescription>Configure default taxes and parcel fees</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Default Tax Rate (%)</label>
              <Input type="number" defaultValue="0" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Default Parcel Charges (₹)</label>
              <Input type="number" defaultValue="0" />
            </div>
            <Button>Save Configuration</Button>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <CardTitle>Staff Management</CardTitle>
            </div>
            <CardDescription>Manage user access and roles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground bg-white/50 p-4 rounded-xl border">
              Staff management requires interaction with Supabase Auth admin APIs. For now, you can manage users directly in your Supabase dashboard under Authentication &gt; Users. Ensure you assign a 'role' (admin or cashier) in the 'profiles' table after creating a user.
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="outline" asChild>
                <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer">
                  Open Supabase Dashboard
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
