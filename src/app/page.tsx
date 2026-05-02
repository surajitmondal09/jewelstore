// @ts-nocheck
"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import React, { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '@/components/Footer'
import { IconArrowRight, IconTruck, IconClock, IconShieldCheck, IconLeaf, IconChevronLeft, IconChevronRight, IconHeart, IconShoppingCart, IconStar, IconQuote, IconMessageCircle } from '@tabler/icons-react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import axios from "@/lib/axios";
import { toast } from 'react-toastify'
import { useAuthStore } from '@/store/Auth'
import { useDataStore } from '@/store/Data'
import { Skeleton } from '@/components/ui/skeleton'

const CarouselSkeleton = () => (
  <div className='relative w-full h-[20vh] sm:h-[30vh] md:h-[40vh] lg:h-[50vh] xl:h-[65vh] bg-gray-100 dark:bg-gray-800 animate-pulse'>
  </div>
);

const CategorySkeleton = () => (
  <div className='flex overflow-hidden gap-4 pb-4 mt-2'>
    {[...Array(6)].map((_, i) => (
      <div key={i} className='shrink-0 w-24 sm:w-28 md:w-32 lg:w-40 flex flex-col items-center gap-3 p-2'>
        <Skeleton className='w-full aspect-square rounded-full' />
        <Skeleton className='h-4 w-3/4' />
      </div>
    ))}
  </div>
);

const ProductGridSkeleton = () => (
  <div className='py-8 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 max-w-screen-2xl mx-auto'>
    <div className="flex justify-between items-center mb-6">
        <Skeleton className='h-8 w-48' />
        <Skeleton className='h-6 w-24' />
    </div>
    <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'>
      {[...Array(6)].map((_, i) => (
      <div key={i} className='flex flex-col gap-3 p-3 border rounded-2xl bg-card shadow-sm'>
        <Skeleton className='aspect-square rounded-xl w-full' />
        <div className="space-y-2 mt-2">
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
);

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

export default function Page() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { userData, setUserData } = useDataStore()
  const [sliders, setSliders] = useState({ rows: [] })
  const [slidersLoading, setSlidersLoading] = useState(true);
  const [products, setProducts] = useState({ rows: [] })
  const [productsLoading, setProductsLoading] = useState(true);
  const [categories, setCategories] = useState({ rows: [] })
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0)
  const [autoSlide, setAutoSlide] = useState(true)
  const [featuredProductSections, setFeaturedProductSections] = useState<{ $id: string; title: string; productIds: string[] }[]>([]);
  const [featuredProductSectionsLoading, setFeaturedProductSectionsLoading] = useState(true);

  // Swipe handling states
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50
    if (isLeftSwipe) {
      nextSlide()
    }
    if (isRightSwipe) {
      prevSlide()
    }
    // reset
    setTouchStart(0)
    setTouchEnd(0)
  }

  const featuredCategories = categories?.rows?.slice(0, 8) || []

  const retry = async (fn: () => Promise<any>, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(res => setTimeout(res, delay * (i + 1))); // increasing delay
      }
    }
  };

  const getSliders = async () => {
    setSlidersLoading(true);
    try {
      const response = await retry(() => axios.get<any>("/api/company/slider"));
      setSliders(response.data.sliders || { rows: [] })
    } catch (error) {
      console.error("Failed to fetch sliders", error)
    } finally {
      setSlidersLoading(false);
    }
  }

  const nextSlide = () => {
    const len = Math.max(sliders?.rows?.length || 1, 1)
    setCurrentSlide((prev) => (prev + 1) % len)
    setAutoSlide(false)
  }

  const prevSlide = () => {
    const len = Math.max(sliders?.rows?.length || 1, 1)
    setCurrentSlide((prev) => (prev - 1 + len) % len)
    setAutoSlide(false)
  }

  const getProducts = async () => {
    setProductsLoading(true);
    try {
      const response = await retry(() => axios.get<any>("/api/company/product"));
      setProducts(response.data || { rows: [] })
    } catch (err) {
      console.log(err)
      toast.error("Failed to load products")
    } finally {
      setProductsLoading(false);
    }
  }

  const getCategories = async () => {
    setCategoriesLoading(true);
    try {
      const response = await retry(() => axios.get<any>("/api/company/product/category"));
      setCategories(response.data || { rows: [] })
    } catch (err) {
      console.log(err)
      toast.error("Failed to load categories")
    } finally {
      setCategoriesLoading(false);
    }
  }

  const getFeaturedProductSections = async () => {
    setFeaturedProductSectionsLoading(true);
    try {
      const response = await retry(() => axios.get<any>("/api/company/featured-product"));
      setFeaturedProductSections(response.data.products || []);
    } catch (err) {
      console.log(err);
      toast.error("Failed to fetch featured products");
    } finally {
      setFeaturedProductSectionsLoading(false);
    }
  };

  const addToCart = async (product: any) => {
    if (!user || !userData) {
      toast.error("Please login to add items to cart");
      return;
    }
    
    try {
      const response = await axios.post<any>("/api/user/cart/add", {
        customerID: userData.$id,
        productID: product.$id,
        productName: product.productName,
        slug: product.slug,
        qty: 1,
        price: product.finalPrice
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

  const toggleLiked = async (product: any) => {
    if (!user || !userData) {
      toast.error("Please login to add to wishlist");
      return;
    }

    const likedList = userData.likedProducts || [];
    const isLiked = likedList.includes(product.$id);

    try {
      if (isLiked) {
        await axios.post<any>("/api/company/product/remove-from-liked", {
          userID: userData.$id,
          productID: product.$id
        });
        toast.success("Removed from wishlist");
      } else {
        await axios.post<any>("/api/company/product/add-to-liked", {
          userID: userData.$id,
          productID: product.$id
        });
        toast.success("Added to wishlist!");
      }
      
      setUserData(user.$id);
    } catch (error) {
      console.error("Failed to update wishlist", error);
      toast.error("Failed to update wishlist");
    }
  };

  useEffect(() => {
    getCategories()
    getProducts()
    getSliders()
    getFeaturedProductSections()
  }, [])

  useEffect(() => {
    if (!autoSlide) return
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % Math.max(sliders?.rows?.length || 1, 1))
    }, 5000)
    return () => clearInterval(interval)
  }, [autoSlide, sliders?.rows?.length])

  return (
    <div className='w-full'>
      <Navbar />

      {/* Main Content */}
      <main className="min-h-screen">
        
        {/* Carousel Section */}
        {slidersLoading ? <CarouselSkeleton /> : (
            <motion.section 
              initial={{opacity: 0}} animate={{opacity: 1}} transition={{duration: 0.8}}
              className='relative w-full h-[20vh] sm:h-[30vh] md:h-[40vh] lg:h-[50vh] xl:h-[65vh] flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-black'>
            <div 
              className='relative w-full h-full group touch-pan-y'
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
                {sliders?.rows?.length > 0 && (
                <>
                    {sliders.rows.map((slide: any, index: number) => {
                    const src = slide?.sliderImage || slide
                    const key = slide?.$id ?? index
                    return (
                        <div
                        key={key}
                        className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                        >
                        <img
                            src={src}
                            alt={`slider-${index}`}
                            className='w-full h-full object-cover'
                            loading={index === 0 ? "eager" : "lazy"}
                        />
                        {/* Optional subtle gradient overlay for text readability if needed */}
                        <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent pointer-events-none"></div>
                        </div>
                    )
                    })}

                    <button
                    onClick={prevSlide}
                    className='absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 bg-white/50 hover:bg-white/80 backdrop-blur-sm text-gray-800 p-2 md:p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 active:scale-95'
                    aria-label="Previous slide"
                    >
                    <IconChevronLeft size={24} />
                    </button>
                    <button
                    onClick={nextSlide}
                    className='absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 bg-white/50 hover:bg-white/80 backdrop-blur-sm text-gray-800 p-2 md:p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 active:scale-95'
                    aria-label="Next slide"
                    >
                    <IconChevronRight size={24} />
                    </button>

                    <div className='absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2 md:gap-3 bg-black/20 px-3 py-2 rounded-full backdrop-blur-sm'>
                    {sliders.rows.map((_, index) => (
                        <button
                        key={index}
                        onClick={() => {
                            setCurrentSlide(index)
                            setAutoSlide(false)
                        }}
                        className={`transition-all duration-300 rounded-full ${index === currentSlide ? 'w-6 md:w-8 bg-white h-2 md:h-2.5' : 'w-2 md:w-2.5 bg-white/50 hover:bg-white/80 h-2 md:h-2.5'}`}
                        aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                    </div>
                </>
                )}
            </div>
            </motion.section>
        )}

        <div className="max-w-screen-2xl mx-auto">
            {/* Quick Categories */}
            <motion.section 
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeInUp}
              className='py-10 md:py-14 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16'>
                <div className="flex justify-between items-end mb-6">
                    <h2 className='text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white'>Shop by Category</h2>
                </div>
                
                {categoriesLoading ? <CategorySkeleton /> : (
                    <div className='flex overflow-x-auto custom-scrollbar gap-4 md:gap-6 pb-6 pt-2 snap-x'>
                    {featuredCategories.map(({ $id, categoryName, categoryImage }) => (
                        <div
                        key={$id}
                        onClick={() => router.push(`/shop?category=${encodeURIComponent(categoryName)}`)}
                        className='shrink-0 snap-start group w-24 sm:w-28 md:w-32 lg:w-40 flex flex-col items-center cursor-pointer'
                        >
                            <div className='w-full aspect-square mb-3 md:mb-4 rounded-full shadow-sm group-hover:shadow-xl border-4 border-transparent group-hover:border-primary/20 dark:group-hover:border-primary/30 overflow-hidden bg-gray-50 dark:bg-gray-800 transition-all duration-300'>
                                <img
                                src={categoryImage}
                                alt={categoryName}
                                className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-500'
                                />
                            </div>
                            <p className='font-semibold text-sm md:text-base text-gray-800 dark:text-gray-200 text-center group-hover:text-primary transition-colors'>{categoryName}</p>
                        </div>
                    ))}
                    </div>
                )}
            </motion.section>

            {/* Recommended Products */}
            {featuredProductSectionsLoading || productsLoading ? (
                <ProductGridSkeleton /> 
            ) : featuredProductSections.map((section) => {
                const sectionProducts = products?.rows?.filter((p: { $id: string }) => section.productIds.includes(p.$id)) || [];
                if (sectionProducts.length === 0) return null;

                return (
                <motion.section 
                  initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeInUp}
                  key={section.$id} className='py-8 md:py-12 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 border-t border-gray-100 dark:border-gray-800/50'>
                    <div className='flex justify-between items-end mb-8'>
                        <div>
                            <h2 className='text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white'>{section.title}</h2>
                        </div>
                        <button
                            onClick={() => router.push('/shop')}
                            className='group flex items-center gap-2 text-sm md:text-base font-semibold text-primary hover:text-primary/80 transition-colors'
                        >
                            View All <IconArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'>
                    {sectionProducts.map(({ $id, productName, images, price, finalPrice, slug }) => {
                        const likedList = userData?.likedProducts || [];
                        const isLiked = likedList.includes($id);
                        const product = { $id, productName, images, price, finalPrice, slug };
                        const discount = price > finalPrice ? Math.round(((price - finalPrice) / price) * 100) : 0;
                        
                        return (
                            <div
                                key={$id}
                                onClick={() => router.push(`/shop/product/${slug}`)}
                                className='group flex flex-col p-3 border rounded-2xl shadow-sm bg-card hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden'
                            >
                                <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-800/50 mb-3">
                                    <img src={images?.[0]} alt={productName} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                                    
                                    {discount > 0 && (
                                        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg z-10 shadow-sm">
                                            {discount}% OFF
                                        </div>
                                    )}

                                    {/* Quick action buttons */}
                                    <div className='absolute top-2 right-2 flex flex-col gap-2 z-10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:-translate-y-2 sm:group-hover:translate-y-0 transition-all duration-200'>
                                        <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleLiked(product);
                                        }}
                                        className={`p-2 rounded-full shadow-md transition-all active:scale-95 ${isLiked ? 'bg-red-50 hover:bg-red-100 text-red-500 dark:bg-red-950/30' : 'bg-white/90 hover:bg-white text-gray-600 dark:bg-gray-800/90 dark:text-gray-300'}`}
                                        aria-label={isLiked ? 'Remove from wishlist' : 'Add to wishlist'}
                                        >
                                            <IconHeart size={18} className={isLiked ? 'fill-red-500' : ''} />
                                        </button>
                                    </div>

                                    {/* Quick Add to Cart Overlay */}
                                    <div className="absolute bottom-0 left-0 right-0 p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300 opacity-0 group-hover:opacity-100">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                addToCart(product);
                                            }}
                                            className="w-full bg-primary/90 hover:bg-primary backdrop-blur-sm text-primary-foreground font-medium py-2 rounded-lg flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all"
                                        >
                                            <IconShoppingCart size={18} />
                                            <span className="text-sm">Add to Cart</span>
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col flex-1">
                                    <h3 className='font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 text-sm leading-tight group-hover:text-primary transition-colors mb-2'>
                                        {productName}
                                    </h3>
                                    
                                    <div className='mt-auto flex items-end justify-between'>
                                        <div className='flex flex-col'>
                                            <span className='font-bold text-lg text-gray-900 dark:text-gray-100 leading-none'>₹{finalPrice}</span>
                                            {price > finalPrice && (
                                                <span className="text-xs text-gray-500 dark:text-gray-400 line-through mt-1">₹{price}</span>
                                            )}
                                        </div>
                                        {/* Mobile cart button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                addToCart(product);
                                            }}
                                            className='sm:hidden p-2 bg-primary/10 text-primary dark:bg-primary/20 rounded-full active:scale-95'
                                        >
                                            <IconShoppingCart size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    </div>
                </motion.section>
                );
            })}
        </div>

        {/* Non-logged in User Features */}
        {!user && (
            <div className="max-w-screen-2xl mx-auto space-y-16 py-16 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
                {/* Why Trust Us */}
                <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeInUp}>
                    <div className="text-center mb-10">
                        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">Why Choose JewelStore?</h2>
                        <p className="mt-4 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">We pride ourselves on delivering exceptional quality, certified authenticity, and a seamless shopping experience for every customer.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="flex flex-col items-center text-center p-6 bg-gray-50 dark:bg-gray-800/30 rounded-2xl">
                            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                                <IconShieldCheck size={32} />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Certified Authenticity</h3>
                            <p className="text-gray-600 dark:text-gray-400">Every piece comes with a certificate of authenticity guaranteeing the purity of materials.</p>
                        </div>
                        <div className="flex flex-col items-center text-center p-6 bg-gray-50 dark:bg-gray-800/30 rounded-2xl">
                            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                                <IconTruck size={32} />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Secure & Free Shipping</h3>
                            <p className="text-gray-600 dark:text-gray-400">Enjoy fully insured, fast, and free delivery on all orders, safely to your doorstep.</p>
                        </div>
                        <div className="flex flex-col items-center text-center p-6 bg-gray-50 dark:bg-gray-800/30 rounded-2xl">
                            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                                <IconLeaf size={32} />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Ethically Sourced</h3>
                            <p className="text-gray-600 dark:text-gray-400">Our diamonds and precious stones are 100% conflict-free and ethically sourced.</p>
                        </div>
                    </div>
                </motion.section>

                {/* User Testimonials */}
                <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeInUp}>
                    <div className="text-center mb-10">
                        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">What Our Customers Say</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { name: "Priya S.", review: "Absolutely stunning jewelry! The craftsmanship is incredible, and the customer service was extremely helpful in picking the perfect ring.", rating: 5 },
                            { name: "Rahul M.", review: "Bought a necklace for my wife's anniversary. She loved it. The delivery was fast and the packaging felt very premium.", rating: 5 },
                            { name: "Anjali K.", review: "I trust JewelStore for all my festive jewelry needs. The purity and designs are unmatched. Highly recommended!", rating: 4 },
                        ].map((testimonial, i) => (
                            <div key={i} className="p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative">
                                <IconQuote size={40} className="absolute top-4 right-4 text-gray-100 dark:text-gray-800" />
                                <div className="flex text-yellow-400 mb-4">
                                    {[...Array(5)].map((_, j) => (
                                        <IconStar key={j} size={18} fill={j < testimonial.rating ? "currentColor" : "none"} className={j >= testimonial.rating ? "text-gray-300" : ""} />
                                    ))}
                                </div>
                                <p className="text-gray-600 dark:text-gray-400 italic mb-4">"{testimonial.review}"</p>
                                <p className="font-bold text-gray-900 dark:text-white">- {testimonial.name}</p>
                            </div>
                        ))}
                    </div>
                </motion.section>

                {/* Quick Contact Section */}
                <motion.section 
                    initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeInUp}
                    className="bg-primary/5 dark:bg-primary/10 rounded-3xl p-8 md:p-12 text-center flex flex-col items-center">
                    <div className="w-20 h-20 bg-primary/20 text-primary rounded-full flex items-center justify-center mb-6">
                        <IconMessageCircle size={40} />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-4">Need Help Choosing?</h2>
                    <p className="text-gray-600 dark:text-gray-400 max-w-lg mb-8 text-lg">Our expert jewelry consultants are here to guide you to find the perfect piece for any occasion.</p>
                    <button
                        onClick={() => router.push('/contact')}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center gap-2"
                    >
                        Contact Us Today <IconArrowRight size={20} />
                    </button>
                </motion.section>
            </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
