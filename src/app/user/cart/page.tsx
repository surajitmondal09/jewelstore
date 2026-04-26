"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useState } from "react";
import axios from "@/lib/axios";
import { useDataStore } from "@/store/Data";
import { toast } from "react-toastify";
import { IconMinus, IconPlus, IconMapPin, IconTrash, IconShoppingCartOff } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
// @ts-expect-error: no types available for cashfree
import { load } from "@cashfreepayments/cashfree-js";

type CartItem = {
	$id: string;
	productId: string;
	productName: string;
	quantity: number;
	price: number;
};

export default function CartPage() {
	const { userData, setUserData } = useDataStore();
	const [items, setItems] = useState<CartItem[]>([]);
	const [productMap, setProductMap] = useState<Record<string, any>>({});
	const [loading, setLoading] = useState(false);
	const [isOrdering, setIsOrdering] = useState(false);
	const [addresses, setAddresses] = useState<any[]>([]);
	const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
	const [paymentMethod, setPaymentMethod] = useState<"cod" | "online">("online");
	const [cashfree, setCashfree] = useState<any>(null);
	const router = useRouter();

	useEffect(() => {
		load({ mode: "sandbox" }).then((cf: any) => setCashfree(cf)).catch((err: any) => console.error("Cashfree SDK failed to load", err));
	}, []);

	useEffect(() => {
		const fetchItemsAndAddresses = async () => {
			if (!userData?.$id) return;
			setLoading(true);
			try {
				// fetch cart items
				if (userData.cartId && userData.cartId.length > 0) {
					const promises = userData.cartId.map((id: string) => axios.get<any>(`/api/item?id=${id}`));
					const responses = await Promise.all(promises);
					const fetched: CartItem[] = responses.map((r) => r.data);
					setItems(fetched);

					// fetch product details for images / links
					const uniqueProductIds = Array.from(new Set(fetched.map((f) => f.productId)));
					const prodPromises = uniqueProductIds.map((pid) => axios.post<any>('/api/company/product/get-product', { id: pid }));
					const prodResponses = await Promise.allSettled(prodPromises);
					const map: Record<string, any> = {};
					prodResponses.forEach((res, idx) => {
						if (res.status === 'fulfilled') {
							map[uniqueProductIds[idx]] = res.value.data;
						}
					});
					setProductMap(map);
				} else {
					setItems([]);
				}

				// fetch addresses
				const addressResponse = await fetch(`/api/user/address?customerId=${userData.$id}`);
				const addressData = await addressResponse.json();
				if (addressData) {
					setAddresses(addressData);
					if (addressData.length > 0) {
						setSelectedAddress(addressData[0].$id);
					}
				}

			} catch (err) {
				console.error(err);
				toast.error("Failed to load cart items or addresses");
			} finally {
				setLoading(false);
			}
		};

		fetchItemsAndAddresses();
	}, [userData]);


	const subtotal = items.reduce((s, it) => {
		const product = productMap[it.productId];
		const itemPrice = product && typeof product.finalPrice === 'number' ? product.finalPrice : 0;
		return s + (Number(itemPrice) || 0) * (Number(it.quantity) || 0);
	}, 0);

	const hasUnavailableItems = items.some(it => !productMap[it.productId] || productMap[it.productId].error);

	const verifyPayment = async (orderId: string) => {
		try {
			const itemIds = userData.cartId || items.map((i) => i.$id);
			const res = await axios.post<any>("/api/user/online-order/verify-cashfree", {
				orderId,
				customerId: userData.$id,
				addressID: selectedAddress,
				itemId: itemIds,
				totalAmount: subtotal,
				shipping_charge: 0.0
			});

			if (res.data?.success) {
				toast.success("Order placed successfully");
				if (setUserData && userData.$id) {
					await setUserData(userData.$id);
				}
				setItems([]);
			} else {
				toast.error("Payment verification failed");
			}
		} catch (err) {
			console.error(err);
			toast.error("Failed to verify payment");
		} finally {
			setIsOrdering(false);
		}
	}

	const handleCreateOrder = async () => {
		if (!userData || !userData.$id) {
			toast.error("No customer data available");
			return;
		}
		if (items.length === 0) {
			toast.error("Cart is empty");
			return;
		}
		if (!selectedAddress) {
			toast.error("Please select a shipping address");
			return;
		}

		setIsOrdering(true);

		if (paymentMethod === "online") {
			try {
				if (!cashfree) {
					toast.error("Payment SDK not initialized");
					setIsOrdering(false);
					return;
				}

				const customerDetails = {
					customerId: userData.$id,
					totalAmount: subtotal,
					name: userData.name,
					email: userData.email,
					phone: userData.phone || "9999999999"
				};
				
				const sessionRes = await axios.post<any>("/api/user/online-order/create-cashfree", customerDetails);
				if (sessionRes.data?.error) {
					toast.error("Could not initiate payment");
					setIsOrdering(false);
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
						setIsOrdering(false);
					}
					if(result.redirect){
						console.log("Redirection");
					}
					if(result.paymentDetails){
						verifyPayment(orderId);
					}
				});
			} catch (error) {
				console.error(error);
				toast.error("Error initiating payment");
				setIsOrdering(false);
			}
		} else {
			try {
				const itemIds = userData.cartId || items.map((i) => i.$id);
				const res = await axios.post<any>("/api/user/online-order", {
					customerId: userData.$id,
					addressID: selectedAddress,
					itemId: itemIds,
					totalAmount: subtotal,
					shipping_charge: 0.0,
					paymentType: "cod",
				});

				if (res.data?.error) {
					toast.error("Failed to create order");
				} else {
					toast.success("Order placed successfully");
					// refresh customer data (will clear cart)
					if (setUserData && userData.$id) {
						await setUserData(userData.$id);
					}
					setItems([]);
				}
			} catch (err) {
				console.error(err);
				toast.error("Failed to create order");
			} finally {
				setIsOrdering(false);
			}
		}
	};

	const handleUpdateQuantity = async (itemId: string, newQty: number) => {
		if (newQty < 1) {
			// remove item
			await handleRemove(itemId);
			return;
		}
		try {
			const res = await axios.patch<any>('/api/item', { id: itemId, quantity: newQty });
			if (res.data?.error) {
				toast.error('Failed to update quantity');
				return;
			}
			setItems((prev) => prev.map((it) => (it.$id === itemId ? { ...it, quantity: newQty } : it)));
		} catch (err) {
			console.error(err);
			toast.error('Failed to update quantity');
		}
	};

	const handleRemove = async (itemId: string) => {
		if (!userData || !userData.$id) {
			toast.error('No user');
			return;
		}
		try {
			const res = await axios.post<any>('/api/user/cart/remove', { customerID: userData.$id, itemID: itemId });
			if (res.data?.success) {
				setItems((prev) => prev.filter((it) => it.$id !== itemId));
				if (setUserData) await setUserData(userData.$id);
				toast.success('Item removed');
			} else {
				toast.error('Failed to remove item');
			}
		} catch (err) {
			console.error(err);
			toast.error('Failed to remove item');
		}
	};

	return (
		<div className="max-w-6xl mx-auto sm:p-6 p-4 min-h-[80vh]">
			<h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-100">Shopping Cart</h1>

			{loading ? (
				<div className="flex justify-center items-center min-h-[40vh]">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
				</div>
			) : items.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-20 bg-card border rounded-2xl shadow-sm px-4">
					<div className="mb-6 inline-flex items-center justify-center w-24 h-24 rounded-full bg-gray-50 dark:bg-gray-800/50">
						<IconShoppingCartOff size={48} className="text-gray-400" stroke={1.5} />
					</div>
					<h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-gray-100">Your cart is empty</h2>
					<p className="text-gray-500 mb-8 text-center max-w-md">Looks like you haven&apos;t added anything to your cart yet. Browse our products and find something you love!</p>
					<button 
						onClick={() => router.push('/')} 
						className="px-8 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-all shadow-md hover:shadow-lg active:scale-95"
					>
						Start Shopping
					</button>
				</div>
			) : (
				<div className="flex flex-col lg:flex-row gap-8">
					{/* Cart Items Section */}
					<div className="flex-1 space-y-4">
						{items.map((it) => {
							const product = productMap[it.productId];
							let imgSrc = '';
							if (product && product.images) {
								try {
									if (typeof product.images === 'string') {
										if (product.images.trim().startsWith('[')) {
											imgSrc = JSON.parse(product.images)[0];
										} else {
											imgSrc = product.images.split(',')[0];
										}
									} else if (Array.isArray(product.images)) {
										imgSrc = product.images[0];
									}
								} catch {
									imgSrc = '';
								}
							}
							return (
								<div key={it.$id} className="p-4 border rounded-2xl bg-card shadow-sm hover:shadow-md transition-all flex sm:gap-6 gap-4 items-center sm:flex-row flex-col">
									{imgSrc && product && !product.error ? (
										<a href={`/shop/product/${product.slug}`} className="w-28 h-28 shrink-0 overflow-hidden rounded-xl border bg-gray-50 dark:bg-gray-800/50">
											<img src={imgSrc} alt={product.productName || it.productName} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
										</a>
									) : (
										<div className="w-28 h-28 bg-gray-100 dark:bg-gray-800/50 rounded-xl flex items-center justify-center text-xs text-gray-400 shrink-0 border text-center p-2">
											{product && !product.error ? "No Image" : "Unavailable"}
										</div>
									)}
									<div className="flex-1 flex flex-col sm:flex-row justify-between w-full gap-4">
										<div className="flex-1 space-y-2">
											{product && !product.error ? (
												<a href={`/shop/product/${product.slug}`} className="font-semibold text-lg text-gray-900 dark:text-gray-100 hover:text-primary dark:hover:text-primary/80 line-clamp-2 transition-colors">
													{product.productName}
												</a>
											) : (
												<p className="font-semibold text-lg text-gray-400 dark:text-gray-500 line-clamp-2 italic">
													{it.productName} (Unavailable)
												</p>
											)}
											{product && !product.error ? (
												<p className="text-sm text-gray-500 font-medium">₹{Number(product.finalPrice).toFixed(2)}</p>
											) : (
												<p className="text-sm text-red-500 font-medium">Out of Stock</p>
											)}
											<div className={`mt-4 flex items-center gap-3 bg-gray-50 dark:bg-gray-800/50 w-fit p-1.5 rounded-xl border ${(!product || product.error) ? 'opacity-50 pointer-events-none' : ''}`}>
												<button onClick={() => handleUpdateQuantity(it.$id, it.quantity - 1)} className="p-1.5 hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm rounded-lg transition-all text-gray-600 dark:text-gray-300 active:scale-95"><IconMinus size={16} /></button>
												<span className="w-8 text-center font-semibold text-sm">{it.quantity}</span>
												<button onClick={() => handleUpdateQuantity(it.$id, it.quantity + 1)} className="p-1.5 hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm rounded-lg transition-all text-gray-600 dark:text-gray-300 active:scale-95"><IconPlus size={16} /></button>
											</div>
										</div>
										<div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto mt-2 sm:mt-0 border-t sm:border-t-0 pt-4 sm:pt-0">
											<p className="font-bold text-xl text-gray-900 dark:text-gray-100">₹{product && !product.error ? (product.finalPrice * it.quantity).toFixed(2) : "0.00"}</p>
											<button onClick={() => handleRemove(it.$id)} className="mt-3 text-sm text-red-500 hover:text-red-700 font-medium px-4 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex items-center gap-2 active:scale-95">
												<IconTrash size={18} />
												<span className="sm:hidden lg:inline">Remove</span>
											</button>
										</div>
									</div>
								</div>
							);
						})}
					</div>

					{/* Order Summary Section */}
					<div className="w-full lg:w-105 shrink-0">
						<div className="p-6 border rounded-2xl bg-card shadow-sm sticky top-24 space-y-8">
							<h2 className="text-2xl font-bold border-b pb-4">Order Summary</h2>
							
							<div className="flex justify-between items-center text-gray-600 dark:text-gray-400 text-lg">
								<span>Subtotal ({items.length} items)</span>
								<span className="font-semibold text-gray-900 dark:text-gray-100">₹{subtotal.toFixed(2)}</span>
							</div>
							{hasUnavailableItems && (
								<div className="text-sm p-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-xl border border-red-200 dark:border-red-900/50 mt-4">
									Some items in your cart are no longer available. Please remove them to proceed.
								</div>
							)}
							
							<div className="border-t pt-6">
								<h3 className="font-semibold mb-4 flex items-center gap-2 text-lg"><IconMapPin size={20} className="text-primary/90"/> Shipping Address</h3>
								{addresses.length > 0 ? (
									<div className="space-y-3 max-h-75 overflow-y-auto pr-2 custom-scrollbar">
										{addresses.map((address) => (
											<label key={address.$id} className={`flex items-start gap-4 p-4 border rounded-xl cursor-pointer transition-all hover:shadow-md ${selectedAddress === address.$id ? 'border-primary/50 bg-primary/5 dark:bg-primary/10 ring-1 ring-primary/50' : 'hover:border-gray-400'}`}>
												<input
													type="radio"
													name="address"
													value={address.$id}
													checked={selectedAddress === address.$id}
													onChange={(e) => setSelectedAddress(e.target.value)}
													className="mt-1.5 w-4 h-4 text-primary bg-gray-100 border-gray-300 focus:ring-primary/50 dark:focus:ring-primary/60 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
												/>
												<div className="text-sm flex-1">
													<p className="font-semibold text-gray-900 dark:text-gray-100 text-base mb-1">{address.location}</p>
													<p className="text-gray-600 dark:text-gray-400">{address.city}, {address.state} {address.pincode}</p>
													<p className="text-gray-600 dark:text-gray-400 mt-1">{address.phone}</p>
												</div>
											</label>
										))}
									</div>
								) : (
									<div className="text-sm p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-xl border border-yellow-200 dark:border-yellow-900/50">
										No addresses found. <a href="/user/address" className="font-bold underline hover:text-yellow-900 dark:hover:text-yellow-100">Add one in your profile</a>.
									</div>
								)}
							</div>
							
							<div className="border-t pt-6">
								<h3 className="font-semibold mb-4 text-lg">Payment Method</h3>
								<div className="grid grid-cols-2 gap-4">
									<label className={`flex flex-col items-center justify-center p-4 border rounded-xl cursor-pointer transition-all text-sm text-center ${paymentMethod === "online" ? 'border-primary/50 bg-primary/5 dark:bg-primary/10 ring-1 ring-primary/50 shadow-sm' : 'hover:border-gray-400 bg-gray-50/50 dark:bg-gray-800/30'}`}>
										<input 
											type="radio" 
											className="sr-only"
											name="paymentMethod" 
											value="online" 
											checked={paymentMethod === "online"} 
											onChange={() => setPaymentMethod("online")} 
										/>
										<span className="font-semibold text-gray-900 dark:text-gray-100">Online Pay</span>
										<span className="text-xs text-gray-500 mt-1.5 font-medium">(Cashfree)</span>
									</label>
									<label className={`flex flex-col items-center justify-center p-4 border rounded-xl cursor-pointer transition-all text-sm text-center ${paymentMethod === "cod" ? 'border-primary/50 bg-primary/5 dark:bg-primary/10 ring-1 ring-primary/50 shadow-sm' : 'hover:border-gray-400 bg-gray-50/50 dark:bg-gray-800/30'}`}>
										<input 
											type="radio" 
											className="sr-only"
											name="paymentMethod" 
											value="cod" 
											checked={paymentMethod === "cod"} 
											onChange={() => setPaymentMethod("cod")} 
										/>
										<span className="font-semibold text-gray-900 dark:text-gray-100">Cash on Delivery</span>
										<span className="text-xs text-gray-500 mt-1.5 font-medium">(Pay at door)</span>
									</label>
								</div>
							</div>

							<div className="border-t pt-6">
								<div className="flex justify-between items-center mb-6 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl">
									<span className="font-bold text-lg">Total Amount</span>
									<span className="font-black text-2xl text-primary dark:text-primary/80">₹{subtotal.toFixed(2)}</span>
								</div>
								
								<button
									onClick={handleCreateOrder}
									disabled={isOrdering || addresses.length === 0 || hasUnavailableItems}
									className="w-full py-4 bg-primary hover:bg-primary/90 text-white font-bold text-lg rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 disabled:shadow-none transition-all flex justify-center items-center gap-3 active:scale-[0.98]"
								>
									{isOrdering ? (
										<>
											<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
											Processing...
										</>
									) : (
										paymentMethod === "online" ? "Pay Securely" : "Place Order"
									)}
								</button>
								<p className="text-xs text-center text-gray-500 mt-4 px-4 leading-relaxed">
									By placing your order, you agree to our <a href="#" className="underline">Terms of Service</a> and <a href="#" className="underline">Privacy Policy</a>.
								</p>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
