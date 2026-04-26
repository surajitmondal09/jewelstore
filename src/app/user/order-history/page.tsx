"use client";

import React, { useEffect, useState } from "react";
import axios from "@/lib/axios";
import { useDataStore } from "@/store/Data";
import { 
  IconLoader2, 
  IconPackage, 
  IconReceipt, 
  IconChevronRight, 
  IconClock, 
  IconBox, 
  IconTruck, 
  IconCircleX 
} from "@tabler/icons-react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Item = {
  $id: string;
  productName: string;
  quantity: number;
  price: number;
};

type Order = {
  $id: string;
  items: Item[];
  totalAmount: number;
  shipping_charge: number;
  status: string;
  paymentStatus: string;
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

const STATUS_ICONS: Record<string, React.ReactNode> = {
  placed: <IconReceipt size={14} />,
  processing: <IconBox size={14} />,
  shipped: <IconTruck size={14} />,
  delivered: <IconPackage size={14} />,
  "cancelled by customer": <IconCircleX size={14} />,
  "cancelled by seller": <IconCircleX size={14} />,
  refunded: <IconCircleX size={14} />,
};

export default function CustomerOnlineOrderHistory() {
  const router = useRouter();
  const { userData } = useDataStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    if (!userData || !userData.$id) return;
    setLoading(true);
    try {
      const res = await axios.get<any>(`/api/user/online-orders?customerId=${userData.$id}`);
      setOrders(res.data.rows || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load your online orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userData?.$id) {
      fetchOrders();
    } else {
      // Small timeout to allow store to hydrate before showing "No orders"
      const timer = setTimeout(() => {
        if (!userData?.$id) setLoading(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [userData?.$id]);

  return (
    <div className="w-full flex flex-col gap-6 max-w-4xl mx-auto p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-2 mb-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <IconPackage className="text-primary w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          Order History
        </h1>
        <p className="text-sm text-muted-foreground mt-1">View and track all your previous orders</p>
      </div>

      {loading ? (
        <Card className="py-20 flex flex-col items-center justify-center text-muted-foreground border-dashed">
          <IconLoader2 className="animate-spin mb-4" size={40} />
          <p className="text-lg font-medium">Loading your orders...</p>
        </Card>
      ) : orders.length === 0 ? (
        <Card className="py-20 flex flex-col items-center justify-center text-muted-foreground bg-muted/20 border-dashed">
          <div className="p-5 bg-background rounded-full mb-4 border border-dashed">
            <IconBox size={48} className="text-muted-foreground/50" />
          </div>
          <p className="text-xl font-semibold text-foreground">No orders yet</p>
          <p className="text-sm mt-2 text-muted-foreground mb-6">Looks like you haven't made any purchases.</p>
          <Button onClick={() => router.push("/shop")} variant="default">
            Start Shopping
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card 
              key={order.$id} 
              onClick={() => router.push(`/user/order-history/${order.$id}`)}
              className="overflow-hidden cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-200 group"
            >
              <div className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                
                {/* Left Side: Order Info */}
                <div className="flex items-start gap-4">
                  <div className="bg-muted p-3 rounded-full shrink-0 hidden sm:block group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <IconReceipt size={24} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <p className="font-semibold text-base text-foreground">
                        Order <span className="text-muted-foreground font-normal">#{order.$id.substring(0, 10)}</span>
                      </p>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${STATUS_COLORS[order.status] || STATUS_COLORS['placed']}`}>
                        {STATUS_ICONS[order.status] || <IconReceipt size={14} />}
                        <span className="capitalize">{order.status}</span>
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <IconClock size={16} /> 
                        {new Date(order.$createdAt).toLocaleDateString(undefined, { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                      <span className="hidden sm:inline text-muted-foreground/30">•</span>
                      <div className="flex items-center gap-1.5">
                        <IconPackage size={16} /> 
                        {order.items.length} {order.items.length === 1 ? 'Item' : 'Items'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side: Price & Action */}
                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 mt-1 sm:mt-0 gap-4">
                  <div className="text-left sm:text-right">
                    <p className="font-bold text-lg text-foreground">₹{order.totalAmount.toFixed(2)}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 sm:justify-end">
                      <span className={`w-2 h-2 rounded-full ${order.paymentStatus === 'paid' ? 'bg-primary/80' : 'bg-yellow-500'}`}></span>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                        {order.paymentStatus}
                      </p>
                    </div>
                  </div>
                  <div className="bg-muted p-2 rounded-full text-muted-foreground group-hover:bg-primary group-hover:text-white transition-all">
                    <IconChevronRight size={20} />
                  </div>
                </div>

              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
