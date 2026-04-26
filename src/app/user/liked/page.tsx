// @ts-nocheck
"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useState, Suspense } from 'react'
import { IconHeart, IconTrash, IconShoppingCart, IconHeartBroken } from '@tabler/icons-react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import axios from "@/lib/axios";
import { useAuthStore } from '@/store/Auth'
import { useDataStore } from "@/store/Data"
import Loading from './loading' // Use the skeleton component

type LikedItem = {
  $id: string
  slug: string
  productName: string
  images?: string[]
  price: number
  finalPrice: number
}

const LikedProducts = () => {
  const router = useRouter()
  const { user } = useAuthStore()
  const { userData, setUserData } = useDataStore()
  const [items, setItems] = useState<LikedItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLiked()
  }, [user, userData])

  const loadLiked = async () => {
    setLoading(true)
    try {
      if (user && userData && Array.isArray(userData.likedProducts) && userData.likedProducts.length > 0) {
        const resp = await axios.get<any>('/api/company/product')
        const all = resp?.data?.rows || []
        const liked = all.filter((p: any) => userData.likedProducts.includes(p.$id))
        setItems(liked)
      } else {
        const raw = localStorage.getItem('liked')
        setItems(raw ? JSON.parse(raw) : [])
      }
    } catch (e) {
      console.error('Failed to load liked', e)
      toast.error('Failed to load liked items')
    } finally {
      setLoading(false)
    }
  }

  const removeItem = async (id: string) => {
    try {
      if (user) {
        await axios.post<any>('/api/company/product/remove-from-liked', { userID: user.$id, productID: id })
        if(userData){
          setUserData(user?.$id)
        }
        setItems((prev) => prev.filter((p) => p.$id !== id))
        toast.success('Removed from wishlist')
      } else {
        const raw = localStorage.getItem('liked')
        const updated = (raw ? JSON.parse(raw) : []).filter((p: any) => p.$id !== id)
        localStorage.setItem('liked', JSON.stringify(updated))
        setItems(updated)
        toast.info('Removed from wishlist')
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to remove item')
    }
  }

  const addToCart = (item: LikedItem) => {
    if (!userData) {
      toast.error('Please login to add items to cart')
      return
    }

    try {
      const res = axios.post<any>("/api/user/cart/add", {customerID: user!.$id, productID: item.$id, productName: item.productName, slug: item.slug, price: item.finalPrice, qty: 1})
      res.then(response=> {
        console.log(response.data);
        toast.success(`Product added to cart`)
        if (userData) setUserData(user!.$id) // update cart badge immediately
      })
      .catch(err=>{
        console.log(err)
        toast.error("Failed to add to cart")
        return
      })
      
    } catch (error) {
      console.error("Add to cart error:", error)
      toast.error("Failed to add to cart")
      return
    }
  }

  if (loading) {
    return <Loading />;
  }

  if (items.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-20 bg-card border rounded-2xl shadow-sm px-4 mt-4'>
        <div className="mb-6 inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-50 dark:bg-red-950/30">
            <IconHeartBroken size={48} className="text-red-400" stroke={1.5} />
        </div>
        <h2 className='text-2xl font-bold mb-3 text-gray-900 dark:text-gray-100'>Your wishlist is empty</h2>
        <p className='text-gray-500 mb-8 text-center max-w-md'>Tap the heart icon on any product to save it for later and quickly find your favorites here.</p>
        <button 
          onClick={() => router.push('/shop')} 
          className="px-8 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-all shadow-md hover:shadow-lg active:scale-95"
        >
          Browse Products
        </button>
      </div>
    );
  }

  return (
    <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7'>
      {items.map((item) => {
        const discount = item.price > item.finalPrice ? Math.round(((item.price - item.finalPrice) / item.price) * 100) : 0;
        return (
          <div
            key={item.$id}
            onClick={() => router.push(`/shop/product/${item.slug}`)}
            className='group flex flex-col p-3 border rounded-2xl shadow-sm bg-card hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden'
          >
            <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-800/50 mb-3">
              <img src={item.images?.[0]} alt={item.productName} className='object-cover w-full h-full group-hover:scale-105 transition-transform duration-500' />
              
              {discount > 0 && (
                  <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg z-10 shadow-sm">
                      {discount}% OFF
                  </div>
              )}

              {/* Quick action overlay button on Desktop */}
              <div className="absolute bottom-0 left-0 right-0 p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300 opacity-0 group-hover:opacity-100 hidden sm:block">
                  <button
                      onClick={(e) => {
                          e.stopPropagation();
                          addToCart(item);
                      }}
                      className="w-full bg-primary/90 hover:bg-primary backdrop-blur-sm text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all"
                  >
                      <IconShoppingCart size={18} />
                      <span className="text-sm">Add to Cart</span>
                  </button>
              </div>
            </div>
            
            <div className='flex flex-col flex-1'>
              <h3 className='font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 text-sm leading-tight group-hover:text-primary transition-colors mb-2'>{item.productName}</h3>
              
              <div className='mt-auto flex items-end justify-between'>
                <div className='flex flex-col'>
                    <span className='font-bold text-lg text-gray-900 dark:text-gray-100 leading-none'>₹{item.finalPrice}</span>
                    {item.price > item.finalPrice && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 line-through mt-1">₹{item.price}</span>
                    )}
                </div>
              </div>
            </div>
            
            <div className='flex items-center gap-2 mt-3 z-10 relative'>
              {/* Mobile cart button */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  addToCart(item)
                }} 
                className='sm:hidden flex-1 h-10 bg-primary/10 text-primary dark:bg-primary/30 dark:text-primary/80 rounded-xl flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-colors'
              >
                <IconShoppingCart size={18} /> <span className='text-sm font-medium'>Add</span>
              </button>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  removeItem(item.$id);
                }} 
                className='h-10 w-12 sm:w-full border rounded-xl text-red-500 hover:bg-red-50 hover:border-red-200 dark:text-red-400 dark:hover:bg-red-950/30 dark:hover:border-red-900/50 transition-colors active:scale-95 flex-shrink-0 flex justify-center items-center'
                title="Remove from wishlist"
              >
                <IconTrash size={18} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function LikedPage() {
  return (
    <div className="min-h-[80vh] flex flex-col">
      <main className="w-full xl:px-16 lg:px-8 md:px-6 px-4 max-w-screen-2xl mx-auto py-8">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 text-red-500 rounded-lg dark:bg-red-900/20 dark:text-red-400">
                  <IconHeart size={24} className="fill-red-500" />
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Wishlist</h1>
          </div>
        </div>
        
        <Suspense fallback={<Loading />}>
          <LikedProducts />
        </Suspense>
      </main>
    </div>
  )
}
