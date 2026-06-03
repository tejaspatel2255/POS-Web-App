// File Path: d:/Projects/Web/Universal POS/src/hooks/useProducts.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import type { Product } from '../types'

export function useProducts(storeId: string | null | undefined, categoryId?: string | null) {
  return useQuery({
    queryKey: ['products', storeId, categoryId],
    queryFn: async () => {
      if (!storeId) return []
      let query = (supabase
        .from('products') as any)
        .select('*')
        .eq('store_id', storeId)
        .order('sort_order', { ascending: true })

      if (categoryId) {
        query = query.eq('category_id', categoryId)
      }

      const { data, error } = await query
      if (error) throw error
      return data as Product[]
    },
    enabled: !!storeId,
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (newProduct: Omit<Product, 'id' | 'created_at'>) => {
      const { data, error } = await (supabase
        .from('products') as any)
        .insert(newProduct)
        .select()
        .single()
      if (error) throw error
      return data as Product
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products', data.store_id] })
    }
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, store_id: _store_id, changes }: { id: string; store_id: string; changes: Partial<Product> }) => {
      const { data, error } = await (supabase
        .from('products') as any)
        .update(changes)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Product
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products', data.store_id] })
    }
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, store_id }: { id: string; store_id: string }) => {
      const { error } = await (supabase
        .from('products') as any)
        .delete()
        .eq('id', id)
      if (error) throw error
      return { id, store_id }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products', data.store_id] })
    }
  })
}

export function useToggleAvailability() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, store_id: _store_id, is_available }: { id: string; store_id: string; is_available: boolean }) => {
      const { data, error } = await (supabase
        .from('products') as any)
        .update({ is_available })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Product
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products', data.store_id] })
    }
  })
}
