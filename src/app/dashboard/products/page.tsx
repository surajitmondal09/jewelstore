// @ts-nocheck
"use client"

import axios from "@/lib/axios";
import React, { useState, useEffect } from 'react'
import { IconCaretDownFilled, IconPlus, IconEdit, IconX, IconSearch } from '@tabler/icons-react';
import { Input } from '@/components/ui/input';
import Image from 'next/image';  
import { Label } from '@/components/ui/label';
import { Uploder } from '@/components/Uploder';
import ClickAwayListener from 'react-click-away-listener';
import { toast } from 'react-toastify';
import { useSellerStore } from '@/store/Seller';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function products() {
  const [isProductsActive, setIsProductsActive] = useState(true);

  const [categories, setCategories] = useState({rows: [ {categoryName: "", $id: "", subcategory: [], categoryImage: ""} ]})
  const [subcategories, setSubcategories] = useState([])
  const [activeSubcategory, setActiveSubcategory] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("")
  const [addingCategory, setAddingCategory] = useState(false)
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [categoryName, setCategoryName] = useState("")
  const [categoryImage, setCategoryImage] = useState("")
  const [selectedCategoryFile, setSelectedCategoryFile] = useState<File | null>(null)
  const [categorySearch, setCategorySearch] = useState("")
  const [categoryCurrentPage, setCategoryCurrentPage] = useState(1)
  const categoryPageSize = 5
  const [addingSubcategory, setAddingSubcategory] = useState(false)
  const [editingSubcategory, setEditingSubcategory] = useState<string | null>(null)
  const [subcategoryName, setSubcategoryName] = useState("")
  const [subcategoryImage, setSubcategoryImage] = useState("")
  const [selectedSubcategoryFile, setSelectedSubcategoryFile] = useState<File | null>(null)
  const [subcategorySearch, setSubcategorySearch] = useState("")
  const [subcategoryCurrentPage, setSubcategoryCurrentPage] = useState(1)
  const subcategoryPageSize = 5

  // Filter and paginate categories
  const filteredCategories = categories?.rows?.filter((cat: any) => 
    cat.categoryName.toLowerCase().includes(categorySearch.toLowerCase())
  ) || []
  const categoryTotalPages = Math.max(1, Math.ceil(filteredCategories.length / categoryPageSize))
  const paginatedCategories = filteredCategories.slice(
    (categoryCurrentPage - 1) * categoryPageSize,
    categoryCurrentPage * categoryPageSize
  )

  // Reset category page when search changes
  useEffect(() => {
    setCategoryCurrentPage(1)
  }, [categorySearch])

  const resetCategoryForm = () => {
    setCategoryName("")
    setCategoryImage("")
    setSelectedCategoryFile(null)
    setAddingCategory(false)
    setEditingCategory(null)
  }

  // Filter and paginate subcategories
  const filteredSubcategories = subcategories?.filter((sub: any) =>
    sub.subcategoryName.toLowerCase().includes(subcategorySearch.toLowerCase())
  ) || []
  const subcategoryTotalPages = Math.max(1, Math.ceil(filteredSubcategories.length / subcategoryPageSize))
  const paginatedSubcategories = filteredSubcategories.slice(
    (subcategoryCurrentPage - 1) * subcategoryPageSize,
    subcategoryCurrentPage * subcategoryPageSize
  )

  // Reset subcategory page when search changes
  useEffect(() => {
    setSubcategoryCurrentPage(1)
  }, [subcategorySearch])

  const resetSubcategoryForm = () => {
    setSubcategoryName("")
    setSubcategoryImage("")
    setSelectedSubcategoryFile(null)
    setAddingSubcategory(false)
    setEditingSubcategory(null)
  }

  type Product = {
    $id: string;
    productName: string;
    images: string[];
    category: string;
    subcategory: string;
    price: number;
    finalPrice: number;
    stock: number;
    description?: string;
  };

  const [products, setProducts] = useState<{ rows: Product[] }>({ rows: [] });
  const [addingProduct, setAddingProduct] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productName, setProductName] = useState("")
  const [productImages, setProductImages] = useState([])
  const [description, setDescription] = useState("")
  const [categoryValue, setCategoryValue] = useState("Choose Category")
  const [subcategoryValue, setSubcategoryValue] = useState("Choose Subcategory")
  const [price, setPrice] = useState(0)
  const [finalPrice, setFinalPrice] = useState(0)
  const [stock, setStock] = useState(0)
  const {imgUrls, setResetUrls, setImgUrls, clearImgUrls, resetImgUrls} = useSellerStore()
  const [activeCategoryList, setActiveCategoryList] = useState(false)
  const [activeSubcategoryList, setactiveSubcategoryList] = useState(false)

  const [stockValue, setStockValue] = useState(0)
  const [selectedStokeckProductId, setSelectedStokeckProductId] = useState("")
  const [isUpdatingStock, setIsUpdatingStock] = useState(false)

  // Pagination and filter states
  const [currentPage, setCurrentPage] = useState(1)
  const [filterCategory, setFilterCategory] = useState("")
  const [filterSubcategory, setFilterSubcategory] = useState("")
  const [productSearch, setProductSearch] = useState("")
  const pageSize = 5

  // Get unique categories and subcategories from products
  const uniqueCategories = Array.from(new Set(products.rows.map((p: any) => p.category).filter(Boolean)))
  const uniqueSubcategories = Array.from(new Set(
    products.rows
      .filter((p: any) => !filterCategory || p.category === filterCategory)
      .map((p: any) => p.subcategory)
      .filter(Boolean)
  ))

  // Filter products based on category, subcategory, and search
  const filteredProducts = products.rows.filter((p: any) => {
    if (filterCategory && p.category !== filterCategory) return false
    if (filterSubcategory && p.subcategory !== filterSubcategory) return false
    if (productSearch && !p.productName.toLowerCase().includes(productSearch.toLowerCase())) return false
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize))
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filterCategory, filterSubcategory, productSearch])

// products

  useEffect(() => {
    setIsProductsActive(true);
    fetchProducts();
  }, [])

  const fetchProducts = async () => {
    const response = axios.get<any>("/api/company/product")
      response.then(res=> {const products = res.data
        setProducts(products)
      })
      .catch(err=>{console.log(err)
        toast.error("Failed to get products")
      })
  }

  // Add Product
  const handleAddProduct = async () => {
    const formData = new FormData();
    formData.append("productId", editingProduct ? editingProduct.$id : "");
    formData.append("productName", productName);
    formData.append("price", price.toString());
    formData.append("finalPrice", finalPrice.toString());
    formData.append("description", description);
    formData.append("category", categoryValue);
    formData.append("subcategory", subcategoryValue);
    imgUrls.forEach((url: string) => {
      formData.append("images", url );
    });   
    
    if (editingProduct) {
      const response = await axios.post<any>(`/api/company/product/update-product`, formData);
      if (response.data.error) {
        toast.error("Failed to update product");
      } else {
        toast.success("Product updated successfully");
        resetProductForm();
        fetchProducts();
      }
    } else {
      const response = await axios.post<any>("/api/company/product/add-product", formData);
      if (response.data.error) {
        toast.error("Failed to add product");
      } else {
        toast.success("Product added successfully");
        resetProductForm();
        fetchProducts();
      }
    }
  }

  const resetProductForm = () => {
    setAddingProduct(false)
    setEditingProduct(null)
    setProductName("")
    setPrice(0)
    setFinalPrice(0)
    setDescription("")
    setSubcategoryValue("Choose Subcategory")
    setCategoryValue("Choose Category")
    resetImgUrls()
  }

  const deleteProduct = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return
    const id = productId;
    const response = await axios.post<any>("/api/company/product/delete-product", { id });
    if (response.data.error) {
      toast.error("Failed to delete product");
    } else {
      toast.success("Product deleted successfully");
      fetchProducts();
    }
  }

  const getCtegories = async () => {
    setAddingProduct(true)
    const response = axios.get<any>("/api/company/product/category")
      response.then(res=> {const categories = res.data
        setCategories(categories)
      })
      .catch(err=>{console.log(err)
      })
  }

  const getSubcategories = async (subcategory: string[]) => {
    const response = axios.post<any>("/api/company/product/category", {subcategory})
      response.then(res=> {const subcategories = res.data
        setSubcategories(subcategories)
      })
      .catch(err=>{console.log(err)
        toast.error("Failed to get categories")
      })
  }

  const handleClickAwayCategory = () => {
		setActiveCategoryList(false);
	};

  const handleClickAwaySubcategory = () => {
    setactiveSubcategoryList(false);
  };

  const handleStock = (productId: string) => {
    setSelectedStokeckProductId(productId);
    setIsUpdatingStock(true);
  };

  const handleUpdateStock = async () => {
    const Id = selectedStokeckProductId;
    const response = await axios.post<any>("/api/company/product/update-stock", {Id, stockValue});
    if (response.data.error) {
      toast.error("Failed to update stock");
    } else {
      toast.success("Stock updated successfully");
      setIsUpdatingStock(false);
      setSelectedStokeckProductId("");
      setStockValue(0);
      fetchProducts();
    }
  };

// category & subcategory
  const categorys = async () => {
    setIsProductsActive(false);
    const response = axios.get<any>("/api/company/product/category")
      response.then(res=> {const categories = res.data
        setCategories(categories)
      })
      .catch(err=>{console.log(err)
        toast.error("Failed to get categories")
      })
  }

  const subcategorys = async (subcategory: string[], $id: string) => {
    setActiveSubcategory(true);
    setSelectedCategory($id)
    const response = axios.post<any>("/api/company/product/category", {subcategory})
      response.then(res=> {const subcategories = res.data
        setSubcategories(subcategories)
      })
      .catch(err=>{console.log(err)
      })
  }

  const addCategory = async () => {
    if (!editingCategory && !selectedCategoryFile) {
      alert('Please select an image to upload.');
      return;
    }else if (!categoryName) {
      alert('Please enter a category name.');
      return;
    }

    let uploadedImageUrl = categoryImage;
    if (selectedCategoryFile) {
      const uploadData = new FormData();
      uploadData.append('file', selectedCategoryFile);
      try {
        const uploadRes = await axios.post<any>("/api/company/product/uplode_file", uploadData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        uploadedImageUrl = uploadRes.data.res.url;
      } catch (error) {
        toast.error('Failed to upload image');
        return;
      }
    }

    const payload = {
      categoryId: editingCategory,
      categoryName,
      categoryImage: uploadedImageUrl
    };

    try {
      if (editingCategory) {
        const response = await axios.post<any>('/api/company/product/category/update-category', payload);
        if (response.status === 200) {
          toast.success('Category updated successfully!');
        } else {
          toast.error('Error updating category.');
        }
      } else {
        const response = await axios.post<any>('/api/company/product/category/addCategory', payload);
        if (response.status === 200) {
          toast.success('Category added successfully!');
        } else {
          toast.error('Error adding category.');
        }
      }
    } catch (error) {
      toast.error('Network error');
    }
    resetCategoryForm()
    return categorys()
  };

  // delete Category
  const deleteCategory = async (id: string, subcategory: string[], catImage?: string) => {
    if (catImage) {
      try {
        const parts = catImage.split('/upload/');
        let public_id = null;
        if (parts.length > 1) {
          let path = parts[1];
          if (path.match(/^v\d+\//)) path = path.substring(path.indexOf('/') + 1);
          const lastDotIndex = path.lastIndexOf('.');
          if (lastDotIndex !== -1) path = path.substring(0, lastDotIndex);
          public_id = path;
        }
        if (public_id) {
          const formData = new FormData();
          formData.append("public_id", public_id);
          await axios.post<any>("/api/company/product/delete-file", formData).catch(err => console.error("Cloudinary delete failed", err));
        }
      } catch (error) {
         console.error('Failed to delete image from cloudinary', error);
      }
    }

    const response = await axios.post<any>("/api/company/product/category/delete-category", {id, subcategory});
    if (response.data.error) {
      toast.error("Failed to delete category");
      categorys();
    } else {
      toast.success("Category deleted successfully");
      setActiveSubcategory(false)
      categorys();
    }
  }

  // Add Subcategory
  const addSubcategory = async () => {
    if (!editingSubcategory && !selectedSubcategoryFile) {
      alert('Please select an image to upload.');
      return;
    }else if (!subcategoryName) {
      alert('Please enter a subcategory name.');
      return;
    }

    let uploadedImageUrl = subcategoryImage;
    if (selectedSubcategoryFile) {
      const uploadData = new FormData();
      uploadData.append('file', selectedSubcategoryFile);
      try {
        const uploadRes = await axios.post<any>("/api/company/product/uplode_file", uploadData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        uploadedImageUrl = uploadRes.data.res.url;
      } catch (error) {
        toast.error('Failed to upload image');
        return;
      }
    }

    const payload = {
      subcategoryId: editingSubcategory,
      categoryId: selectedCategory,
      subcategoryName,
      subcategoryImage: uploadedImageUrl
    };

    try {
      if (editingSubcategory) {
        const response = await axios.post<any>('/api/company/product/category/update-subcategory', payload);
        if (response.status === 200) {
          toast.success('Subcategory updated successfully!');
        } else {
          toast.error('Error updating subcategory.');
        }
      } else {
        const response = await axios.post<any>('/api/company/product/category/addSubcategory', payload);
        if (response.status === 200) {
          toast.success('Subcategory added successfully!');
        } else {
          toast.error('Error adding subcategory.');
        }
      }
    } catch (error) {
      toast.error('Network error');
    }
    setAddingSubcategory(false);
    setActiveSubcategory(false)
    resetSubcategoryForm()
    return categorys()
  } 

  // delete Subcategory
  const deleteSubcategory = async (id: string, subCatImage?: string) => {
    if (subCatImage) {
      try {
        const parts = subCatImage.split('/upload/');
        let public_id = null;
        if (parts.length > 1) {
          let path = parts[1];
          if (path.match(/^v\d+\//)) path = path.substring(path.indexOf('/') + 1);
          const lastDotIndex = path.lastIndexOf('.');
          if (lastDotIndex !== -1) path = path.substring(0, lastDotIndex);
          public_id = path;
        }

        if (public_id) {
          const formData = new FormData();
          formData.append("public_id", public_id);
          await axios.post<any>("/api/company/product/delete-file", formData).catch(err => console.error("Cloudinary delete failed", err));
        }
      } catch (error) {
         console.error('Failed to delete image from cloudinary', error);
      }
    }

    try {
      const response = await axios.post<any>(`/api/company/product/category/detete-subcategory`, { subcategoryId: id, categoryId: selectedCategory });
      toast.success("Subcategory deleted successfully");
      setActiveSubcategory(false)
      categorys()
    } catch (error) {
      toast.error("Failed to delete subcategory");
    }
  }

  const productPage = async () => {
    setIsProductsActive(true);
  }

  return (
    <div className='flex flex-col justify-start items-center relative pb-10 min-h-screen pt-4 px-4 sm:px-6 lg:px-8'>
      
      {/* Top Navigation Tabs */}
      <div className='w-full mb-8 flex justify-center'>
        <div className="inline-flex h-12 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground w-full max-w-sm">
          <button
            onClick={() => productPage()}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 w-1/2 h-full ${isProductsActive ? "bg-background text-foreground shadow-sm" : "hover:text-foreground"}`}
          >
            Products
          </button>
          <button
            onClick={() => categorys()}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 w-1/2 h-full ${!isProductsActive ? "bg-background text-foreground shadow-sm" : "hover:text-foreground"}`}
          >
            Categories
          </button>
        </div>
      </div>

      {/* Stock Update Modal */}
      {isUpdatingStock && 
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4'>
          <Card className='w-full max-w-sm animate-in fade-in zoom-in-95 duration-200'>
            <CardHeader>
              <CardTitle className='text-center text-xl'>Update Stock</CardTitle>
            </CardHeader>
            <CardContent className='flex flex-col gap-5'>
              <Input autoFocus onChange={(e)=> setStockValue(e.target.valueAsNumber)} type="number" placeholder='Enter new stock value' className='w-full'/>
              <div className='flex gap-3 justify-end mt-2'>
                <Button variant="outline" onClick={() => setIsUpdatingStock(false)}>Cancel</Button>
                <Button onClick={() => handleUpdateStock()} className='bg-primary hover:bg-primary/90 text-white'>Update Stock</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      }

      <div className='w-full max-w-7xl'>
        {isProductsActive && 
          <div className="flex flex-col gap-6">
            <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4'>
              <h1 className='font-bold text-2xl tracking-tight'>{addingProduct || editingProduct ? (editingProduct ? "Edit Product" : "Add Product") : "Product List"}</h1>
              {addingProduct || editingProduct ?
                <Button variant="destructive" onClick={()=> resetProductForm()} className='w-full sm:w-auto'>Cancel</Button>
              :
                <Button onClick={()=> getCtegories()} className='bg-primary hover:bg-primary/90 text-white w-full sm:w-auto'>
                  <IconPlus size={18} className='mr-2' /> Add Product
                </Button>
              }
            </div>

            {/* Add / Edit Product Form */}
            {(addingProduct || editingProduct) &&
              <Card className="animate-in fade-in duration-300">
                <CardContent className="pt-6">
                  <form action="" className='flex flex-col gap-6'>
                    <div>
                      <Label className='text-sm font-semibold mb-2 block'>Product Images</Label>
                      {editingProduct && imgUrls?.length > 0 &&
                        <div className='flex flex-wrap gap-3 mb-4'> 
                          {imgUrls.map((url: string, index: number) => (
                            <div key={index} className='relative w-24 h-24 shrink-0 rounded-md overflow-hidden border'>  
                              <img src={url} alt={`Product ${index}`} className='w-full h-full object-cover' />
                              <button type="button" onClick={() => clearImgUrls(url)} className='absolute top-1 right-1 cursor-pointer bg-red-500/90 text-white rounded-md p-1 hover:bg-red-600 shadow-sm'>
                                <IconX size={14}/>
                              </button>
                            </div>
                          ))}
                        </div>
                      }
                      <Uploder/>
                    </div>

                    <div>
                      <Label className='text-sm font-semibold mb-2 block'>Product Name</Label>
                      <Input onChange={(e)=>{setProductName(e.target.value)}} value={productName} type="text" placeholder='Enter Product Name' className='w-full'/>
                    </div>

                    <div>
                      <Label className='text-sm font-semibold mb-2 block'>Product Description</Label>         
                      <textarea onChange={(e)=>{setDescription(e.target.value)}} value={description} rows={4} placeholder='Enter Product Description'
                        className='w-full bg-background rounded-md p-3 border border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-sm resize-y'>
                      </textarea>
                    </div>

                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                      <div className='w-full flex flex-col relative'>
                        <Label className='text-sm font-semibold mb-2 block'>Category</Label>
                        <div
                          onClick={()=>{setActiveCategoryList(!activeCategoryList)}}
                          className="flex justify-between items-center h-10 px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background cursor-pointer hover:bg-accent hover:text-accent-foreground"
                        >
                          <span className="truncate">{categoryValue}</span> <IconCaretDownFilled size={16} className="opacity-50"/>
                        </div>

                        {activeCategoryList && 
                        <div className="absolute top-full left-0 z-50 mt-1 w-full max-h-60 overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md p-1">
                          <ClickAwayListener onClickAway={() => handleClickAwayCategory()}>
                            <div>
                              {categories.rows.map(({ categoryName, $id, subcategory })=>{
                                return(
                                  <div
                                    key={$id}
                                    onClick={() => { setCategoryValue(categoryName); setSubcategoryValue("Choose Subcategory"); setActiveCategoryList(false); getSubcategories(subcategory) }}
                                    className='relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground'
                                  >
                                    {categoryName}
                                  </div>
                                )
                              })}
                            </div>
                          </ClickAwayListener>
                        </div>
                        }
                      </div>

                      <div className='w-full flex flex-col relative'>
                        <Label className='text-sm font-semibold mb-2 block'>Subcategory</Label>
                        <div
                          onClick={()=>{setactiveSubcategoryList(!activeSubcategoryList)}}
                          className="flex justify-between items-center h-10 px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background cursor-pointer hover:bg-accent hover:text-accent-foreground"
                        >
                          <span className="truncate">{subcategoryValue}</span> <IconCaretDownFilled size={16} className="opacity-50"/>
                        </div>

                        {activeSubcategoryList && 
                        <div className="absolute top-full left-0 z-50 mt-1 w-full max-h-60 overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md p-1">
                          <ClickAwayListener onClickAway={() => handleClickAwaySubcategory()}>
                            <div>
                              {subcategories?.map(({ $id, subcategoryName })=>{
                                return(
                                  <div
                                    key={$id}
                                    onClick={() => { setSubcategoryValue(subcategoryName); setactiveSubcategoryList(false) }}
                                    className='relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground'
                                  >
                                    {subcategoryName}
                                  </div>
                                )
                              })}
                            </div>
                          </ClickAwayListener>
                        </div>}
                      </div>
                    </div> 

                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                      <div>
                        <Label className='text-sm font-semibold mb-2 block'>Price</Label>
                        <Input onChange={(e)=>{setPrice(e.target.valueAsNumber)}} type="number" value={price} step="1" placeholder='Enter Product Price' className='w-full'/>
                      </div>

                      <div>
                        <Label className='text-sm font-semibold mb-2 block'>Final Price</Label>
                        <Input onChange={(e)=>{setFinalPrice(e.target.valueAsNumber)}} type="number" value={finalPrice} step="1" placeholder='Enter Product Final Price' className='w-full'/>
                      </div>    
                    </div>

                    <Button
                      onClick={() => handleAddProduct()}
                      type="button"
                      className="w-full mt-4 h-11 text-base group relative overflow-hidden"
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        {editingProduct ? "Update Product" : "Add Product"} <IconPlus size={18} />
                      </span>
                      <BottomGradient />
                    </Button>
                  </form>
                </CardContent>
              </Card>
            }

            {/* Product List & Filters */}
            {!addingProduct && !editingProduct && (
              <Card className="animate-in fade-in duration-300">
                <CardHeader className="border-b bg-muted/20 pb-4">
                  <div className='flex flex-col md:flex-row gap-4 w-full'>
                    <div className='flex-1'>
                      <Label className='text-xs font-semibold mb-2 block text-muted-foreground uppercase tracking-wider'>SEARCH</Label>
                      <div className="relative">
                        <IconSearch className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type='text'
                          placeholder='Search by product name...'
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          className='pl-9 w-full bg-background'
                        />
                      </div>
                    </div>
                    <div className='flex flex-col sm:flex-row gap-3 md:w-auto'>
                      <div className="w-full sm:w-48">
                        <Label className='text-xs font-semibold mb-2 block text-muted-foreground uppercase tracking-wider'>CATEGORY</Label>
                        <select
                          value={filterCategory}
                          onChange={e => { setFilterCategory(e.target.value); setFilterSubcategory('') }}
                          className='w-full h-10 px-3 py-2 border rounded-md bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                        >
                          <option value=''>All Categories</option>
                          {uniqueCategories.map((cat: string) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      <div className="w-full sm:w-48">
                        <Label className='text-xs font-semibold mb-2 block text-muted-foreground uppercase tracking-wider'>SUBCATEGORY</Label>
                        <select
                          value={filterSubcategory}
                          onChange={e => setFilterSubcategory(e.target.value)}
                          className='w-full h-10 px-3 py-2 border rounded-md bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50'
                          disabled={!filterCategory}
                        >
                          <option value=''>All Subcategories</option>
                          {uniqueSubcategories.map((sub: string) => (
                            <option key={sub} value={sub}>{sub}</option>
                          ))}
                        </select>
                      </div>
                    </div>  
                  </div>
                </CardHeader>
                
                {/* Product Table Header */}
                <div className='hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] px-6 py-3 border-b font-medium text-xs text-muted-foreground bg-muted/40 uppercase tracking-wider'>
                  <div>Product Name</div>
                  <div>Category</div>
                  <div>Subcategory</div>
                  <div className="text-right">Price</div>
                  <div className="text-center">Stock</div>
                  <div className="text-right">Actions</div>
                </div>
                
                <div className="divide-y divide-border">
                  {paginatedProducts.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">No products found matching your filters.</div>
                  ) : (
                    paginatedProducts.map(({ $id, productName, images,category, subcategory, price, stock, description, finalPrice}) => (
                      <div key={$id} className='flex flex-col sm:grid sm:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] items-center p-4 sm:px-6 gap-4 hover:bg-muted/30 transition-colors'>
                        
                        <div className='flex items-center gap-4 w-full min-w-0'>
                          <div className='w-14 h-14 relative rounded-md overflow-hidden shrink-0 border bg-background'>
                            {images && images.length > 0 ? (
                               <Image src={images[0]} fill alt={productName} className='object-cover' sizes='56px'/>
                            ) : (
                               <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No img</div>
                            )}
                          </div>
                          <div className='font-medium line-clamp-2 text-sm'>{productName}</div>
                        </div>
                        
                        <div className='hidden sm:flex items-center text-sm'>{category}</div>
                        <div className='hidden sm:flex items-center text-sm text-muted-foreground'>{subcategory}</div>
                        
                        {/* Mobile Category & Price */}
                        <div className='flex sm:hidden justify-between w-full text-sm text-muted-foreground'>
                          <span className='truncate'>{category} &rsaquo; {subcategory}</span>
                          <span className='font-medium text-foreground ml-4'>₹{finalPrice}</span>
                        </div>

                        <div className='hidden sm:flex items-center justify-end font-medium text-sm w-full'>₹{finalPrice}</div>
                        
                        <div className='flex items-center justify-between sm:justify-center w-full gap-2'>
                          <span className="sm:hidden text-sm text-muted-foreground">Stock:</span>
                          <div className='flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full'>
                            <span className={`font-semibold text-sm ${stock > 0 ? 'text-primary dark:text-primary/90' : 'text-red-500'}`}>{stock}</span>
                            <button className='text-muted-foreground hover:text-foreground transition-colors' onClick={ () => handleStock($id)}>
                              <IconEdit size={16} />
                            </button>
                          </div>
                        </div>

                        <div className='flex items-center justify-end w-full gap-2'>
                          <Button variant="outline" size="sm" className="h-8" onClick={() => {
                            setEditingProduct({$id, productName, images, category, subcategory, price, stock, description, finalPrice})
                            if(images) {
                              images.forEach((url: string) => {
                                setImgUrls(url)
                              });
                            }
                            setProductName(productName)
                            setPrice(price)
                            setFinalPrice(finalPrice)
                            setDescription(description || "")
                            setCategoryValue(category)
                            setSubcategoryValue(subcategory)
                            getCtegories()
                          }}>Edit</Button>
                          <Button variant="destructive" size="sm" className="h-8" onClick={() => deleteProduct($id)}>Delete</Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                {/* Pagination */}
                {filteredProducts.length > 0 && (
                  <div className='flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t bg-muted/20 gap-4'>
                    <div className='text-sm text-muted-foreground'>
                      Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredProducts.length)} of {filteredProducts.length} entries
                    </div>
                    <div className='flex gap-2'>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            )}
          </div>
        }
        
        {/* Categories & Subcategories View */}
        {!isProductsActive && 
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
            <Card className="animate-in slide-in-from-left-4 fade-in duration-300 h-fit">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
                <CardTitle className='text-xl'>Categories</CardTitle>
                {!addingCategory && !editingCategory && (
                  <Button size="sm" onClick={() => setAddingCategory(true)} className='bg-primary hover:bg-primary/90 text-white'>
                    <IconPlus size={16} className='mr-1' /> Add
                  </Button>
                )}
              </CardHeader>
              <CardContent className="flex flex-col gap-4 pt-4">
                <div className="relative">
                  <IconSearch className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type='text'
                    placeholder='Search categories...'
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    className='pl-9 bg-background'
                  />
                </div>

                {(addingCategory || editingCategory) && (
                  <div className='flex flex-col gap-4 p-5 rounded-lg border border-border/60 bg-muted/30'>
                    <h3 className='font-semibold text-sm tracking-wide'>{editingCategory ? "EDIT CATEGORY" : "ADD NEW CATEGORY"}</h3>
                    <div>
                      <Label className='text-xs mb-1 block text-muted-foreground'>Image</Label>
                      <Input 
                        type='file' 
                        className="bg-background cursor-pointer file:cursor-pointer"
                        onChange={(e) => { if (e.target.files) setSelectedCategoryFile(e.target.files[0]) }}
                      />
                    </div>
                    <div>
                      <Label className='text-xs mb-1 block text-muted-foreground'>Name</Label>
                      <Input 
                        type='text' 
                        placeholder='Enter category name' 
                        className="bg-background"
                        value={categoryName}
                        onChange={(e) => setCategoryName(e.target.value)}
                      />
                    </div>
                    <div className='flex gap-3 pt-2'>
                      <Button variant="outline" className='flex-1' onClick={resetCategoryForm}>Cancel</Button>
                      <Button className='flex-1 bg-primary hover:bg-primary/90 text-white' onClick={() => addCategory()}>
                        {editingCategory ? "Update" : "Save"}
                      </Button>
                    </div>
                  </div>
                )}

                <div className='flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar'>
                  {paginatedCategories.length === 0 ? (
                    <div className='text-center text-muted-foreground py-10 flex flex-col items-center gap-2'>
                      <IconSearch size={32} className="opacity-20" />
                      <p>No categories found</p>
                    </div>
                  ) : (
                    paginatedCategories.map(({ categoryName, $id, subcategory, categoryImage }: any) => (
                      <div 
                        key={$id} 
                        className={`flex items-center p-3 gap-4 rounded-xl border transition-all hover:shadow-sm cursor-pointer ${
                          selectedCategory === $id ? "border-primary/50 bg-primary/80/5 ring-1 ring-primary/50/50" : "bg-card border-border/60 hover:border-primary/30"
                        }`}
                        onClick={() => subcategorys(subcategory, $id)}
                      >
                        <div className='w-14 h-14 rounded-lg overflow-hidden relative shrink-0 border bg-muted flex items-center justify-center'>
                          {categoryImage ? (
                            <Image src={categoryImage} alt={categoryName} fill className='object-cover' sizes='56px' />
                          ) : (
                            <span className="text-xs text-muted-foreground">No img</span>
                          )}
                        </div>
                        <div className='flex flex-col flex-1'>
                          <div className='font-semibold'>{categoryName}</div>
                          <div className='text-xs text-muted-foreground mt-0.5'>{subcategory?.length || 0} subcategories</div>
                        </div>
                        <div className='flex gap-1 shrink-0' onClick={(e) => e.stopPropagation()}>
                          <Button size="icon" variant="ghost" className="h-9 w-9 text-primary hover:text-primary/90 hover:bg-primary/20 dark:text-primary/80 dark:hover:bg-primary/50" onClick={() => {
                            setCategoryName(categoryName)
                            if (categoryImage) setCategoryImage(categoryImage);
                            setEditingCategory($id)
                            setAddingCategory(false)
                          }}>
                            <IconEdit size={18} />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-9 w-9 text-red-600 hover:text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/50" onClick={() => {
                            if (confirm(`Are you sure you want to delete category "${categoryName}"?`)) {
                              deleteCategory($id, subcategory, categoryImage)
                            }
                          }}>
                            <IconX size={18} />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {filteredCategories.length > categoryPageSize && (
                  <div className='flex items-center justify-between pt-4 mt-auto border-t'>
                    <span className='text-sm text-muted-foreground'>Page {categoryCurrentPage} of {categoryTotalPages}</span>
                    <div className='flex gap-2'>
                      <Button size="sm" variant="outline" disabled={categoryCurrentPage === 1} onClick={() => setCategoryCurrentPage(p => Math.max(1, p - 1))}>Previous</Button>
                      <Button size="sm" variant="outline" disabled={categoryCurrentPage === categoryTotalPages} onClick={() => setCategoryCurrentPage(p => Math.min(categoryTotalPages, p + 1))}>Next</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {activeSubcategory && (
              <Card className="animate-in slide-in-from-right-4 fade-in duration-300 h-fit">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
                  <CardTitle className='text-xl'>Subcategories</CardTitle>
                  {!addingSubcategory && !editingSubcategory && (
                    <Button size="sm" onClick={() => setAddingSubcategory(true)} className='bg-primary hover:bg-primary/90 text-white'>
                      <IconPlus size={16} className='mr-1' /> Add
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="flex flex-col gap-4 pt-4">
                  <div className="relative">
                    <IconSearch className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type='text'
                      placeholder='Search subcategories...'
                      value={subcategorySearch}
                      onChange={(e) => setSubcategorySearch(e.target.value)}
                      className='pl-9 bg-background'
                    />
                  </div>

                  {(addingSubcategory || editingSubcategory) && (
                    <div className='flex flex-col gap-4 p-5 rounded-lg border border-border/60 bg-muted/30'>
                      <h3 className='font-semibold text-sm tracking-wide'>{editingSubcategory ? "EDIT SUBCATEGORY" : "ADD NEW SUBCATEGORY"}</h3>
                      <div>
                        <Label className='text-xs mb-1 block text-muted-foreground'>Image</Label>
                        <Input 
                          type='file' 
                          className="bg-background cursor-pointer file:cursor-pointer"
                          onChange={(e) => { if (e.target.files) setSelectedSubcategoryFile(e.target.files[0]) }}
                        />
                      </div>
                      <div>
                        <Label className='text-xs mb-1 block text-muted-foreground'>Name</Label>
                        <Input 
                          type='text' 
                          placeholder='Enter subcategory name' 
                          className="bg-background"
                          value={subcategoryName}
                          onChange={(e) => setSubcategoryName(e.target.value)}
                        />
                      </div>
                      <div className='flex gap-3 pt-2'>
                        <Button variant="outline" className='flex-1' onClick={resetSubcategoryForm}>Cancel</Button>
                        <Button className='flex-1 bg-primary hover:bg-primary/90 text-white' onClick={() => addSubcategory()}>
                          {editingSubcategory ? "Update" : "Save"}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className='flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar'>
                    {paginatedSubcategories.length === 0 ? (
                      <div className='text-center text-muted-foreground py-10 flex flex-col items-center gap-2'>
                        <IconSearch size={32} className="opacity-20" />
                        <p>No subcategories found</p>
                      </div>
                    ) : (
                      paginatedSubcategories.map(({ $id, subcategoryName, subcategoryImage }: any) => (
                        <div key={$id} className='flex items-center p-3 gap-4 rounded-xl border bg-card border-border/60 hover:border-primary/30 transition-all hover:shadow-sm'>
                          <div className='w-14 h-14 rounded-lg overflow-hidden relative shrink-0 border bg-muted flex items-center justify-center'>
                            {subcategoryImage ? (
                              <Image src={subcategoryImage} alt={subcategoryName} fill className='object-cover' sizes='56px' />
                            ) : (
                              <span className="text-xs text-muted-foreground">No img</span>
                            )}
                          </div>
                          <div className='font-semibold flex-1'>{subcategoryName}</div>
                          <div className='flex gap-1 shrink-0'>
                            <Button size="icon" variant="ghost" className="h-9 w-9 text-primary hover:text-primary/90 hover:bg-primary/20 dark:text-primary/80 dark:hover:bg-primary/50" onClick={() => {
                              setSubcategoryName(subcategoryName)
                              if (subcategoryImage) setSubcategoryImage(subcategoryImage);
                              setEditingSubcategory($id)
                              setAddingSubcategory(false)
                            }}>
                              <IconEdit size={18} />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-9 w-9 text-red-600 hover:text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/50" onClick={() => {
                              if (confirm(`Are you sure you want to delete subcategory "${subcategoryName}"?`)) {
                                deleteSubcategory($id, subcategoryImage);
                              }
                            }}>
                              <IconX size={18} />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {filteredSubcategories.length > subcategoryPageSize && (
                    <div className='flex items-center justify-between pt-4 mt-auto border-t'>
                      <span className='text-sm text-muted-foreground'>Page {subcategoryCurrentPage} of {subcategoryTotalPages}</span>
                      <div className='flex gap-2'>
                        <Button size="sm" variant="outline" disabled={subcategoryCurrentPage === 1} onClick={() => setSubcategoryCurrentPage(p => Math.max(1, p - 1))}>Previous</Button>
                        <Button size="sm" variant="outline" disabled={subcategoryCurrentPage === subcategoryTotalPages} onClick={() => setSubcategoryCurrentPage(p => Math.min(subcategoryTotalPages, p + 1))}>Next</Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        }
      </div>
    </div>
  )
}

const BottomGradient = () => {
  return (
    <>
      <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
      <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-green-300 to-transparent opacity-0 blur-sm transition duration-500 group-hover:opacity-100" />
    </>
  );
};

export default products
