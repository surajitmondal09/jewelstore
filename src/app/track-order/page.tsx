"use client"

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { IconSearch, IconPackage, IconAlertCircle, IconCheck, IconTruck } from '@tabler/icons-react';
import axios from '@/lib/axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';

export default function TrackOrderPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [orders, setOrders] = useState<any[]>([]);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!email.trim() || !email.includes('@')) {
            toast.error("Please enter a valid email address");
            return;
        }

        setLoading(true);
        setHasSearched(true);
        
        try {
            const response = await axios.get<any>(`/api/user/track-order?email=${encodeURIComponent(email)}`);
            if (response.data.success) {
                setOrders(response.data.orders);
            } else {
                toast.error(response.data.error || "Failed to fetch orders");
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
            toast.error("Failed to fetch orders. Please try again.");
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'placed': return 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
            case 'shipped': return 'text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800';
            case 'delivered': return 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800';
            case 'cancelled': return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
            default: return 'text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
        }
    };

    return (
        <div className='min-h-screen flex flex-col bg-gray-50 dark:bg-black'>
            <Navbar />
            
            <main className='flex-1 py-12 px-4 sm:px-6 md:px-8 max-w-4xl mx-auto w-full'>
                <div className='text-center mb-10'>
                    <div className='inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-6'>
                        <IconTruck size={32} />
                    </div>
                    <h1 className='text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-4'>Track Your Orders</h1>
                    <p className='text-gray-600 dark:text-gray-400 max-w-xl mx-auto'>Enter the email address you used during checkout to view the status of your recent purchases.</p>
                </div>

                <div className='bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 md:p-8 mb-10'>
                    <form onSubmit={handleSearch} className='flex flex-col sm:flex-row gap-4'>
                        <div className='flex-1 relative'>
                            <input
                                type='email'
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder='Enter your email address (e.g. guest@example.com)'
                                className='w-full pl-5 pr-4 py-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all'
                            />
                        </div>
                        <button 
                            type='submit'
                            disabled={loading}
                            className='bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2 whitespace-nowrap shadow-md'
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <IconSearch size={20} /> Find Orders
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {hasSearched && !loading && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='space-y-6'>
                        {orders.length === 0 ? (
                            <div className='text-center py-16 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm'>
                                <IconAlertCircle size={48} className='mx-auto text-gray-300 dark:text-gray-600 mb-4' />
                                <h3 className='text-xl font-bold text-gray-900 dark:text-white mb-2'>No Orders Found</h3>
                                <p className='text-gray-500 max-w-md mx-auto'>We couldn't find any orders associated with "{email}". Please double-check the email address or contact support if you need help.</p>
                            </div>
                        ) : (
                            <>
                                <h3 className='text-xl font-bold mb-6 flex items-center gap-2'>
                                    <IconPackage className='text-primary' /> 
                                    Found {orders.length} Order{orders.length > 1 ? 's' : ''}
                                </h3>
                                
                                {orders.map((order) => (
                                    <div key={order.$id} className='bg-white dark:bg-gray-900 rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow'>
                                        
                                        <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-6 mb-6'>
                                            <div>
                                                <p className='text-sm text-gray-500 mb-1'>Order ID</p>
                                                <p className='font-mono font-bold text-gray-900 dark:text-white'>{order.$id}</p>
                                                <p className='text-xs text-gray-400 mt-2'>
                                                    Placed on {new Date(order.$createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                </p>
                                            </div>
                                            <div className='flex flex-col md:items-end gap-2'>
                                                <div className={`px-4 py-1.5 rounded-full border text-sm font-bold capitalize flex items-center gap-2 ${getStatusColor(order.status)}`}>
                                                    {order.status === 'delivered' ? <IconCheck size={16} /> : <div className="w-2 h-2 rounded-full bg-current animate-pulse"></div>}
                                                    {order.status}
                                                </div>
                                            </div>
                                        </div>

                                        <div className='space-y-4 mb-6'>
                                            {order.items?.map((item: any) => (
                                                <div key={item.$id} className='flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl'>
                                                    <div className='flex items-center gap-4'>
                                                        <div className='w-12 h-12 bg-white dark:bg-gray-950 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-center shrink-0'>
                                                            <IconPackage size={24} className="text-gray-300" />
                                                        </div>
                                                        <div>
                                                            <p className='font-bold text-gray-900 dark:text-gray-100'>{item.productName}</p>
                                                            <p className='text-sm text-gray-500'>Qty: {item.quantity}</p>
                                                        </div>
                                                    </div>
                                                    <p className='font-bold'>₹{item.price * item.quantity}</p>
                                                </div>
                                            ))}
                                        </div>

                                        <div className='flex items-center justify-between bg-primary/5 dark:bg-primary/10 p-5 rounded-2xl'>
                                            <div>
                                                <p className='text-sm text-gray-600 dark:text-gray-400 font-medium'>Payment Status</p>
                                                <p className='font-bold capitalize text-gray-900 dark:text-white'>{order.paymentStatus} ({order.paymentType})</p>
                                            </div>
                                            <div className='text-right'>
                                                <p className='text-sm text-gray-600 dark:text-gray-400 font-medium'>Total Amount</p>
                                                <p className='text-2xl font-black text-primary'>₹{order.totalAmount}</p>
                                            </div>
                                        </div>

                                    </div>
                                ))}
                            </>
                        )}
                    </motion.div>
                )}
            </main>

            <Footer />
        </div>
    );
}
