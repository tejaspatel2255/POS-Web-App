// src/hooks/useProducts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Product } from '../types'
import { cacheProducts, getCachedProducts } from '../lib/offlineDb'

export function useProducts(storeId: string | undefined, categoryId?: string | null) {
  return useQuery<Product[]>({
    queryKey: ['products', storeId],
    queryFn: async () => {
      if (!storeId) return []

      if (navigator.onLine) {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('store_id', storeId)
          .order('sort_order', { ascending: true })

        if (error) throw error
        const products = data || []
        // Save to offline cache
        await cacheProducts(storeId, products)
        return products
      } else {
        // Retrieve from offline cache
        return getCachedProducts(storeId)
      }
    },
    enabled: !!storeId,
    // Perform local filtering so offline mode supports category filter seamlessly
    select: (products) => {
      if (!categoryId) return products
      return products.filter((p) => p.category_id === categoryId)
    },
  })
}

export function useCreateProduct(storeId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newProduct: Omit<Product, 'id' | 'created_at' | 'store_id'>) => {
      if (!storeId) throw new Error('No active store')

      const { data, error } = await supabase
        .from('products')
        .insert([{ ...newProduct, store_id: storeId }])
        .select()
        .single()

      if (error) throw error
      return data as Product
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', storeId] })
    },
  })
}

export function useUpdateProduct(storeId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (product: Partial<Product> & { id: string }) => {
      const { id, ...updateFields } = product
      const { data, error } = await supabase
        .from('products')
        .update(updateFields)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Product
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', storeId] })
    },
  })
}

export function useDeleteProduct(storeId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', storeId] })
    },
  })
}

export function useToggleAvailability(storeId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, isAvailable }: { id: string; isAvailable: boolean }) => {
      const { data, error } = await supabase
        .from('products')
        .update({ is_available: isAvailable })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Product
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', storeId] })
    },
  })
}
