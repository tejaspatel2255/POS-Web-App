// File Path: d:/Projects/Web/Universal POS/src/hooks/useOfflineProducts.ts

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import {
  cacheProducts,
  getCachedProducts,
  cacheCategories,
  getCachedCategories,
} from '@/lib/offlineDb'
import type { Product, Category } from '@/types'

export function useOfflineProducts(storeId: string | null | undefined) {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [isFromCache, setIsFromCache] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!storeId) {
      setProducts([])
      setCategories([])
      setLoading(false)
      return
    }

    const handleOnlineStatus = () => {
      setIsOffline(!navigator.onLine)
    }

    window.addEventListener('online', handleOnlineStatus)
    window.addEventListener('offline', handleOnlineStatus)

    const loadData = async () => {
      setLoading(true)
      try {
        if (navigator.onLine) {
          // 1. Fetch categories
          const { data: catData, error: catError } = await supabase
            .from('categories')
            .select('*')
            .eq('store_id', storeId)
            .order('sort_order', { ascending: true })

          if (catError) throw catError

          // 2. Fetch products
          const { data: prodData, error: prodError } = await supabase
            .from('products')
            .select('*')
            .eq('store_id', storeId)
            .order('sort_order', { ascending: true })

          if (prodError) throw prodError

          // 3. Cache them
          await cacheCategories(storeId, catData as Category[])
          await cacheProducts(storeId, prodData as Product[])

          setCategories(catData as Category[])
          setProducts(prodData as Product[])
          setIsFromCache(false)
        } else {
          // Serve from Cache
          const cachedCats = await getCachedCategories(storeId)
          const cachedProds = await getCachedProducts(storeId)

          setCategories(cachedCats)
          setProducts(cachedProds)
          setIsFromCache(true)
        }
      } catch (err: any) {
        console.error('Failed to load products/categories, fetching cache fallback...', err)
        // Fallback to cache on query error (e.g. rate limit, connection drop mid-request)
        const cachedCats = await getCachedCategories(storeId)
        const cachedProds = await getCachedProducts(storeId)

        setCategories(cachedCats)
        setProducts(cachedProds)
        setIsFromCache(true)
        setError(err.message || 'Failed to sync with live database.')
      } finally {
        setLoading(false)
      }
    }

    loadData()

    return () => {
      window.removeEventListener('online', handleOnlineStatus)
      window.removeEventListener('offline', handleOnlineStatus)
    }
  }, [storeId, isOffline])

  return { products, categories, isOffline, isFromCache, loading, error }
}
