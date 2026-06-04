// src/hooks/useCategories.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Category } from '../types'
import { cacheCategories, getCachedCategories } from '../lib/offlineDb'

export function useCategories(storeId: string | undefined) {
  return useQuery<Category[]>({
    queryKey: ['categories', storeId],
    queryFn: async () => {
      if (!storeId) return []

      if (navigator.onLine) {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('store_id', storeId)
          .order('sort_order', { ascending: true })

        if (error) throw error
        const categories = data || []
        // Save to offline cache
        await cacheCategories(storeId, categories)
        return categories
      } else {
        // Retrieve from offline cache
        return getCachedCategories(storeId)
      }
    },
    enabled: !!storeId,
  })
}

export function useCreateCategory(storeId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newCategory: Omit<Category, 'id' | 'created_at' | 'store_id'>) => {
      if (!storeId) throw new Error('No active store')

      const { data, error } = await supabase
        .from('categories')
        .insert([{ ...newCategory, store_id: storeId }])
        .select()
        .single()

      if (error) throw error
      return data as Category
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', storeId] })
    },
  })
}

export function useUpdateCategory(storeId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (category: Partial<Category> & { id: string }) => {
      const { id, ...updateFields } = category
      const { data, error } = await supabase
        .from('categories')
        .update(updateFields)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Category
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', storeId] })
    },
  })
}

export function useDeleteCategory(storeId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('categories').delete().eq('id', id)
      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', storeId] })
    },
  })
}
