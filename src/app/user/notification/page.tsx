"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from "@/store/Auth";
import { useDataStore } from "@/store/Data";
import axios from "@/lib/axios";
import { IconBell, IconInbox, IconInfoCircle, IconLoader2, IconCheck } from "@tabler/icons-react";
import { toast } from 'react-toastify';
import { Models } from 'appwrite';

interface NotificationRec extends Models.Document {
    notification: string;
    userId: string;
}

export default function NotificationPage() {
    const { user } = useAuthStore();
    const { userData, setUserData } = useDataStore();
    
    const [notifications, setNotifications] = useState<NotificationRec[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [isClearing, setIsClearing] = useState(false);

    const fetchNotifications = useCallback(async (pageNum = 1) => {
        if (!user?.$id) return;
        
        try {
            if (pageNum === 1) setLoading(true);
            const res = await axios.get<{ notifications: NotificationRec[], hasMore: boolean }>(`/api/user/notification?userId=${user.$id}&page=${pageNum}&limit=10`);
            
            if (pageNum === 1) {
                setNotifications(res.data.notifications);
            } else {
                setNotifications(prev => [...prev, ...res.data.notifications]);
            }
            
            setHasMore(res.data.hasMore);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
            toast.error("Failed to load notifications");
        } finally {
            setLoading(false);
        }
    }, [user?.$id]);

    useEffect(() => {
        if (user?.$id) {
            fetchNotifications(1);
        }
    }, [user?.$id, fetchNotifications]);

    // Clear unread badge
    useEffect(() => {
        const clearUnread = async () => {
            if (user?.$id && userData?.hasUnreadNotification && !isClearing) {
                setIsClearing(true);
                try {
                    await axios.patch('/api/user/notification', { userId: user.$id });
                    // Refresh user data globally to turn off the red dot in the UI immediately
                    await setUserData(user.$id);
                } catch (error) {
                    console.error("Failed to clear unread status", error);
                } finally {
                    setIsClearing(false);
                }
            }
        };
        
        // Slight delay so the user feels like they "saw" the new indication before it vanishes
        const timer = setTimeout(clearUnread, 1500); 
        return () => clearTimeout(timer);
    }, [user?.$id, userData?.hasUnreadNotification, setUserData, isClearing]);

    const handleLoadMore = () => {
        if (!loading && hasMore) {
            setPage(p => p + 1);
            fetchNotifications(page + 1);
        }
    };

    const handleClearAll = async () => {
        if (!user?.$id) return;
        const confirmClear = window.confirm("Are you sure you want to delete all your notifications?");
        if (!confirmClear) return;
        
        try {
            await axios.delete('/api/user/notification', { data: { userId: user.$id } } as any);
            setNotifications([]);
            toast.success("Notifications cleared successfully");
        } catch (error) {
            toast.error("Failed to clear notifications");
            console.error(error);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 min-h-[70vh]">
            <div className="flex items-center justify-between gap-3 mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/20 dark:bg-primary/30 text-primary dark:text-primary/80 rounded-xl">
                        <IconBell size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black bg-linear-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                            Notifications
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Stay updated with your latest alerts and offers</p>
                    </div>
                </div>

                {notifications.length > 0 && (
                    <button 
                        onClick={handleClearAll}
                        className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-colors focus:ring-2 focus:ring-red-500 outline-none"
                    >
                        Clear All
                    </button>
                )}
            </div>

            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-3xl shadow-xs overflow-hidden transition-all">
                {loading && page === 1 ? (
                    <div className="flex flex-col items-center justify-center p-20 text-gray-500 dark:text-gray-400">
                        <IconLoader2 size={40} className="animate-spin text-primary/90 mb-4" />
                        <p className="font-medium animate-pulse">Loading notifications...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-20 text-center">
                        <div className="w-24 h-24 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                            <IconInbox size={48} className="text-gray-400 dark:text-gray-500" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">You're all caught up!</h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                            You don't have any notifications right now. When you get updates about your orders or special offers, they'll appear here.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {notifications.map((notif, idx) => (
                            <div 
                                key={notif.$id || idx} 
                                className="group p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex gap-4 items-start duration-300"
                            >
                                <div className="mt-1 flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary/90 dark:text-primary/80 border border-primary/10 dark:border-primary/50">
                                    <IconInfoCircle size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                                        {notif.notification}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-2">
                                        {new Date(notif.$createdAt).toLocaleString(undefined, { 
                                            dateStyle: 'medium', 
                                            timeStyle: 'short' 
                                        })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {hasMore && (
                <div className="mt-8 flex justify-center">
                    <button 
                        onClick={handleLoadMore}
                        disabled={loading}
                        className="px-6 py-2.5 rounded-full font-medium text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-primary dark:hover:text-primary/80 transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 group"
                    >
                        {loading && <IconLoader2 size={16} className="animate-spin" />}
                        {loading ? 'Loading...' : 'Load more'}
                    </button>
                </div>
            )}
        </div>
    );
}
