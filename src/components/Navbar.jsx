"use client"

import React, { useState, useEffect } from 'react';
import { 
  IconUser, 
  IconLogout, 
  IconShoppingCart, 
  IconHome, 
  IconBuildingStore, 
  IconSunFilled, 
  IconMoon, 
  IconHeart, 
  IconBellFilled, 
  IconMenu2, 
  IconX,
  IconInfoCircle,
  IconMail
} from "@tabler/icons-react";
import Image from 'next/image';  
import { useRouter, usePathname } from 'next/navigation'; 
import { useAuthStore } from "@/store/Auth";
import { useDataStore } from "@/store/Data";
import ClickAwayListener from 'react-click-away-listener';
import Link from "next/link";
import { client } from "@/models/client/config";
import { db, customerTable } from "@/models/name";
import { toast } from 'react-toastify'

function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  
  const { logout, user, theme, darkTheme, lightTheme } = useAuthStore();
  const { userData, setUserData } = useDataStore();
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setUserData(user.$id);
    }
  }, [user, setUserData]);

  useEffect(() => {
    const html = document.querySelector('html');
    if (html) {
      html.classList.remove('dark', 'light');
      html.classList.add(theme);
    }
  }, [theme]);

  // Real-time Notification logic
  useEffect(() => {
    if (userData?.$id) {
      const unsubscribe = client.subscribe(
        `databases.${db}.collections.${customerTable}.documents.${userData.$id}`,
        (response) => {
          // Whenever the user's document changes (like hasUnreadNotification flipping), 
          // we instantly sync global store
          setUserData(userData.$id);
        }
      );
      return () => unsubscribe();
    }
  }, [userData?.$id, setUserData]);

  const handleLogout = async () => {
    await logout();
    setIsDropdownOpen(false);
    toast.success('Logged out successfully')
        router.push('/')
  };

  const closeSidebar = () => setIsSidebarOpen(false);
  const closeDropdown = () => setIsDropdownOpen(false);

  const navLinks = [
    { name: "Home", href: "/", icon: <IconHome size={20} /> },
    { name: "Shop", href: "/shop", icon: <IconBuildingStore size={20} /> },
    { name: "About", href: "/about", icon: <IconInfoCircle size={20} /> },
    { name: "Contact", href: "/contact", icon: <IconMail size={20} /> },
  ];

  return (
    <>
      <nav className="bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Left section: Mobile menu & Logo */}
            <div className="flex items-center gap-3 sm:gap-6">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="sm:hidden p-2 -ml-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Open menu"
              >
                <IconMenu2 size={24} />
              </button>
              
              <Link 
                href="/" 
                className="flex items-center gap-2 group cursor-pointer"
              >
                <span className="text-2xl font-black bg-linear-to-r from-primary/90 to-primary bg-clip-text text-transparent group-hover:from-primary group-hover:to-primary/80 transition-all duration-300 tracking-tight">
                  Aura Jewels
                </span>
              </Link>

              {user?.labels?.includes("owner") && (
                <Link 
                  href="/dashboard" 
                  className="hidden md:flex items-center px-3 py-1.5 text-sm font-semibold text-primary bg-primary/10 border border-primary/20 rounded-full hover:bg-primary/20 transition-all active:scale-95"
                >
                  Dashboard
                </Link>
              )}
            </div>

            {/* Middle section: Desktop Links */}
            <div className="hidden sm:flex items-center gap-8">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link 
                    key={link.name}
                    href={link.href} 
                    className={`relative font-medium text-sm transition-colors hover:text-primary ${
                      isActive ? "text-primary" : "text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    {link.name}
                    {isActive && (
                      <span className="absolute -bottom-5 left-0 w-full h-0.5 bg-primary rounded-t-full" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Right section: Actions */}
            <div className="flex items-center gap-3 sm:gap-5">
              
              {/* Notifications */}
              {user && (
                <button 
                  onClick={() => router.push("/user/notification")} 
                  className="relative p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none"
                  aria-label="Notifications"
                >
                  <IconBellFilled size={22} className="hover:scale-110 transition-transform" />
                  {userData?.hasUnreadNotification && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white dark:border-gray-950 rounded-full"></span>
                  )}
                </button>
              )}

              {/* Theme Toggles */}
              <button 
                onClick={theme === "dark" ? lightTheme : darkTheme}
                className="hidden sm:flex p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <IconSunFilled size={22} className="hover:scale-110 transition-transform text-amber-500" />
                ) : (
                  <IconMoon size={22} className="hover:scale-110 transition-transform text-indigo-500" />
                )}
              </button>

              {!user && (
                <button 
                  onClick={theme === "dark" ? lightTheme : darkTheme}
                  className="sm:hidden flex p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none"
                  aria-label="Toggle theme"
                >
                  {theme === "dark" ? (
                    <IconSunFilled size={22} className="text-amber-500" />
                  ) : (
                    <IconMoon size={22} className="text-indigo-500" />
                  )}
                </button>
              )}

              {/* User Menu or Login */}
              {user ? (
                <ClickAwayListener onClickAway={closeDropdown}>
                  <div className="relative">
                    <button 
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="relative block w-10 h-10 rounded-full overflow-hidden border-2 border-transparent hover:border-primary focus:outline-none focus:border-primary transition-all active:scale-95 shadow-sm"
                    >
                      <Image
                        src={userData?.avatar || "/user.png"}
                        alt="User avatar"
                        fill
                        className="object-cover"
                      />
                    </button>
                    
                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                      <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl py-2 z-50 transform opacity-100 scale-100 transition-all origin-top-right">
                        
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 mb-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.name || "User"}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                        </div>

                        <Link
                          href="/user"
                          onClick={closeDropdown}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          <IconUser size={18} />
                          Profile
                        </Link>

                        <Link
                          href="/user/cart"
                          onClick={closeDropdown}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          <IconShoppingCart size={18} />
                          Cart
                        </Link>
                        
                        <Link
                          href="/user/liked"
                          onClick={closeDropdown}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          <IconHeart size={18} />
                          Liked
                        </Link>

                        <button
                          onClick={theme === "dark" ? lightTheme : darkTheme}
                          className="sm:hidden flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          {theme === "dark" ? (
                            <><IconSunFilled size={18} className="text-amber-500" /> Light Mode</>
                          ) : (
                            <><IconMoon size={18} className="text-indigo-500" /> Dark Mode</>
                          )}
                        </button>

                        <div className="border-t border-gray-100 dark:border-gray-800 mt-2 pt-2">
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                          >
                            <IconLogout size={18} />
                            Logout
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </ClickAwayListener>
              ) : (
                <button
                  onClick={() => router.push("/login")}
                  className="px-5 py-2 text-sm font-semibold text-primary-foreground bg-primary rounded-full hover:bg-primary/90 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:focus:ring-offset-gray-900"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar Overlay */}
      <div 
        className={`fixed inset-0 bg-gray-900/60 dark:bg-black/60 backdrop-blur-sm z-60 transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <div 
        className={`fixed top-0 left-0 h-full w-70 bg-white dark:bg-gray-950 shadow-2xl z-70 transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">            
            <span className="text-2xl font-black bg-linear-to-r from-primary/90 to-primary bg-clip-text text-transparent">
              Aura Jewels
            </span>
            <button 
              onClick={closeSidebar} 
              className="p-2 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none"
              aria-label="Close menu"
            >
              <IconX size={24} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link 
                  key={link.name}
                  href={link.href} 
                  onClick={closeSidebar} 
                  className={`flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium transition-colors ${
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900"
                  }`}
                >
                  {link.icon}
                  {link.name}
                </Link>
              );
            })}
            
            {user?.labels?.includes("owner") && (
              <Link 
                href="/dashboard" 
                onClick={closeSidebar} 
                className={`flex md:hidden items-center gap-4 px-4 py-3.5 rounded-xl font-medium transition-colors ${
                  pathname === "/dashboard" 
                    ? "bg-primary/10 text-primary" 
                    : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900"
                }`}
              >
                <IconBuildingStore size={20} />
                Dashboard
              </Link>
            )}
          </div>

          {!user && (
            <div className="p-4 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => { closeSidebar(); router.push("/login"); }}
                className="w-full py-3 text-sm font-semibold text-primary-foreground bg-primary rounded-xl hover:bg-primary/90 transition-colors"
              >
                Login
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Navbar;
