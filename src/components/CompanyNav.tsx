"use client"

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { IconCaretDownFilled, IconDashboard, IconPackage, IconShoppingCart, IconSpeakerphone, IconLifebuoy } from '@tabler/icons-react';

const navLinks = [
    { href: "/dashboard", label: "Control Panel", icon: IconDashboard },
    { href: "/dashboard/products", label: "Products", icon: IconPackage },
    { href: "/dashboard/online-orders", label: "Online Orders", icon: IconShoppingCart },
    { href: "/dashboard/broadcast", label: "Broadcast", icon: IconSpeakerphone },
    { href: "/dashboard/support", label: "Support", icon: IconLifebuoy },
];

function CompanyNav() {
    const pathname = usePathname();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const activeLink = navLinks.find(link => link.href === pathname);

    return (
        <div className='py-2 mb-2'>
            {/* Mobile Nav */}
            <div className='md:hidden relative' ref={dropdownRef}>
                <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className='w-full flex items-center justify-between p-2 border border-gray-200 dark:border-gray-800 rounded-md text-left text-sm font-medium bg-transparent text-gray-800 dark:text-gray-200 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50'
                >
                    <div className='flex items-center gap-2'> 
                        {activeLink && activeLink.icon && React.createElement(activeLink.icon, { size: 16 })}
                        <span>{activeLink ? activeLink.label : "Dashboard Menu"}</span>
                    </div>
                    <IconCaretDownFilled className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} size={14} />
                </button>
                
                {isDropdownOpen && (
                    <div className='absolute z-20 mt-1 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md shadow-sm overflow-hidden'>
                        <nav className='flex flex-col p-1'>
                            {navLinks.map(link => {
                                const isActive = pathname === link.href;
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={() => setIsDropdownOpen(false)}
                                        className={`flex items-center gap-2 p-2 rounded-md text-sm transition-colors ${
                                            isActive 
                                                ? "bg-primary/10 text-primary dark:text-primary/90 font-medium" 
                                                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                                        }`}
                                    >
                                        <link.icon size={16} />
                                        <span>{link.label}</span>
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                )}
            </div>

            {/* Desktop Nav */}
            <nav className='hidden md:flex justify-center items-center'>
                <div className='flex items-center gap-1 border border-gray-200 dark:border-gray-800 rounded-lg p-1'>
                    {navLinks.map(link => {
                        const isActive = pathname === link.href;
                        return (
                            <Link 
                                key={link.href} 
                                href={link.href} 
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                                    isActive 
                                        ? "bg-primary/10 text-primary dark:text-primary/90 font-medium" 
                                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                                }`}
                            >
                                <link.icon size={16} />
                                <span>{link.label}</span>
                            </Link>
                        )
                    })}
                </div>
            </nav>
        </div>
    )
}

export default CompanyNav;
