// File Path: d:/Projects/Web/Universal POS/src/hooks/useCategories.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import type { Category } from '../types'

export function useCategories(storeId: string | null | undefined) {
  return useQuery({
    queryKey: ['categories', storeId],
    queryFn: async () => {
      if (!storeId) return []
      const { data, error } = await (supabase
        .from('categories') as any)
        .select('*')
        .eq('store_id', storeId)
        .order('sort_order', { ascending: true })
      
      if (error) throw error
      return data as Category[]
    },
    enabled: !!storeId,
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (newCategory: Omit<Category, 'id' | 'created_at'>) => {
      const { data, error } = await (supabase
        .from('categories') as any)
        .insert(newCategory)
        .select()
        .single()
      if (error) throw error
      return data as Category
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['categories', data.store_id] })
    }
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, store_id: _store_id, changes }: { id: string; store_id: string; changes: Partial<Category> }) => {
      const { data, error } = await (supabase
        .from('categories') as any)
        .update(changes)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Category
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['categories', data.store_id] })
    }
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, store_id }: { id: string; store_id: string }) => {
      const { error } = await (supabase
        .from('categories') as any)
        .delete()
        .eq('id', id)
      if (error) throw error
      return { id, store_id }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['categories', data.store_id] })
      // Products might belong to the deleted category, so invalidate products too
      queryClient.invalidateQueries({ queryKey: ['products', data.store_id] })
    }
  })
}
