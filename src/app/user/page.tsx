"use client"

import React, { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/Auth'
import { IconUser, IconWallet, IconLogout, IconMapPin, IconPhone, IconMail, IconEdit, IconShoppingBag, IconHeart, IconShare, IconAddressBook, IconCircleCheck, IconCircleX, IconPlus, IconTrash, IconLoader2 } from '@tabler/icons-react'
import { toast } from 'react-toastify'
import { useDataStore } from '@/store/Data'
import Image from 'next/image';
import { account } from '@/models/client/config'
import axios from '@/lib/axios'


export default function ProfilePage() {
  const router = useRouter()
  const { user, logout, session } = useAuthStore()
  const { userData } = useDataStore()

  const [editingAddress, setEditingAddress] = useState(false)
  const [addresses, setAddresses] = useState<any[]>([])
  const [selectedAddress, setSelectedAddress] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isPageLoading, setIsPageLoading] = useState(true)

  const [addressForm, setAddressForm] = useState({
    location: '',
    city: '',
    state: '',
    pincode: '',
    phone: ''
  })

  useEffect(() => {
    if (user && userData) {
      fetchAddresses();
    } else {
      setIsPageLoading(false);
    }
  }, [user, userData])

  const fetchAddresses = async () => {
    try {
      const response = await axios.get(`/api/user/address?customerId=${userData.$id}`);
      const data = response.data;
      if (data) {
        setAddresses(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsPageLoading(false);
    }
  }

  if (isPageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <IconLoader2 className="animate-spin text-primary size-10" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50 dark:bg-gray-900/50">
        <main className="max-w-md w-full mx-auto p-8 text-center bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
          <div className="w-20 h-20 bg-primary/20 dark:bg-primary/30 text-primary dark:text-primary/80 rounded-full flex items-center justify-center mx-auto mb-6">
            <IconUser size={40} />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Access Denied</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Please log in to view and manage your profile</p>
          <button onClick={() => router.push('/login')} className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl transition-colors shadow-md shadow-primary/20 active:scale-[0.98]">
            Sign In to Continue
          </button>
        </main>
      </div>
    )
  }

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out successfully')
    router.push('/')
  }

  const hendelVerifyEmail = async () => {
    try {
      const promise = account.createVerification({
        url: `${process.env.NEXT_PUBLIC_DOMAIN_NAME}/verifyEmail`
      });
      toast.promise(promise, {
        pending: 'Sending verification email...',
        success: 'Verification email sent successfully! Please check your inbox.',
        error: 'Failed to send verification email'
      });
    } catch (error) {
      console.error(error)
    }
  }

  const handleAddressSave = async () => {
    setIsLoading(true);
    if (selectedAddress) {
      // Update address
      try {
        const response = await axios.put('/api/user/address', { documentId: selectedAddress.$id, ...addressForm });
        const data = response.data;
        if (response.status === 200) {
          await fetchAddresses();
          setEditingAddress(false);
          setSelectedAddress(null)
          toast.success('Address updated successfully');
        } else {
          toast.error(data.error || 'Failed to update address');
        }
      } catch (error) {
        toast.error('An error occurred while updating the address');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Add new address
      try {
        const response = await axios.post('/api/user/address', { customerId: userData.$id, ...addressForm });
        const data = response.data;
        if (response.status === 200) {
          await fetchAddresses();
          setEditingAddress(false);
          toast.success('Address added successfully');
        } else {
          toast.error(data.error || 'Failed to add address');
        }
      } catch (error) {
        toast.error('An error occurred while adding the address');
      } finally {
        setIsLoading(false);
      }
    }
  }

  const handleEditAddress = (address: any) => {
    setSelectedAddress(address);
    setAddressForm({
      location: address.location,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      phone: address.phone
    });
    setEditingAddress(true);
  }

  const handleAddNewAddress = () => {
    setSelectedAddress(null);
    setAddressForm({
      location: '',
      city: '',
      state: '',
      pincode: '',
      phone: ''
    });
    setEditingAddress(true);
  }

  const handleDeleteAddress = async (addressId: string) => {
    if (window.confirm("Are you sure you want to delete this address?")) {
      try {
        const response = await axios.delete('/api/user/address', { data: { documentId: addressId } });
        const data = response.data;
        if (response.status === 200) {
          fetchAddresses();
          toast.success('Address deleted successfully');
        } else {
          toast.error(data.error || 'Failed to delete address');
        }
      } catch (error) {
        toast.error('An error occurred while deleting the address');
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/30 dark:bg-gray-900/20">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
              My Profile
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage your account settings and preferences</p>
          </div>
          <button 
            onClick={handleLogout} 
            className="hidden sm:inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-900/50 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium transition-all shadow-sm active:scale-95"
          >
            <IconLogout size={18} /> 
            <span>Sign Out</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: User Info Card */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-gray-700/60">
              <div className="flex flex-col items-center text-center">
                <div className="w-28 h-28 bg-gray-100 dark:bg-gray-700 overflow-hidden relative rounded-full mb-5 ring-4 ring-white dark:ring-gray-800 shadow-md">
                  {userData?.avatar ? (
                    <Image
                      src={userData.avatar}
                      alt="avatar"
                      fill
                      className="object-cover"
                      sizes="(max-width: 112px) 100vw, 112px"
                    />
                  ) : (
                    <Image
                      src="/user.png"
                      alt="avatar"
                      fill
                      className="object-cover p-4"
                      sizes="(max-width: 112px) 100vw, 112px"
                    />
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{user?.name || 'User'}</h2>
                <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 px-3 py-1 rounded-full text-sm mb-6">
                  <IconMail size={14} />
                  <span className="truncate max-w-50">{user?.email}</span>
                </div>
              </div>

              <div className="h-px bg-gray-100 dark:bg-gray-700/60 w-full mb-6"></div>

              {/* Quick Links */}
              <div className="space-y-2.5">
                <button 
                  onClick={() => router.push('/user/cart')} 
                  className="w-full flex items-center justify-between p-3.5 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-primary dark:hover:text-primary/80 transition-colors group border border-transparent hover:border-gray-100 dark:hover:border-gray-600"
                >
                  <div className="flex items-center gap-3 font-medium">
                    <div className="p-2 bg-gray-100 dark:bg-gray-900 rounded-lg group-hover:bg-primary/20 dark:group-hover:bg-primary/30 transition-colors">
                      <IconShoppingBag size={18} className="text-gray-500 dark:text-gray-400 group-hover:text-primary dark:group-hover:text-primary/80" />
                    </div>
                    <span>My Cart</span>
                  </div>
                </button>
                <button 
                  onClick={() => router.push('/user/liked')} 
                  className="w-full flex items-center justify-between p-3.5 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-rose-600 dark:hover:text-rose-400 transition-colors group border border-transparent hover:border-gray-100 dark:hover:border-gray-600"
                >
                  <div className="flex items-center gap-3 font-medium">
                    <div className="p-2 bg-gray-100 dark:bg-gray-900 rounded-lg group-hover:bg-rose-100 dark:group-hover:bg-rose-900/30 transition-colors">
                      <IconHeart size={18} className="text-gray-500 dark:text-gray-400 group-hover:text-rose-600 dark:group-hover:text-rose-400" />
                    </div>
                    <span>Liked Items</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Right: Details Section */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Contact Info */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-gray-700/60">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                <IconAddressBook className="text-primary/90" /> Account Details
              </h3>
              
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Email Address</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{user?.email}</p>
                  </div>
                  <div>
                    {user.emailVerification ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary/80 text-sm font-medium border border-primary/20 dark:border-primary/30">
                        <IconCircleCheck size={16} />
                        Verified
                      </span>
                    ) : (
                      <button 
                        onClick={hendelVerifyEmail} 
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg transition-colors shadow-sm active:scale-95"
                      >
                        <IconMail size={16} />
                        Verify Email
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-gray-700/60">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <IconMapPin className="text-primary/90" /> Delivery Addresses
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">Manage where your orders are delivered</p>
                </div>
                {!editingAddress && (
                  <button 
                    onClick={handleAddNewAddress} 
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary/80 hover:bg-primary/20 dark:hover:bg-primary/40 text-sm font-medium rounded-lg transition-colors border border-primary/20 dark:border-primary/30"
                  >
                    <IconPlus size={16} /> Add New
                  </button>
                )}
              </div>

              {editingAddress ? (
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                    {selectedAddress ? 'Edit Address' : 'Add New Address'}
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Street Address</label>
                      <input 
                        type="text" 
                        value={addressForm.location} 
                        onChange={(e) => setAddressForm({ ...addressForm, location: e.target.value })} 
                        placeholder="House No. 12, ABC Society, MG Road" 
                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50/20 focus:border-primary/50 outline-none transition-all text-gray-900 dark:text-gray-100" 
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                        <input 
                          type="text" 
                          value={addressForm.city} 
                          onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} 
                          placeholder="City" 
                          className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50/20 focus:border-primary/50 outline-none transition-all text-gray-900 dark:text-gray-100" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State</label>
                        <input 
                          type="text" 
                          value={addressForm.state} 
                          onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })} 
                          placeholder="State" 
                          className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50/20 focus:border-primary/50 outline-none transition-all text-gray-900 dark:text-gray-100" 
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">PIN Code</label>
                        <input 
                          type="text" 
                          value={addressForm.pincode} 
                          onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })} 
                          placeholder="e.g. 100001" 
                          className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50/20 focus:border-primary/50 outline-none transition-all text-gray-900 dark:text-gray-100" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                        <input 
                          type="tel" 
                          value={addressForm.phone} 
                          onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })} 
                          placeholder="Phone Number" 
                          className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50/20 focus:border-primary/50 outline-none transition-all text-gray-900 dark:text-gray-100" 
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 mt-6">
                      <button 
                        onClick={handleAddressSave} 
                        disabled={isLoading}
                        className="px-6 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isLoading && <IconLoader2 size={18} className="animate-spin" />}
                        {isLoading ? 'Saving...' : 'Save Address'}
                      </button>
                      <button 
                        onClick={() => {setEditingAddress(false); setSelectedAddress(null);}} 
                        disabled={isLoading}
                        className="px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-70"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                addresses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((address) => (
                      <div key={address.$id} className="relative group bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:border-primary/50/50 dark:hover:border-primary/50/50 transition-colors shadow-sm">
                        <div className="absolute top-4 right-4 flex opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity gap-2">
                          <button 
                            onClick={() => handleEditAddress(address)} 
                            className="p-1.5 bg-primary/10 dark:bg-primary/30 text-primary dark:text-primary/80 rounded-md hover:bg-primary/20 dark:hover:bg-primary/50 transition-colors"
                            title="Edit"
                          >
                            <IconEdit size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteAddress(address.$id)} 
                            className="p-1.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-md hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                            title="Delete"
                          >
                            <IconTrash size={16} />
                          </button>
                        </div>
                        
                        <div className="pr-16 space-y-2.5">
                          <p className="font-medium text-gray-900 dark:text-gray-100 leading-snug">{address.location}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {address.city}, {address.state} <span className="font-medium text-gray-700 dark:text-gray-300">{address.pincode}</span>
                          </p>
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 dark:bg-gray-800 rounded-md text-xs font-medium text-gray-700 dark:text-gray-300 mt-2">
                            <IconPhone size={14} className="text-gray-500" /> 
                            {address.phone}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 px-4 bg-gray-50 dark:bg-gray-900/30 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <IconMapPin className="text-gray-400 size-8" />
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No addresses saved</h4>
                    <p className="text-gray-500 max-w-sm mx-auto mb-6">You haven't added any delivery addresses yet. Add one now to make checkout faster.</p>
                    <button 
                      onClick={handleAddNewAddress} 
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      <IconPlus size={18} /> Add Your First Address
                    </button>
                  </div>
                )
              )}
            </div>

            {/* Orders History */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-gray-700/60 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 dark:bg-purple-500/5 rounded-bl-full z-0"></div>
              
              <div className="relative z-10">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <IconShoppingBag className="text-purple-500" /> Orders History
                </h3>
                <p className="text-sm text-gray-500 mb-6">View and track all your recent purchases</p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={() => router.push("/user/order-history")} 
                    className="flex-1 inline-flex justify-center items-center gap-2 py-3 px-6 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-all shadow-md shadow-purple-600/20 active:scale-95 group"
                  >
                    <IconShoppingBag size={20} className="group-hover:animate-bounce" />
                    View All Orders
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Mobile Sign Out Button */}
        <div className="mt-8 sm:hidden">
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-900/50 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium transition-all shadow-sm active:scale-95"
          >
            <IconLogout size={20} /> 
            <span className="text-lg">Sign Out</span>
          </button>
        </div>
      </main>
    </div>
  )
}
