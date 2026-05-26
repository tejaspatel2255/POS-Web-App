import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Edit2, Trash2, Loader2, Search, X } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function MenuManagement() {
  const [activeTab, setActiveTab] = useState<'categories' | 'products'>('categories')
  const [search, setSearch] = useState('')
  const queryClient = useQueryClient()

  // Category Modal State
  const [isCatModalOpen, setIsCatModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any | null>(null)
  const [catName, setCatName] = useState('')
  const [catSortOrder, setCatSortOrder] = useState('0')

  // Product Modal State
  const [isProdModalOpen, setIsProdModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any | null>(null)
  const [prodName, setProdName] = useState('')
  const [prodCategoryId, setProdCategoryId] = useState('')
  const [prodPrice, setProdPrice] = useState('0.00')
  const [prodSortOrder, setProdSortOrder] = useState('0')
  const [prodIsAvailable, setProdIsAvailable] = useState(true)

  // Fetch Categories
  const { data: categories = [], isLoading: loadingCat } = useQuery<any[]>({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('*').order('sort_order')
      return data || []
    }
  })

  // Fetch Products
  const { data: products = [], isLoading: loadingProd } = useQuery<any[]>({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('*, categories(name)').order('sort_order')
      return data || []
    }
  })

  // Save Category Mutation (Add or Edit)
  const saveCategory = useMutation({
    mutationFn: async () => {
      const payload = {
        name: catName,
        sort_order: parseInt(catSortOrder) || 0
      }

      if (editingCategory) {
        const { error } = await (supabase.from('categories') as any).update(payload).eq('id', editingCategory.id)
        if (error) throw error
      } else {
        const { error } = await (supabase.from('categories') as any).insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
      queryClient.invalidateQueries({ queryKey: ['admin-products'] }) // Refresh products category reference
      closeCatModal()
    },
    onError: (err: any) => {
      alert('Error saving category: ' + err.message)
    }
  })

  // Delete Category Mutation
  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from('categories') as any).delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-categories'] }),
    onError: (err: any) => alert('Error deleting category: ' + err.message)
  })

  // Save Product Mutation (Add or Edit)
  const saveProduct = useMutation({
    mutationFn: async () => {
      const payload = {
        name: prodName,
        category_id: prodCategoryId || null,
        price: parseFloat(prodPrice) || 0.00,
        sort_order: parseInt(prodSortOrder) || 0,
        is_available: prodIsAvailable
      }

      if (editingProduct) {
        const { error } = await (supabase.from('products') as any).update(payload).eq('id', editingProduct.id)
        if (error) throw error
      } else {
        const { error } = await (supabase.from('products') as any).insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      closeProdModal()
    },
    onError: (err: any) => {
      alert('Error saving product: ' + err.message)
    }
  })

  // Delete Product Mutation
  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from('products') as any).delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-products'] }),
    onError: (err: any) => alert('Error deleting product: ' + err.message)
  })

  // Quick Toggle Availability
  const toggleAvailability = useMutation({
    mutationFn: async ({ id, is_available }: { id: string, is_available: boolean }) => {
      const { error } = await (supabase.from('products') as any).update({ is_available }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-products'] })
  })

  // Modals Open/Close Handlers
  const openAddCatModal = () => {
    setEditingCategory(null)
    setCatName('')
    setCatSortOrder('0')
    setIsCatModalOpen(true)
  }

  const openEditCatModal = (category: any) => {
    setEditingCategory(category)
    setCatName(category.name)
    setCatSortOrder(category.sort_order.toString())
    setIsCatModalOpen(true)
  }

  const closeCatModal = () => {
    setIsCatModalOpen(false)
    setEditingCategory(null)
  }

  const openAddProdModal = () => {
    setEditingProduct(null)
    setProdName('')
    setProdCategoryId(categories[0]?.id || '')
    setProdPrice('0.00')
    setProdSortOrder('0')
    setProdIsAvailable(true)
    setIsProdModalOpen(true)
  }

  const openEditProdModal = (product: any) => {
    setEditingProduct(product)
    setProdName(product.name)
    setProdCategoryId(product.category_id || '')
    setProdPrice(product.price.toString())
    setProdSortOrder(product.sort_order.toString())
    setProdIsAvailable(product.is_available)
    setIsProdModalOpen(true)
  }

  const closeProdModal = () => {
    setIsProdModalOpen(false)
    setEditingProduct(null)
  }

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
                <Button className="gap-2" onClick={openAddCatModal}>
                  <Plus className="w-4 h-4" /> Add Category
                </Button>
              </div>
              
              {loadingCat ? (
                <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : (
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
                          <Button variant="ghost" size="icon" onClick={() => openEditCatModal(cat)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive hover:text-destructive" 
                            onClick={() => {
                              if(window.confirm(`Are you sure you want to delete "${cat.name}"? All products under it will be deleted!`)) deleteCategory.mutate(cat.id)
                            }}
                          >
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
                <Button className="gap-2 w-full sm:w-auto" onClick={openAddProdModal}>
                  <Plus className="w-4 h-4" /> Add Product
                </Button>
              </div>

              {loadingProd ? (
                <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : (
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
                        <TableCell>{(prod.categories as any)?.name || 'Unassigned'}</TableCell>
                        <TableCell>{formatCurrency(prod.price || 0)}</TableCell>
                        <TableCell>
                          <button 
                            onClick={() => toggleAvailability.mutate({ id: prod.id, is_available: !prod.is_available })}
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                              prod.is_available 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50 hover:bg-emerald-100' 
                                : 'bg-rose-50 text-rose-700 border border-rose-200/50 hover:bg-rose-100'
                            }`}
                          >
                            {prod.is_available ? 'Available' : 'Unavailable'}
                          </button>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => openEditProdModal(prod)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive hover:text-destructive" 
                            onClick={() => {
                              if(window.confirm(`Are you sure you want to delete "${prod.name}"?`)) deleteProduct.mutate(prod.id)
                            }}
                          >
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

      {/* Category Add/Edit Modal */}
      {isCatModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-lg text-zinc-900">{editingCategory ? 'Edit Category' : 'Add Category'}</h3>
              <button onClick={closeCatModal} className="p-1 rounded-full hover:bg-zinc-200 transition-colors">
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-zinc-700">Category Name</label>
                <Input 
                  placeholder="e.g. ICECREAM" 
                  value={catName} 
                  onChange={e => setCatName(e.target.value)} 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-zinc-700">Sort Order</label>
                <Input 
                  type="number" 
                  placeholder="0" 
                  value={catSortOrder} 
                  onChange={e => setCatSortOrder(e.target.value)} 
                />
              </div>
            </div>

            <div className="p-6 border-t border-zinc-100 bg-gray-50/50 flex justify-end gap-2">
              <Button variant="outline" onClick={closeCatModal}>Cancel</Button>
              <Button 
                onClick={() => saveCategory.mutate()} 
                disabled={saveCategory.isPending || !catName.trim()}
                className="bg-primary text-white"
              >
                {saveCategory.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Product Add/Edit Modal */}
      {isProdModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-lg text-zinc-900">{editingProduct ? 'Edit Product' : 'Add Product'}</h3>
              <button onClick={closeProdModal} className="p-1 rounded-full hover:bg-zinc-200 transition-colors">
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-zinc-700">Product Name</label>
                <Input 
                  placeholder="e.g. Kesar Pista" 
                  value={prodName} 
                  onChange={e => setProdName(e.target.value)} 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-zinc-700">Category</label>
                <select 
                  value={prodCategoryId}
                  onChange={e => setProdCategoryId(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Unassigned</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-zinc-700">Price (₹)</label>
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00" 
                  value={prodPrice} 
                  onChange={e => setProdPrice(e.target.value)} 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-zinc-700">Sort Order</label>
                <Input 
                  type="number" 
                  placeholder="0" 
                  value={prodSortOrder} 
                  onChange={e => setProdSortOrder(e.target.value)} 
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="prodIsAvailable"
                  checked={prodIsAvailable} 
                  onChange={e => setProdIsAvailable(e.target.checked)}
                  className="w-4.5 h-4.5 rounded border-zinc-300 text-primary focus:ring-primary"
                />
                <label htmlFor="prodIsAvailable" className="text-sm font-semibold text-zinc-700 cursor-pointer select-none">
                  Available for Sale
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-zinc-100 bg-gray-50/50 flex justify-end gap-2">
              <Button variant="outline" onClick={closeProdModal}>Cancel</Button>
              <Button 
                onClick={() => saveProduct.mutate()} 
                disabled={saveProduct.isPending || !prodName.trim()}
                className="bg-primary text-white"
              >
                {saveProduct.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
