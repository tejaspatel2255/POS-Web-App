import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Edit2, Trash2, Loader2, Search } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function MenuManagement() {
  const [activeTab, setActiveTab] = useState<'categories' | 'products'>('categories')
  const [search, setSearch] = useState('')
  const queryClient = useQueryClient()

  const { data: categories = [], isLoading: loadingCat } = useQuery<any[]>({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('*').order('sort_order')
      return data || []
    }
  })

  const { data: products = [], isLoading: loadingProd } = useQuery<any[]>({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('*, categories(name)').order('sort_order')
      return data || []
    }
  })

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('categories').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
  })

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-products'] })
  })

  const toggleAvailability = useMutation({
    mutationFn: async ({ id, is_available }: { id: string, is_available: boolean }) => {
      const { error } = await (supabase.from('products') as any).update({ is_available }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-products'] })
  })

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto pb-24 lg:pb-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-poppins text-primary">Menu Management</h1>
          <p className="text-muted-foreground mt-1">Manage categories and products</p>
        </div>
        
        <div className="flex bg-white rounded-lg p-1 shadow-sm border w-full sm:w-auto">
          <button
            className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'categories' ? 'bg-primary text-white shadow' : 'hover:bg-gray-100 text-gray-600'}`}
            onClick={() => setActiveTab('categories')}
          >
            Categories
          </button>
          <button
            className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'products' ? 'bg-primary text-white shadow' : 'hover:bg-gray-100 text-gray-600'}`}
            onClick={() => setActiveTab('products')}
          >
            Products
          </button>
        </div>
      </div>

      <Card className="glass-card border-none shadow-md">
        <CardContent className="p-0">
          {activeTab === 'categories' && (
            <div className="p-4">
              <div className="flex justify-end mb-4">
                <Button className="gap-2"><Plus className="w-4 h-4" /> Add Category</Button>
              </div>
              
              {loadingCat ? <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sort Order</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((cat) => (
                      <TableRow key={cat.id}>
                        <TableCell>{cat.sort_order}</TableCell>
                        <TableCell className="font-medium">{cat.name}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon"><Edit2 className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => {
                            if(window.confirm('Delete category?')) deleteCategory.mutate(cat.id)
                          }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}

          {activeTab === 'products' && (
            <div className="p-4">
              <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input 
                    placeholder="Search products..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button className="gap-2 w-full sm:w-auto"><Plus className="w-4 h-4" /> Add Product</Button>
              </div>

              {loadingProd ? <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((prod) => (
                      <TableRow key={prod.id}>
                        <TableCell className="font-medium">{prod.name}</TableCell>
                        <TableCell>{(prod.categories as any)?.name}</TableCell>
                        <TableCell>{formatCurrency(prod.price || 0)}</TableCell>
                        <TableCell>
                          <button 
                            onClick={() => toggleAvailability.mutate({ id: prod.id, is_available: !prod.is_available })}
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${prod.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                          >
                            {prod.is_available ? 'Available' : 'Unavailable'}
                          </button>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon"><Edit2 className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => {
                            if(window.confirm('Delete product?')) deleteProduct.mutate(prod.id)
                          }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
