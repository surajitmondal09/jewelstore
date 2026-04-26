// @ts-nocheck
"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import axios from "@/lib/axios";
import { toast } from "react-toastify"
import Footer from "@/components/Footer"
import { IconMinus, IconPlus, IconShoppingCart, IconHeartFilled, IconHeart, IconShare, IconMapPin, IconX, IconTruck, IconShieldCheck } from "@tabler/icons-react"
import { useAuthStore } from "@/store/Auth"
import { useDataStore } from "@/store/Data"
import LoadingProduct from "./loading"
import { Skeleton } from '@/components/ui/skeleton'
// @ts-ignore
import { load } from "@cashfreepayments/cashfree-js"

const AlsoLikeSkeleton = () => (
  <div className='py-8 md:py-12 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8'>
    <Skeleton className='h-8 w-64 mb-6' />
    <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'>
      {[...Array(6)].map((_, i) => (
        <div key={i} className='flex flex-col gap-3 p-3 border rounded-2xl bg-card shadow-sm'>
            <Skeleton className='aspect-square rounded-xl w-full' />
            <div className="space-y-2 mt-2 flex-1">
                <Skeleton className='h-5 w-full' />
                <Skeleton className='h-4 w-2/3' />
            </div>
            <div className="mt-auto pt-2 flex justify-between items-center">
                <Skeleton className='h-6 w-1/3' />
                <Skeleton className='h-8 w-8 rounded-full' />
            </div>
        </div>
      ))}
    </div>
  </div>
)

export default function ProductPage() {
  const router = useRouter()
  const params: any = useParams()
  const slug = params?.slug
  const {user} = useAuthStore()
  
  const {userData, setUserData} = useDataStore()

  const [product, setProduct] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [qty, setQty] = useState(1)
  const [relatedProducts, setRelatedProducts] = useState<any[]>([])
  const [isLiked, setIsLiked] = useState(false)

  // Direct Checkout State
  const [showDirectCheckout, setShowDirectCheckout] = useState(false)
  const [addresses, setAddresses] = useState<any[]>([])
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "online">("online")
  const [isProcessingOrder, setIsProcessingOrder] = useState(false)
  const [cashfree, setCashfree] = useState<any>(null)

  useEffect(() => {
    // @ts-ignore
    load({ mode: "sandbox" }).then((cf: any) => setCashfree(cf)).catch((err: any) => console.error("Cashfree SDK failed to load", err))
  }, [])

  useEffect(() => {
    if (showDirectCheckout && userData?.$id) {
      axios.get(`/api/user/address?customerId=${userData.$id}`)
        .then(res => {
            if (res.data) {
                setAddresses(res.data)
                if (res.data.length > 0) setSelectedAddress(res.data[0].$id)
            }
        })
        .catch(err => console.error("Failed to load addresses", err))
    }
  }, [showDirectCheckout, userData?.$id])

  useEffect(() => {
    if (!slug) return
    fetchProduct()
  }, [slug])

  useEffect(() => {
    if (userData && product) {
      const likedList = userData.likedProducts || []      
      setIsLiked(likedList.includes(product.$id))
    }
  }, [userData, product])

  useEffect(() => {
    if (product?.category) {
      fetchRelatedProducts(product.category)
    }
  }, [product?.category])

  const fetchProduct = async () => {
    setLoading(true)
    try {
      const resp = await axios.get("/api/company/product")
      const all = resp?.data?.rows || []
      const found = all.find((p: any) => p.slug === slug)
      setProduct(found || null)
    } catch (err) {
      console.error(err)
      toast.error("Failed to load product")
    } finally {
      setLoading(false)
    }
  }

  const addToLiked = async (userID: string, productID: string)=>{
        const response = axios.post("/api/company/product/add-to-liked", {userID, productID})
        response.then(()=> {
          setIsLiked(true)
          if(user) setUserData(user.$id)
          toast.success("Added to wishlist")
       })
        .catch(err=>{
          console.log(err)
          toast.error("Failed to add to wishlist")
        })
  }

  const removeFromLiked = async (userID: string, productID: string)=>{
        const response = axios.post("/api/company/product/remove-from-liked", {userID, productID})
        response.then(()=> {
          setIsLiked(false)
          if(user) setUserData(user.$id)
          toast.success("Removed from wishlist")
       })
        .catch(err=>{
          console.log(err)
          toast.error("Failed to remove from wishlist")
        })
  }

  const handleShare = async () => {
    const url = window.location.href
    const title = product.productName
    const text = `Check out this product: ${title}`

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url,
        })
      } catch (err) {
        console.error('Error sharing:', err)
      }
    } else {
      try {
        await navigator.clipboard.writeText(url)
        toast.success('Link copied to clipboard!')
      } catch (err) {
        console.error('Failed to copy:', err)
        toast.error('Failed to copy link')
      }
    }
  }

  const fetchRelatedProducts = async (categoryName: string) => {
    try {
      const resp = await axios.get("/api/company/product/get_by_category", {
        params: { categoryName },
      })
      const allRelated = resp?.data?.rows || []
      const filtered = allRelated.filter((p: any) => p.slug !== slug).slice(0, 10)
      setRelatedProducts(filtered)
    } catch (err) {
      console.error(err)
    }
  }

  const changeQty = (delta: number) => {
    setQty((prev) => Math.max(1, prev + delta))
  }

  const addToCart = () => {
    if (!product) return
    if (!user || !userData) {
        toast.error("Please login to add to cart")
        return
    }
    try {
        const res = axios.post("/api/user/cart/add", {customerID: userData?.$id, productID: product.$id, productName: product.productName, slug: product.slug, price: product.finalPrice, qty: qty})
        res.then(()=> {
          toast.success(`${qty} x product added to cart`)
          if(user) setUserData(user.$id)
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

  const addToCartRelated = async (relatedProduct: any) => {
    if (!user || !userData) {
      toast.error("Please login to add items to cart");
      return;
    }
    
    try {
      const response = await axios.post("/api/user/cart/add", {
        customerID: userData.$id,
        productID: relatedProduct.$id,
        productName: relatedProduct.productName,
        slug: relatedProduct.slug,
        qty: 1,
        price: relatedProduct.finalPrice
      });
      
      if (response.data.success) {
        toast.success("Added to cart!");
        setUserData(user.$id);
      } else {
        toast.error(response.data.message || "Failed to add to cart");
      }
    } catch (error) {
      console.error("Failed to add to cart", error);
      toast.error("Failed to add to cart");
    }
  };

  const toggleLikedRelated = async (relatedProduct: any) => {
    if (!user || !userData) {
      toast.error("Please login to add to wishlist");
      return;
    }

    const likedList = userData.likedProducts || [];
    const isLikedCheck = likedList.includes(relatedProduct.$id);

    try {
      if (isLikedCheck) {
        await axios.post("/api/company/product/remove-from-liked", {
          userID: userData.$id,
          productID: relatedProduct.$id
        });
        toast.success("Removed from wishlist");
      } else {
        await axios.post("/api/company/product/add-to-liked", {
          userID: userData.$id,
          productID: relatedProduct.$id
        });
        toast.success("Added to wishlist!");
      }
      
      setUserData(user.$id);
    } catch (error) {
      console.error("Failed to update wishlist", error);
      toast.error("Failed to update wishlist");
    }
  };

  const handleOrderNow = () => {
    if (!user || !userData) {
        toast.error("Please login to place an order");
        return;
    }
    setShowDirectCheckout(true);
    // Smooth scroll to checkout section
    setTimeout(() => {
        document.getElementById('checkout-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  const verifyDirectPayment = async (orderId: string, itemIdStr: string) => {
    try {
        const subtotal = product.finalPrice * qty;
        const res = await axios.post("/api/user/online-order/verify-cashfree", {
            orderId,
            customerId: userData?.$id,
            addressID: selectedAddress,
            itemId: [itemIdStr],
            totalAmount: subtotal,
            shipping_charge: 0.0,
            isDirect: true
        });

        if (res.data?.success) {
            toast.success("Order placed successfully");
            if (setUserData && userData?.$id) {
                await setUserData(userData.$id);
            }
            setShowDirectCheckout(false);
        } else {
            toast.error("Payment verification failed");
        }
    } catch (err) {
        console.error(err);
        toast.error("Failed to verify payment");
    } finally {
        setIsProcessingOrder(false);
    }
  }

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
        toast.error("Please select a shipping address");
        return;
    }

    setIsProcessingOrder(true);
    const subtotal = product.finalPrice * qty;

    try {
        const itemRes = await axios.post("/api/item", {
            productId: product.$id,
            productName: product.productName,
            quantity: qty,
            price: product.finalPrice,
            slug: product.slug
        });
        
        if (itemRes.data?.error || !itemRes.data?.$id) {
            toast.error("Failed to prepare order");
            setIsProcessingOrder(false);
            return;
        }

        const newItemId = itemRes.data.$id;

        if (paymentMethod === "online") {
            if (!cashfree) {
                toast.error("Payment SDK not initialized");
                setIsProcessingOrder(false);
                return;
            }

            const customerDetails = {
                customerId: userData.$id,
                totalAmount: subtotal,
                name: userData.name,
                email: userData.email,
                phone: userData.phone || "9999999999",
                isDirect: true,
                itemId: [newItemId]
            };
            
            const sessionRes = await axios.post("/api/user/online-order/create-cashfree", customerDetails);
            if (sessionRes.data?.error) {
                toast.error("Could not initiate payment");
                setIsProcessingOrder(false);
                return;
            }

            const paymentSessionId = sessionRes.data.payment_session_id;
            const orderId = sessionRes.data.order_id;

            const checkoutOptions = {
                paymentSessionId: paymentSessionId,
                redirectTarget: "_modal",
            };

            cashfree.checkout(checkoutOptions).then((result: any) => {
                if(result.error){
                    toast.error(result.error.message || "Payment Failed");
                    setIsProcessingOrder(false);
                }
                if(result.redirect){
                    console.log("Redirection");
                }
                if(result.paymentDetails){
                    verifyDirectPayment(orderId, newItemId);
                }
            });

        } else {
            const res = await axios.post("/api/user/online-order", {
                customerId: userData.$id,
                addressID: selectedAddress,
                itemId: [newItemId],
                totalAmount: subtotal,
                shipping_charge: 0.0,
                paymentType: "cod",
                isDirect: true
            });

            if (res.data?.error) {
                toast.error("Failed to create order");
            } else {
                toast.success("Order placed successfully");
                if (setUserData && userData.$id) {
                    await setUserData(userData.$id);
                }
                setShowDirectCheckout(false);
            }
            setIsProcessingOrder(false);
        }
    } catch (err) {
        console.error(err);
        toast.error("Failed to process order");
        setIsProcessingOrder(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <LoadingProduct />
        <AlsoLikeSkeleton />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center">
        <div className="p-8 text-center bg-card rounded-2xl shadow-sm border max-w-md w-full">
            <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
            <p className="text-gray-500 mb-6">The product you are looking for does not exist or has been removed.</p>
            <button onClick={() => router.push('/shop')} className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors">
                Back to Shop
            </button>
        </div>
      </div>
    )
  }

  const images = product.images || [product.image || "/save-more.jpg"]
  const currentDiscount = product.price > product.finalPrice ? Math.round(((product.price - product.finalPrice) / product.price) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50/30 dark:bg-transparent">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left: Gallery */}
          <div className="lg:col-span-7 lg:sticky top-24">
            <div className="bg-card rounded-3xl p-4 md:p-6 shadow-sm border border-gray-100 dark:border-gray-800">
              <div className="relative w-full overflow-hidden rounded-2xl bg-gray-50 dark:bg-gray-800/50 group">
                <div className="w-full aspect-square relative">
                  <img
                    src={images[selectedImage]}
                    alt={product.productName}
                    className="absolute inset-0 w-full h-full object-cover transform transition-transform duration-500 hover:scale-105 cursor-zoom-in"
                  />
                  {currentDiscount > 0 && (
                      <div className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1.5 rounded-xl z-10 shadow-sm">
                          {currentDiscount}% OFF
                      </div>
                  )}
                </div>
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                  <div className="mt-4 flex gap-3 p-1 overflow-x-auto custom-scrollbar pb-2">
                    {images.map((src: string, i: number) => (
                    <button
                        key={i}
                        onClick={() => setSelectedImage(i)}
                        className={`h-24 w-24 shrink-0 rounded-2xl overflow-hidden border-2 transition-all duration-200 ${selectedImage === i ? 'ring-2 ring-offset-2 ring-primary/50 border-transparent shadow-md' : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600 opacity-70 hover:opacity-100'} focus:outline-none bg-gray-50 dark:bg-gray-800/50`}
                    >
                        <img src={src} alt={`thumb-${i}`} className="w-full h-full object-cover" />
                    </button>
                    ))}
                  </div>
              )}
            </div>
          </div>

          {/* Right: Details & Checkout */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-card rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-800">
              
              <div className="mb-4">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white leading-tight">
                    {product.productName}
                  </h1>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div className="flex flex-wrap items-end gap-3">
                  <span className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white">₹{product.finalPrice}</span>
                  {product.price > product.finalPrice && (
                      <>
                          <span className='text-lg sm:text-xl font-medium line-through text-gray-400'>₹{product.price}</span>
                          <span className='text-xs sm:text-sm font-bold text-primary bg-primary/10 dark:bg-primary/20 px-2 py-1 rounded-lg mb-1'>You save ₹{product.price - product.finalPrice}</span>
                      </>
                  )}
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                    <button 
                      onClick={() => handleShare()} 
                      className='p-2.5 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl transition-all active:scale-95'
                      aria-label="Share product"
                    >
                        <IconShare size={20} stroke={1.5} />
                    </button>
                    <button 
                      onClick={() => { 
                        if (!user || !userData) {
                          toast.error("Please login to add to wishlist");
                          return;
                        }
                        isLiked ? removeFromLiked(user.$id, product.$id) : addToLiked(user.$id, product.$id) 
                      }} 
                      className={`p-2.5 rounded-xl transition-all active:scale-95 ${isLiked ? 'bg-red-50 text-red-500 dark:bg-red-900/20' : 'bg-gray-50 hover:bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:hover:bg-gray-800 dark:text-gray-300'}`}
                      aria-label="Toggle wishlist"
                    >
                        {isLiked ? <IconHeartFilled size={20} /> : <IconHeart size={20} stroke={1.5} />}
                    </button>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-gray-50/50 dark:bg-gray-800/30 p-1">
                        <button onClick={() => changeQty(-1)} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-600 dark:text-gray-300 active:scale-95"><IconMinus size={18} /></button>
                        <div className="w-12 text-center font-semibold text-lg">{qty}</div>
                        <button onClick={() => changeQty(1)} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-600 dark:text-gray-300 active:scale-95"><IconPlus size={18} /></button>
                    </div>

                    <button onClick={addToCart} className="flex-1 flex justify-center items-center gap-2 py-3.5 bg-primary/10 hover:bg-primary/20 text-primary/90 dark:bg-primary/30 dark:hover:bg-primary/50 dark:text-primary/80 font-bold rounded-xl transition-all active:scale-95 border border-primary/10 dark:border-primary/30">
                        <IconShoppingCart size={20} /> 
                        <span>Add to Cart</span>
                    </button>
                </div>
                
                <button onClick={handleOrderNow} className="w-full flex justify-center items-center gap-2 py-4 bg-primary hover:bg-primary/90 text-white font-bold text-lg rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98]">
                  Buy It Now
                </button>
              </div>
            </div>

            {/* Direct Checkout Modal / Card */}
            {showDirectCheckout && (
              <div id="checkout-section" className="bg-card p-6 md:p-8 rounded-3xl shadow-lg border-2 border-primary/50 dark:border-blue-600 animate-in fade-in slide-in-from-bottom-4 relative scroll-mt-24">
                <button 
                    onClick={() => setShowDirectCheckout(false)} 
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                    <IconX size={20} />
                </button>
                
                <div className="mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Secure Checkout</h2>
                    <p className="text-sm text-gray-500 mt-1">Complete your purchase directly.</p>
                </div>
                
                <div className="grid gap-4 mb-8">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <IconMapPin size={18} className="text-primary/90" />
                        Shipping Address
                    </h3>
                    {addresses.length > 0 ? (
                        <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                            {addresses.map((address) => (
                                <label key={address.$id} className={`flex items-start gap-4 border p-4 rounded-2xl cursor-pointer transition-all ${selectedAddress === address.$id ? 'border-primary/50 bg-primary/5 dark:bg-primary/10 ring-1 ring-primary/50 shadow-sm' : 'hover:border-gray-300 bg-gray-50/30 dark:bg-gray-800/20'}`}>
                                    <input
                                        type="radio"
                                        name="address"
                                        value={address.$id}
                                        checked={selectedAddress === address.$id}
                                        onChange={(e) => setSelectedAddress(e.target.value)}
                                        className="mt-1 w-4 h-4 text-primary"
                                    />
                                    <div className="text-sm w-full">
                                        <p className="font-bold text-gray-900 dark:text-gray-100 text-base mb-1">{address.location}</p>
                                        <p className="text-gray-600 dark:text-gray-400">{address.city}, {address.state} {address.pincode}</p>
                                        <p className="text-gray-600 dark:text-gray-400 mt-1">{address.phone}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    ) : (
                        <div className="text-sm p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-xl border border-yellow-200 dark:border-yellow-900/50">
                            No addresses found. <a href="/user/address" className="font-bold underline hover:text-yellow-900 dark:hover:text-yellow-100">Add an address</a> to continue.
                        </div>
                    )}
                </div>

                <div className="grid gap-4 mb-8">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Payment Method</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className={`flex flex-col items-center justify-center p-4 border rounded-xl cursor-pointer transition-all text-sm text-center ${paymentMethod === 'online' ? 'border-primary/50 bg-primary/5 dark:bg-primary/10 ring-1 ring-primary/50 shadow-sm' : 'hover:border-gray-300 bg-gray-50/50 dark:bg-gray-800/30'}`}>
                            <input 
                                type="radio" 
                                name="paymentMethod" 
                                value="online"
                                className="sr-only" 
                                checked={paymentMethod === "online"} 
                                onChange={() => setPaymentMethod("online")} 
                            />
                            <span className="font-bold text-gray-900 dark:text-white">Online Pay</span>
                            <span className="text-xs text-gray-500 mt-1">(Cashfree)</span>
                        </label>
                        <label className={`flex flex-col items-center justify-center p-4 border rounded-xl cursor-pointer transition-all text-sm text-center ${paymentMethod === 'cod' ? 'border-primary/50 bg-primary/5 dark:bg-primary/10 ring-1 ring-primary/50 shadow-sm' : 'hover:border-gray-300 bg-gray-50/50 dark:bg-gray-800/30'}`}>
                            <input 
                                type="radio" 
                                name="paymentMethod" 
                                value="cod"
                                className="sr-only" 
                                checked={paymentMethod === "cod"} 
                                onChange={() => setPaymentMethod("cod")} 
                            />
                            <span className="font-bold text-gray-900 dark:text-white">Cash on Delivery</span>
                            <span className="text-xs text-gray-500 mt-1">(Pay at door)</span>
                        </label>
                    </div>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
                    <div className="flex justify-between items-center mb-6 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl">
                        <span className="font-bold text-gray-900 dark:text-gray-100">Total Amount ({qty} items)</span>
                        <span className="text-2xl font-black text-primary dark:text-primary/80">₹{product.finalPrice * qty}</span>
                    </div>
                    <button
                        onClick={handlePlaceOrder}
                        disabled={isProcessingOrder || addresses.length === 0}
                        className="w-full py-4 bg-primary text-white font-bold text-lg rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 disabled:shadow-none cursor-pointer disabled:cursor-not-allowed active:scale-[0.98] transition-all flex justify-center items-center gap-2"
                    >
                        {isProcessingOrder ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                Processing...
                            </>
                        ) : paymentMethod === "online" ? "Pay Securely" : "Confirm Order"}
                    </button>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="bg-card rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
                Product Details
              </h2>
              <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 leading-relaxed">
                {product.description ? (
                  <div
                    dangerouslySetInnerHTML={{
                      __html: /<[^>]+>/.test(product.description)
                        ? product.description
                        : (product.description as string).replace(/\n/g, '<br/>')
                    }}
                  />
                ) : (
                  <p className="italic text-gray-400">No further details available for this product.</p>
                )}
              </div>
            </div>
            
          </div>
        </div>

        {/* You May Also Like */}
        {relatedProducts?.length > 0 && (
          <div className="mt-16 md:mt-24">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">You may also like</h2>
            </div>
            <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'>
                {relatedProducts.map(({ $id, slug: relatedSlug, productName, images, price, finalPrice }) => {
                  const likedList = userData?.likedProducts || [];
                  const isLikedRelated = likedList.includes($id);
                  const relatedDiscount = price > finalPrice ? Math.round(((price - finalPrice) / price) * 100) : 0;

                  return (
                    <div
                      key={$id}
                      onClick={() => router.push(`/shop/product/${relatedSlug}`)}
                      className='group flex flex-col p-3 border rounded-2xl shadow-sm bg-card hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden'
                    >
                      <div className='relative aspect-square rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-800/50 mb-3'>
                          <img
                            src={images?.[0]}
                            alt={productName}
                            className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-500'
                          />
                          
                          {relatedDiscount > 0 && (
                              <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg z-10 shadow-sm">
                                  {relatedDiscount}% OFF
                              </div>
                          )}

                          {/* Quick action buttons */}
                          <div className='absolute top-2 right-2 flex flex-col gap-2 z-10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:-translate-y-2 sm:group-hover:translate-y-0 transition-all duration-200'>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleLikedRelated({ $id, productName, images, price, finalPrice, slug: relatedSlug });
                              }}
                              className={`p-2 rounded-full shadow-md transition-all active:scale-95 ${isLikedRelated ? 'bg-red-50 hover:bg-red-100 text-red-500 dark:bg-red-950/30' : 'bg-white/90 hover:bg-white text-gray-600 dark:bg-gray-800/90 dark:text-gray-300'}`}
                              aria-label={isLikedRelated ? 'Remove from wishlist' : 'Add to wishlist'}
                            >
                              <IconHeart size={18} className={isLikedRelated ? 'fill-red-500' : ''} />
                            </button>
                          </div>

                          {/* Quick Add to Cart Overlay */}
                          <div className="absolute bottom-0 left-0 right-0 p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300 opacity-0 group-hover:opacity-100 hidden sm:block">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    addToCartRelated({ $id, productName, images, price, finalPrice, slug: relatedSlug });
                                }}
                                className="w-full bg-primary/90 hover:bg-primary backdrop-blur-sm text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all"
                            >
                                <IconShoppingCart size={18} />
                                <span className="text-sm">Add to Cart</span>
                            </button>
                          </div>
                      </div>
                      
                      <div className="flex flex-col flex-1">
                        <h3 className='font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 text-sm leading-tight group-hover:text-primary transition-colors mb-2'>{productName}</h3>
                        <div className="mt-auto flex items-end justify-between">
                            <div className="flex flex-col">
                                <span className="font-bold text-lg text-gray-900 dark:text-gray-100 leading-none">₹{finalPrice}</span>
                                {price > finalPrice && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400 line-through mt-1">₹{price}</span>
                                )}
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    addToCartRelated({ $id, productName, images, price, finalPrice, slug: relatedSlug });
                                }}
                                className='sm:hidden p-2 bg-primary/10 text-primary dark:bg-primary/30 dark:text-primary/80 rounded-full active:scale-95'
                            >
                                <IconShoppingCart size={18} />
                            </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
