// @ts-nocheck
"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/set-state-in-effect */

import { IconChevronDown, IconChevronUp, IconMenu2, IconX, IconHeart, IconShoppingCart, IconSearch, IconCategory, IconPackageOff } from '@tabler/icons-react'
import axios from "@/lib/axios";
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect, useState, use, Suspense } from 'react'
import { toast } from 'react-toastify'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/store/Auth'
import { useDataStore } from '@/store/Data'
import { useLocalStore } from '@/store/LocalStore'

export const dynamic = 'force-dynamic'

// SKELETON for Products
const ProductsSkeleton = () => (
    <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'>
        {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className='flex flex-col gap-3 p-3 border rounded-2xl bg-card shadow-sm'>
                <Skeleton className="aspect-square rounded-xl w-full" />
                <div className="space-y-2 mt-2">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                </div>
                <div className="mt-auto pt-2 flex justify-between items-center">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                </div>
            </div>
        ))}
    </div>
);

// SKELETON for Categories
const CategoriesSkeleton = () => (
    <div className='pb-2 space-y-3 mt-4'>
        {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className='flex items-center gap-3 p-2'>
                <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
                <div className='flex-1 space-y-2'>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                </div>
            </div>
        ))}
    </div> 
);


// Product List Component
function ProductList({ productsPromise, productSearch, router, userData, user, onAddToCart, onToggleLiked }: { productsPromise: Promise<any>, productSearch: string, router: any, userData: any, user: any, onAddToCart: (product: any) => void, onToggleLiked: (product: any) => void }) {
    const { localLiked } = useLocalStore();
    const productsData = use(productsPromise);
    const products = productsData.data;

    const filteredProducts = (products.documents || products.rows || [])?.filter((p: any) =>
      p.productName.toLowerCase().includes(productSearch.toLowerCase())
    ) || [];

    if (filteredProducts.length === 0) {
      return (
        <div className='flex flex-col items-center justify-center py-20 bg-card border rounded-2xl shadow-sm px-4 mt-4'>
            <div className="mb-6 inline-flex items-center justify-center w-24 h-24 rounded-full bg-gray-50 dark:bg-gray-800/50">
                <IconPackageOff size={48} className="text-gray-400" stroke={1.5} />
            </div>
            <h2 className='text-2xl font-bold mb-3 text-gray-900 dark:text-gray-100'>No products found</h2>
            <p className='text-gray-500 mb-8 text-center max-w-md'>We couldn&apos;t find anything matching &quot;{productSearch}&quot;. Try adjusting your search or filters.</p>
        </div>
      );
    }

    return (
        <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'>
        {
          filteredProducts?.map(({$id, slug, productName, images, price, finalPrice}: any)=>{
            const product = { $id, slug, productName, images, price, finalPrice };
            const likedList = user ? (userData?.likedProducts || []) : localLiked;
            const isLiked = likedList.includes($id);
            const discount = price > finalPrice ? Math.round(((price - finalPrice) / price) * 100) : 0;

            return(
              <div key={$id}
               onClick={()=> router.push(`/shop/product/${slug}`)}
               className='group flex flex-col p-3 border rounded-2xl shadow-sm bg-card hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden'>
                
                <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-800/50 mb-3">
                    <img src={images[0]} alt={productName} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                    
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
                            onToggleLiked(product);
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
                                onAddToCart(product);
                            }}
                            className="w-full bg-primary/90 hover:bg-primary backdrop-blur-sm text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all"
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
                            onAddToCart(product);
                        }}
                        className='sm:hidden p-2 bg-primary/10 text-primary dark:bg-primary/30 dark:text-primary/80 rounded-full active:scale-95'
                    >
                        <IconShoppingCart size={18} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        }
      </div>
    );
}

// Category List Component
function CategoryList({
    categoriesData,
    categorySearch,
    activeCatOrSubcatId,
    activeCategoryId,
    activeCategoryList,
    setActiveCategoryList,
    subcategoriesData,
    getSubcategories,
    getProductsBySubcategory,
    onCategorySelect
}: {
    categoriesData: any,
    categorySearch: string,
    activeCatOrSubcatId: string,
    activeCategoryId: string,
    activeCategoryList: boolean,
    setActiveCategoryList: React.Dispatch<React.SetStateAction<boolean>>,
    subcategoriesData: any[],
    getSubcategories: (id: string, subcategory: string[], categoryName: string) => void,
    getProductsBySubcategory: (subcategoryName: string, id: string) => void,
    onCategorySelect?: () => void
}) {
    const categories = categoriesData.data;
    
    const [categoryCurrentPage, setCategoryCurrentPage] = useState(1);
    const categoryPageSize = 8;

    useEffect(() => {
        setCategoryCurrentPage(1);
    }, [categorySearch]);

    const filteredCategories = categories.rows?.filter((cat: any) =>
        cat.categoryName.toLowerCase().includes(categorySearch.toLowerCase())
    ) || [];

    const categoryTotalPages = Math.max(1, Math.ceil(filteredCategories.length / categoryPageSize));

    const paginatedCategories = filteredCategories.slice(
        (categoryCurrentPage - 1) * categoryPageSize,
        categoryCurrentPage * categoryPageSize
    );

    return (
        <>
            <div className='py-2'>
              {filteredCategories.length === 0 ? (
                <div className='text-center py-8 px-4'>
                    <IconCategory className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                    <p className='text-gray-500 text-sm'>No categories found</p>
                </div>
              ) : (
                <div className="space-y-1">
                    {paginatedCategories.map(({ categoryName, $id, subcategory, categoryImage }: any) => {
                    const isActive = activeCatOrSubcatId === $id || activeCategoryId === $id;
                    const isExpanded = activeCategoryList && activeCategoryId === $id;
                    
                    return(
                        <div key={$id} className='flex flex-col'>
                        <div className={`group flex flex-row justify-between items-center rounded-xl transition-all duration-200 border border-transparent ${isActive ? "bg-primary/5 border-primary/10 dark:bg-primary/10 dark:border-primary/30" : "hover:bg-gray-50 dark:hover:bg-gray-800/50"}`}>
                            <div
                            onClick={() => {
                                getSubcategories($id, subcategory, categoryName);
                                if (onCategorySelect && subcategory.length === 0) onCategorySelect();
                            }}
                            className={`flex p-2 gap-3 items-center cursor-pointer flex-1 rounded-xl`}>
                            <div className='h-12 w-12 overflow-hidden rounded-xl shrink-0 bg-white shadow-sm border border-gray-100 dark:border-gray-800 dark:bg-gray-900'>
                                <img src={categoryImage} alt={categoryName} className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-300"/>
                            </div>
                            <div className={`font-semibold text-sm truncate ${isActive ? 'text-primary/90 dark:text-primary/80' : 'text-gray-700 dark:text-gray-300'}`}>{categoryName}</div>
                            </div>
                            
                            {subcategory && subcategory.length > 0 && (
                                <button
                                    className={`p-2 mr-1 rounded-lg transition-colors ${isExpanded ? 'text-primary bg-primary/20/50 dark:text-primary/80 dark:bg-primary/30' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (!isActive) {
                                            getSubcategories($id, subcategory, categoryName);
                                        } else {
                                            setActiveCategoryList(prev => !prev);
                                        }
                                    }}
                                >
                                    {isExpanded ? <IconChevronUp size={20} stroke={2.5}/> : <IconChevronDown size={20} stroke={2.5}/>}
                                </button>
                            )}
                        </div>

                        {/* Subcategories */}
                        <div className={`grid transition-all duration-300 ease-in-out ${isExpanded && subcategoriesData?.length > 0 ? 'grid-rows-[1fr] opacity-100 mt-1 mb-2' : 'grid-rows-[0fr] opacity-0'}`}>
                            <div className="overflow-hidden">
                                <div className='ml-12 pl-4 border-l-2 border-gray-100 dark:border-gray-800 space-y-1 py-1'>
                                {subcategoriesData?.map(({subcategoryName, $id: subId, subcategoryImage}: any) => {
                                    const isSubActive = activeCatOrSubcatId === subId;
                                    return (
                                    <div
                                        onClick={() => {
                                            getProductsBySubcategory(subcategoryName, subId);
                                            if (onCategorySelect) onCategorySelect();
                                        }}
                                        key={subId}
                                        className={`flex gap-3 p-2 rounded-xl cursor-pointer transition-all ${isSubActive ? "bg-primary/10 text-primary/90 dark:bg-primary/20 dark:text-primary/80 font-medium" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"}`}>
                                        <div className='h-8 w-8 overflow-hidden rounded-lg shrink-0 border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900'>
                                            <img src={subcategoryImage} alt={subcategoryName} className="object-cover w-full h-full"/>
                                        </div>
                                        <div className='text-sm truncate self-center'>{subcategoryName}</div>
                                    </div>
                                    );
                                })}
                                </div>
                            </div>
                        </div>
                        </div>
                    )
                    })}
                </div>
              )}
            </div>
            {filteredCategories.length > categoryPageSize && (
              <div className='flex items-center justify-between pt-4 border-t mt-2'>
                <button
                  disabled={categoryCurrentPage === 1}
                  onClick={() => setCategoryCurrentPage(p => Math.max(1, p - 1))}
                  className='px-3 py-1.5 text-xs font-medium border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors shadow-sm'
                >
                  Previous
                </button>
                <span className='text-xs font-medium text-gray-500 bg-gray-50 dark:bg-gray-800/50 px-3 py-1.5 rounded-lg'>
                    {categoryCurrentPage} / {categoryTotalPages}
                </span>
                <button
                  disabled={categoryCurrentPage === categoryTotalPages}
                  onClick={() => setCategoryCurrentPage(p => Math.min(categoryTotalPages, p + 1))}
                  className='px-3 py-1.5 text-xs font-medium border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors shadow-sm'
                >
                  Next
                </button>
              </div>
            )}
        </>
    )
}

// Shop Content Component
function ShopContent() {
  const { user } = useAuthStore();
  const { userData, setUserData } = useDataStore();
  const { addToLocalCart, toggleLocalLiked } = useLocalStore();

  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');

  const [categories, setCategories] = useState<any>({data: {rows: []}});
  const [productsPromise, setProductsPromise] = useState<any>(null);
  
  const [subcategoriesData, setSubcategoriesData] = useState<any[]>([]);
  const [activeCategoryList, setActiveCategoryList] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState("");
  const [activeCatOrSubcatId, setActiveCatOrSubcatId] = useState("");
  
  const [categorySearch, setCategorySearch] = useState("");
  const [productSearch, setProductSearch] = useState("");

  const [isCategoryBarOpen, setIsCategoryBarOpen] = useState(false)
  const [initialCategory, setInitialCategory] = useState<string>('');

  const router = useRouter();
 
  useEffect(()=>{
      const categoryParam = searchParams.get('category');
      if (categoryParam) {
        setInitialCategory(categoryParam);
        setProductsPromise(axios.get<any>("/api/company/product/get_by_category", {params: {categoryName: categoryParam}}));
      } else {
        setProductsPromise(axios.get<any>("/api/company/product"));
      }
      axios.get<any>("/api/company/product/category").then(res => setCategories({data: res.data.data || res.data}));
  },[])

  useEffect(() => {
    if (initialCategory && categories.data.rows.length > 0) {
      const category = categories.data.rows.find((cat: any) => cat.categoryName === initialCategory);
      if (category) {
        getSubcategories(category.$id, category.subcategory, category.categoryName);
      }
      setInitialCategory(''); // prevent re-run
    }
  }, [initialCategory, categories]);

  const getSubcategories = (id: string, subcategory: string[], categoryName: string)=>{
    axios.post<any>("/api/company/product/category", {subcategory})
      .then(res=> {
        setSubcategoriesData(res.data);
        setActiveCategoryList(true);
        setActiveCategoryId(id);
        setActiveCatOrSubcatId(id);
      })
      .catch(err=>{
        console.log(err);
        toast.error("Failed to get subcategories");
      });
    setProductsPromise(axios.get<any>("/api/company/product/get_by_category", {params: {categoryName}}));
  }

  const getProductsBySubcategory = (subcategoryName: string, id: string)=>{
    const formData = new FormData();
    formData.append("subcategoryName", subcategoryName);

    setProductsPromise(axios.post<any>("/api/company/product/get_by_category", formData));
    setActiveCatOrSubcatId(id);
  }

  const addToCart = async (product: any) => {
    if (!user) {
      addToLocalCart({
        productID: product.$id,
        productName: product.productName,
        slug: product.slug,
        qty: 1,
        price: product.finalPrice,
        images: product.images
      });
      toast.success("Added to cart!");
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
    if (!user) {
      toggleLocalLiked(product.$id);
      toast.success("Wishlist updated!");
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

  return (
    <div className='flex w-full xl:px-16 lg:px-8 md:px-6 px-4 max-w-screen-2xl mx-auto'>
      {/* Mobile Category Sidebar Overlay */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ${isCategoryBarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsCategoryBarOpen(false)}
      />

      {/* Mobile Category Sidebar */}
      <div className={`fixed top-0 left-0 h-full w-70 bg-card shadow-2xl z-50 transform transition-transform duration-300 ease-out md:hidden flex flex-col ${isCategoryBarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className='p-4 border-b flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/20'>
            <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/20 text-primary rounded-lg dark:bg-primary/30 dark:text-primary/80">
                    <IconCategory size={20} />
                </div>
                <p className='font-bold text-lg'>Categories</p>
            </div>
            <button 
                onClick={() => setIsCategoryBarOpen(false)} 
                className='p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors'
            >
                <IconX size={20} className='text-gray-500' />
            </button>
        </div>
        
        <div className='p-4 flex-1 overflow-y-auto custom-scrollbar'>
            <div className='relative mb-4'>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <IconSearch size={16} className="text-gray-400" />
                </div>
                <input
                    type='text'
                    placeholder='Find category...'
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    className='w-full pl-10 pr-4 py-2.5 border rounded-xl bg-gray-50 hover:bg-white focus:bg-white dark:bg-gray-800/50 dark:border-gray-700 dark:focus:bg-gray-800 transition-colors text-sm focus:ring-2 focus:ring-primary/50/20 focus:border-primary/50 outline-none'
                />
            </div>

            {categories.data.rows.length > 0 ? (
                <Suspense fallback={<CategoriesSkeleton />}>
                    <CategoryList 
                        categoriesData={categories}
                        categorySearch={categorySearch}
                        activeCatOrSubcatId={activeCatOrSubcatId}
                        activeCategoryId={activeCategoryId}
                        activeCategoryList={activeCategoryList}
                        setActiveCategoryList={setActiveCategoryList}
                        subcategoriesData={subcategoriesData}
                        getSubcategories={getSubcategories}
                        getProductsBySubcategory={getProductsBySubcategory}
                        onCategorySelect={() => setIsCategoryBarOpen(false)}
                    />
                </Suspense>
            ) : (
                <CategoriesSkeleton />
            )}
        </div>        
      </div>

      {/* Desktop Sidebar */}
      <div className='hidden md:block shrink-0 pt-6 pb-12 w-64 lg:w-72 mr-8'>
        <div className='bg-card p-5 shadow-sm border rounded-2xl sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar'>
          <div className='mb-6'>
            <div className="flex items-center gap-2 mb-4 pb-4 border-b">
                <div className="p-2 bg-primary/10 text-primary rounded-lg dark:bg-primary/20 dark:text-primary/80">
                    <IconCategory size={20} />
                </div>
                <h2 className='font-bold text-xl text-gray-900 dark:text-white tracking-tight'>Categories</h2>
            </div>
            
            <div className='relative'>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <IconSearch size={16} className="text-gray-400" />
                </div>
                <input
                    type='text'
                    placeholder='Search categories...'
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    className='w-full pl-10 pr-4 py-2.5 border rounded-xl bg-gray-50 hover:bg-white focus:bg-white dark:bg-gray-800/50 dark:border-gray-700 dark:focus:bg-gray-800 transition-colors text-sm focus:ring-2 focus:ring-primary/50/20 focus:border-primary/50 outline-none'
                />
            </div>
          </div>

          {categories.data.rows.length > 0 ? (
              <Suspense fallback={<CategoriesSkeleton />}>
                  <CategoryList 
                      categoriesData={categories}
                      categorySearch={categorySearch}
                      activeCatOrSubcatId={activeCatOrSubcatId}
                      activeCategoryId={activeCategoryId}
                      activeCategoryList={activeCategoryList}
                      setActiveCategoryList={setActiveCategoryList}
                      subcategoriesData={subcategoriesData}
                      getSubcategories={getSubcategories}
                      getProductsBySubcategory={getProductsBySubcategory}
                  />
              </Suspense>
          ) : (
              <CategoriesSkeleton />
          )}
        </div>
      </div>  

      {/* Main Content Area */}
      <div className='flex-1 flex flex-col pt-6 pb-12 min-w-0'>
        {/* Header & Search */}
        <div className='mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <div className="flex items-center gap-3">
            <button 
                onClick={()=> setIsCategoryBarOpen(true)} 
                className='md:hidden p-2.5 bg-card border rounded-xl shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors'
            >
                <IconMenu2 size={22} className="text-gray-700 dark:text-gray-300" />
            </button>
            <div>
                <h1 className='text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight'>All Products</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Discover our latest collection</p>
            </div>
          </div>
          
          <div className='relative w-full sm:w-72 md:w-80 lg:w-96 shrink-0'>
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <IconSearch size={18} className="text-gray-400" />
            </div>
            <input
              type='text'
              placeholder='Search products...'
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className='w-full pl-10 pr-4 py-3 border rounded-xl bg-card shadow-sm hover:shadow-md focus:shadow-md focus:ring-2 focus:ring-primary/50/20 focus:border-primary/50 outline-none transition-all dark:bg-gray-800 dark:border-gray-700'
            />
          </div>  
        </div>

        {/* Product Grid */}
        <div className="flex-1">
            {productsPromise ? (
                <Suspense fallback={<ProductsSkeleton />}>
                    <ProductList productsPromise={productsPromise} productSearch={productSearch} router={router} userData={userData} user={user} onAddToCart={addToCart} onToggleLiked={toggleLiked} />
                </Suspense>
            ) : (
                <ProductsSkeleton />
            )}
        </div>
      </div>   
    </div>
  )
}

// Main Shop Component
export default function Shop() {
  return (
    <Suspense fallback={<div className="w-full h-full flex justify-center items-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
      <ShopContent />
    </Suspense>
  )
}
