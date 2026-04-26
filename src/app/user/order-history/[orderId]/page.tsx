"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "@/lib/axios";
import { toast } from "react-toastify";
import Image from "next/image";
import { 
  IconLoader2, 
  IconTruck, 
  IconArrowLeft, 
  IconX, 
  IconPackage, 
  IconReceipt, 
  IconMapPin, 
  IconCreditCard,
  IconClock,
  IconCircleCheck
} from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type Item = {
  $id: string;
  productName: string;
  quantity: number;
  price: number;
  productId?: string;
  imageUrl?: string;
};

type Customer = {
  $id: string;
  name: string;
  email: string;
  phone: string;
  state?: string;
  district?: string;
  block?: string;
  village?: string;
  pincode?: string;
};

type Address = {
  $id: string;
  customerId: string;
  location: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
};

type Order = {
  $id: string;
  customerId: string;
  customer: Customer;
  address?: Address | string;
  items: Item[];
  totalAmount: number;
  shipping_charge: number;
  paymentId?: string;
  paymentStatus: "paid" | "unpaid";
  paymentType: string;
  status: string;
  shiprocketOrderId?: string;
  awb?: string;
  $createdAt: string;
};

const STATUS_COLORS: Record<string, string> = {
  placed: "bg-primary/20 text-primary dark:bg-primary/30 dark:text-primary/80 border border-primary/20 dark:border-primary/50",
  processing: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800",
  shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800",
  delivered: "bg-primary/20 text-primary dark:bg-primary/30 dark:text-primary/80 border border-primary/20 dark:border-primary/50",
  "cancelled by customer": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800",
  "cancelled by seller": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800",
  refunded: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800",
};

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.orderId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState<any | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const fetchOrder = async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const res = await axios.post<any>("/api/user/online-orders/order", { orderId });
      if (res.data && res.data.$id) {
        setOrder(res.data);
      } else {
        setOrder(null);
        toast.error("Invalid order data received");
      }
    } catch (err: any) {
      console.error("Error fetching order:", err);
      setOrder(null);
      const errorMsg = err?.response?.data?.error || "Failed to load order details";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const handleTrack = async () => {
    if (!order?.awb && !order?.shiprocketOrderId) {
      toast.error("No tracking info available");
      return;
    }

    setTrackingLoading(true);
    setTracking(null);
    try {
      const trackingId = (order.awb || order.shiprocketOrderId) as string;
      const res = await axios.get<any>(`/api/company/shiprocket-track?orderId=${encodeURIComponent(trackingId)}`);
      if (res.data?.success) {
        setTracking(res.data.data);
      } else {
        toast.error("Failed to fetch tracking info");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch tracking info");
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!order || order.status !== "placed") {
      toast.error("Only placed orders can be cancelled");
      return;
    }

    if (!confirm("Are you sure you want to cancel this order?")) return;

    setCancelling(true);
    try {
      await axios.patch<any>(`/api/company/online-orders`, {
        orderId: order.$id,
        status: "cancelled by customer",
      });
      toast.success("Order cancelled successfully");
      setOrder({ ...order, status: "cancelled by customer" });
    } catch (err) {
      console.error(err);
      toast.error("Failed to cancel order");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full flex flex-col gap-6 max-w-4xl mx-auto p-4 sm:p-6 md:p-8 min-h-[50vh] items-center justify-center">
        <IconLoader2 className="animate-spin text-primary" size={48} />
        <p className="text-lg font-medium text-muted-foreground mt-4">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="w-full flex flex-col max-w-4xl mx-auto p-4 sm:p-6 md:p-8 items-center justify-center min-h-[50vh]">
        <Card className="p-8 flex flex-col items-center justify-center text-center bg-muted/20 border-dashed w-full">
          <div className="p-4 bg-background rounded-full mb-4 border border-dashed">
            <IconX size={48} className="text-muted-foreground/50" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Order Not Found</h2>
          <p className="text-muted-foreground mb-6">We couldn't find the details for this order. It may have been removed or the ID is incorrect.</p>
          <Button onClick={() => router.back()} variant="outline" className="gap-2">
            <IconArrowLeft size={16} /> Go Back
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6 max-w-4xl mx-auto p-4 sm:p-6 md:p-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full bg-muted/50 hover:bg-muted">
            <IconArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
              Order Details
            </h1>
            <p className="text-sm text-muted-foreground font-mono mt-1 flex items-center gap-2">
              ID: {order.$id}
            </p>
          </div>
        </div>
        
        {/* Cancel Action */}
        {order.status === "placed" && (
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={cancelling}
            className="w-full sm:w-auto shadow-sm"
          >
            {cancelling ? (
              <><IconLoader2 size={16} className="animate-spin mr-2" /> Cancelling...</>
            ) : (
              <><IconX size={16} className="mr-2" /> Cancel Order</>
            )}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Order Items */}
          <Card className="shadow-sm border-muted">
            <CardHeader className="bg-muted/20 border-b pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <IconPackage className="text-primary w-5 h-5" /> 
                Items Ordered <span className="text-muted-foreground text-sm font-normal">({order.items.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-muted/50">
              {order.items.map((item) => (
                <div key={item.$id} className="p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 hover:bg-muted/10 transition-colors">
                  <div className="flex items-start sm:items-center gap-4 w-full">
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-md overflow-hidden bg-muted/30 border border-muted/50 shrink-0">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.productName}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/50">
                          <IconPackage size={24} />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5 flex-1">
                      <p className="font-semibold text-foreground text-sm sm:text-base line-clamp-2">{item.productName}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground bg-muted/50 w-max px-2 py-0.5 rounded-md font-medium">
                        Qty: {item.quantity} × ₹{item.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <p className="font-bold text-base sm:text-lg text-foreground bg-background border px-3 py-1.5 rounded-lg shadow-sm self-end sm:self-auto sm:ml-4 shrink-0 mt-2 sm:mt-0">
                    ₹{(item.quantity * item.price).toFixed(2)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Tracking Section */}
          {(order.awb || order.shiprocketOrderId) && (
            <Card className="shadow-sm border-muted overflow-hidden">
              <CardHeader className="bg-muted/20 border-b pb-4 flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <IconTruck className="text-primary w-5 h-5" /> 
                  Tracking Information
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTrack}
                  disabled={trackingLoading}
                  className="bg-background shadow-sm"
                >
                  {trackingLoading ? <IconLoader2 size={16} className="animate-spin mr-2" /> : <IconMapPin size={16} className="mr-2"/>}
                  {trackingLoading ? "Tracking..." : "Track Package"}
                </Button>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {order.awb && (
                    <div className="bg-background border rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1 font-semibold uppercase tracking-wider">AWB Number</p>
                      <p className="font-mono font-bold text-base tracking-wide bg-primary/10 text-primary w-max px-2 py-0.5 rounded">{order.awb}</p>
                    </div>
                  )}
                  {order.shiprocketOrderId && (
                    <div className="bg-background border rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1 font-semibold uppercase tracking-wider">Shiprocket ID</p>
                      <p className="font-mono font-bold text-foreground text-base tracking-wide bg-muted w-max px-2 py-0.5 rounded">{order.shiprocketOrderId}</p>
                    </div>
                  )}
                </div>

                {/* Tracking Details Results */}
                {tracking && (
                  <div className="mt-6 pt-6 border-t border-dashed border-muted-foreground/30 animate-in slide-in-from-top-4 duration-300">
                    <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/70 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary/80"></span>
                      </span>
                      Live Tracking Updates
                    </h3>
                    <div className="space-y-0 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-linear-to-b before:from-transparent before:via-border before:to-transparent">
                      {Array.isArray(tracking) ? (
                        tracking.map((event: any, idx: number) => (
                          <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active py-4">
                            {/* Icon */}
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-muted text-muted-foreground shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                              <IconCircleCheck size={18} />
                            </div>
                            {/* Card */}
                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-background p-4 rounded border shadow-sm group-hover:border-primary/30 transition-colors">
                              <div className="flex flex-col sm:flex-row justify-between items-start mb-1 gap-2">
                                <p className="font-bold text-foreground text-sm">{event.status || event.title}</p>
                                <time className="text-xs text-muted-foreground font-medium flex items-center gap-1 bg-muted px-2 py-0.5 rounded-full"><IconClock size={12}/> {event.timestamp || event.date}</time>
                              </div>
                              {event.location && <p className="text-sm text-muted-foreground mt-2 flex items-start gap-1"><IconMapPin size={14} className="mt-0.5 shrink-0 text-primary/70"/> {event.location}</p>}
                            </div>
                          </div>
                        ))
                      ) : typeof tracking === "object" ? (
                        <pre className="whitespace-pre-wrap text-xs bg-muted/50 border p-4 rounded-lg overflow-auto max-h-60 font-mono">
                          {JSON.stringify(tracking, null, 2)}
                        </pre>
                      ) : (
                        <p className="text-sm bg-muted/50 p-4 rounded border">{JSON.stringify(tracking)}</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          
          {/* Order Status & Payment Info */}
          <Card className="shadow-sm border-muted">
            <CardHeader className="bg-muted/20 border-b pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <IconReceipt className="text-primary w-5 h-5" /> 
                Order Info
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="flex justify-between items-center pb-4 border-b border-dashed">
                <span className="text-sm font-medium text-muted-foreground">Order Status</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${STATUS_COLORS[order.status] || STATUS_COLORS['placed']}`}>
                  {order.status}
                </span>
              </div>
              
              <div className="flex justify-between items-center pb-4 border-b border-dashed">
                <span className="text-sm font-medium text-muted-foreground">Order Date</span>
                <span className="text-sm font-semibold text-foreground">
                  {new Date(order.$createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">Payment</span>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${order.paymentStatus === 'paid' ? 'bg-primary/80' : 'bg-yellow-500'}`}></span>
                  <span className="text-sm font-bold uppercase text-foreground">{order.paymentStatus}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Address */}
          <Card className="shadow-sm border-muted">
            <CardHeader className="bg-muted/20 border-b pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <IconMapPin className="text-primary w-5 h-5" /> 
                Delivery Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="bg-muted/30 p-4 rounded-lg border border-muted/50 space-y-3 text-sm">
                <div className="flex items-center gap-3 border-b border-dashed pb-3">
                  <div className="bg-background p-2 rounded shadow-sm border"><IconCreditCard size={16} className="text-muted-foreground"/></div>
                  <div>
                    <p className="font-bold text-foreground text-base">{order.customer?.name || 'N/A'}</p>
                    <p className="text-muted-foreground font-mono">
                      {typeof order.address === 'object' && order.address?.phone 
                        ? order.address.phone 
                        : order.customer?.phone || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 pt-1">
                  <div className="bg-background p-2 rounded shadow-sm border shrink-0 mt-0.5"><IconMapPin size={16} className="text-muted-foreground"/></div>
                  <div className="text-muted-foreground leading-relaxed space-y-1">
                    {typeof order.address === 'object' && order.address ? (
                      <>
                        {order.address.location && <p className="text-foreground font-medium">{order.address.location}</p>}
                        {order.address.city && <p>{order.address.city}</p>}
                        {(order.address.state || order.address.pincode) && (
                          <p className="font-medium text-foreground">
                            {order.address.state || ''} {order.address.pincode && <span className="text-primary">{order.address.pincode}</span>}
                          </p>
                        )}
                      </>
                    ) : typeof order.address === 'string' && order.address ? (
                      <>
                        <p className="text-foreground font-medium whitespace-pre-wrap">{order.address}</p>
                      </>
                    ) : (
                      <>
                        {order.customer?.block || order.customer?.village ? (
                          <p>{order.customer?.block}{order.customer?.block && order.customer?.village ? ', ' : ''}{order.customer?.village}</p>
                        ) : null}
                        {order.customer?.state || order.customer?.pincode ? (
                          <p className="font-medium text-foreground">
                            {order.customer?.state || ''} {order.customer?.pincode && <span className="text-primary">{order.customer?.pincode}</span>}
                          </p>
                        ) : null}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card className="shadow-sm border-primary/20 bg-primary/5">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                 Payment Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-medium">Subtotal</span>
                <span className="font-semibold text-foreground">₹{(order.totalAmount - order.shipping_charge).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-medium">Shipping Charge</span>
                <span className="font-semibold text-foreground">₹{order.shipping_charge.toFixed(2)}</span>
              </div>
              <div className="border-t border-primary/20 pt-4 flex justify-between items-center">
                <span className="font-bold text-foreground">Total Amount</span>
                <span className="text-2xl font-black text-primary">₹{order.totalAmount.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}