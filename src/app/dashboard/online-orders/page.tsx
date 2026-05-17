"use client";

import React, { useEffect, useState } from "react";
import axios from "@/lib/axios";
import { toast } from "react-toastify";
import {
  IconCheck,
  IconX,
  IconLoader2,
  IconTruck,
  IconPackage,
  IconDownload,
  IconChevronDown,
  IconChevronUp,
  IconMapPin,
  IconPhone,
  IconUser,
  IconReceipt,
  IconClock,
  IconBox,
  IconSearch
} from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";

type OrderItem = {
  $id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
};

type Customer = {
  $id: string;
  name: string;
  email: string;
  phone: string;
  state: string;
  district: string;
  block: string;
  village: string;
  pincode: string;
};
type addressData = {
  $id: string;
  customerId: string;
  location: string;
  city: string;
  pincode: string;
  state: string;
  phone: string;
};

type OnlineOrder = {
  $id: string;
  customerId: string;
  customer: Customer;
  addressData: addressData;
  address: string;
  itemId: string[];
  items: OrderItem[];
  totalAmount: number;
  shipping_charge: number;
  paymentId?: string;
  paymentStatus: "paid" | "unpaid";
  paymentType: "cod" | "upi" | "card" | "netbanking";
  status: "placed" | "processing" | "shipped" | "delivered" | "cancelled by customer" | "cancelled by seller" | "refunded";
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

export default function OnlineOrdersPage() {
  const [orders, setOrders] = useState<OnlineOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [shiprocketToken, setShiprocketToken] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [processingOrders, setProcessingOrders] = useState<Set<string>>(new Set());
  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OnlineOrder | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [shipmentData, setShipmentData] = useState({
    order_id: "",
    order_date: "",
    pickup_location: "Home",
    channel_id: "",
    billing_customer_name: "",
    billing_last_name: "",
    billing_email: "",
    billing_phone: "",
    billing_address: "",
    billing_city: "",
    billing_state: "",
    billing_pincode: "",
    billing_country: "",
    shipping_is_billing: true,
    order_items: [] as any[],
    payment_method: "COD",
    sub_total: 0,
    length: 5,
    breadth: 5,
    height: 5,
    weight: 0.5,
  });

  // Fetch Shiprocket token on mount
  useEffect(() => {
    const fetchShiprocketToken = async () => {
      try {
        const res = await axios.post<any>("/api/company/shiprocket-auth");
        setShiprocketToken((res.data as any).token);
        console.log("Shiprocket token obtained");
      } catch (err) {
        console.error("Failed to get Shiprocket token:", err);
        toast.error("Failed to authenticate with Shiprocket");
      }
    };

    fetchShiprocketToken();
  }, []);

  // Fetch orders
  const fetchOrders = async (page: number = 1, status: string = "all", search: string = "") => {
    setLoading(true);
    try {
      let query = status === "all" ? "" : `&status=${status}`;
      if (search) query += `&search=${encodeURIComponent(search)}`;

      const res = await axios.get<any>(`/api/company/online-orders?page=${page}&limit=20${query}`);
      setOrders((res.data as any).orders);
      setTotalPages((res.data as any).totalPages);
      setCurrentPage(page);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchOrders(1, selectedStatus, searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [selectedStatus, searchQuery]);

  const handleCreateShipment = async (order: OnlineOrder) => {
    if (!shiprocketToken) {
      toast.error("Shiprocket token not available");
      return;
    }

    setSelectedOrder(order);

    const nameParts = (order.customer?.name || "").trim().split(" ");
    const firstName = nameParts[0] || "Customer";
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "-";

    const d = new Date(order.$createdAt);
    const pad = (n: number) => n.toString().padStart(2, "0");
    const orderDateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;

    let phone = (order.addressData?.phone || "").replace(/\D/g, "");
    if (phone.length > 10) phone = phone.slice(-10);
    if (!phone) phone = "0000000000";

    // Pre-fill shipment data
    setShipmentData({
      order_id: `${order.$id}-${Math.floor(1000 + Math.random() * 9000)}`,
      order_date: orderDateStr,
      pickup_location: "Home",
      channel_id: "",
      billing_customer_name: firstName,
      billing_last_name: lastName,
      billing_email: order.customer?.email || "customer@example.com",
      billing_phone: phone,
      billing_address: order.addressData?.location || "No Address Provided",
      billing_city: order.addressData?.city || "Unknown",
      billing_state: order.addressData?.state || "Unknown",
      billing_pincode: order.addressData?.pincode || "000000",
      billing_country: "India",
      shipping_is_billing: true,
      order_items: order.items.map((item) => ({
        name: item.productName || "Product",
        sku: item.productId || "SKU",
        units: item.quantity || 1,
        selling_price: item.price || 0,
      })),
      payment_method: order.paymentType === "cod" ? "COD" : "Prepaid",
      sub_total: order.totalAmount || 0,
      length: 5,
      breadth: 5,
      height: 5,
      weight: 0.5,
    });

    setShowShipmentModal(true);
  };

  const handleSubmitShipment = async () => {
    if (!shiprocketToken || !selectedOrder) {
      toast.error("Missing required data");
      return;
    }

    setProcessingOrders((prev) => new Set(prev).add(selectedOrder.$id));

    try {
      const payload = { ...shipmentData };
      if (!payload.channel_id) {
        delete (payload as any).channel_id;
      }

      // Create order in Shiprocket
      const res = await axios.post<any>("/api/company/shiprocket-create-order", {
        token: shiprocketToken,
        order: payload,
      });

      if ((res.data as any).success) {
        toast.success("Shipment created successfully!");

        // Update order status
        await axios.patch<any>(`/api/company/online-orders`, {
          orderId: selectedOrder.$id,
          status: "processing",
          shiprocketOrderId: `${(res.data as any).order_id}`,
        });

        // Refresh orders
        fetchOrders(currentPage, selectedStatus);
        setShowShipmentModal(false);
      }
    } catch (err: any) {
      console.error("Failed to create shipment:", err);
      const errorData = err.response?.data;
      
      let errorMsg = errorData?.error || err.message || "Failed to create shipment";
      let detailsStr = "";

      if (errorData?.details) {
         if (typeof errorData.details === 'object') {
             detailsStr = JSON.stringify(errorData.details);
         } else {
             detailsStr = String(errorData.details);
         }
      }

      toast.error(detailsStr ? `${errorMsg}: ${detailsStr}` : errorMsg, { autoClose: 10000 });
    } finally {
      setProcessingOrders((prev) => {
        const updated = new Set(prev);
        updated.delete(selectedOrder.$id);
        return updated;
      });
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    const processing = new Set(processingOrders);
    processing.add(orderId);
    setProcessingOrders(processing);

    try {
      await axios.patch<any>(`/api/company/online-orders`, {
        orderId,
        status: newStatus,
      });
      toast.success("Order status updated");
      fetchOrders(currentPage, selectedStatus);
    } catch (err) {
      console.error("Failed to update status:", err);
      toast.error("Failed to update status");
    } finally {
      const updated = new Set(processingOrders);
      updated.delete(orderId);
      setProcessingOrders(updated);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <IconBox className="text-primary w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            Online Orders
          </h1>
          <p className="text-sm text-muted-foreground mt-2">Manage, process, and ship your customer orders</p>
        </div>
        <div className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold flex items-center gap-2 border border-primary/20">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
          </span>
          {orders.length} Active Orders
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-2">
        {/* Status Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide w-full md:w-auto">
          {["all", "placed", "processing", "shipped", "delivered", "cancelled by customer", "refunded", "cancelled by seller"].map(
            (status) => (
              <button
                key={status}
                onClick={() => {
                  setSelectedStatus(status);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 border ${selectedStatus === status
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-background text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground"
                  }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            )
          )}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72 shrink-0">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search by phone or Order ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 rounded-full bg-background/50 border-muted focus-visible:ring-primary/20"
          />
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {loading ? (
          <Card className="py-16 flex flex-col items-center justify-center text-muted-foreground">
            <IconLoader2 className="animate-spin mb-4" size={48} />
            <p className="text-lg font-medium">Loading your orders...</p>
          </Card>
        ) : orders.length === 0 ? (
          <Card className="py-20 flex flex-col items-center justify-center text-muted-foreground bg-muted/20 border-dashed">
            <div className="p-4 bg-background rounded-full mb-4 border border-dashed">
              <IconPackage size={48} className="text-muted-foreground/50" />
            </div>
            <p className="text-xl font-semibold text-foreground">No orders found</p>
            <p className="text-sm mt-2 text-muted-foreground">Try changing the filter or wait for new orders.</p>
          </Card>
        ) : (
          orders.map((order) => (
            <Card key={order.$id} className={`overflow-hidden transition-all duration-200 border ${expandedOrder === order.$id ? 'ring-2 ring-primary/20 shadow-md' : 'hover:shadow-sm'}`}>
              {/* Order Header */}
              <div
                onClick={() => setExpandedOrder(expandedOrder === order.$id ? null : order.$id)}
                className="p-4 sm:p-6 cursor-pointer bg-card hover:bg-accent/30 transition-colors"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="bg-primary/10 p-3 rounded-full hidden sm:block">
                      <IconReceipt className="text-primary w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <p className="font-semibold text-lg text-foreground">Order #{order.$id.substring(0, 8)}</p>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[order.status] || STATUS_COLORS['placed']}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5"><IconUser size={16} /> <span className="font-medium text-foreground">{order.customer?.name || "Unknown Customer"}</span></div>
                        <span className="hidden sm:inline text-muted-foreground/30">•</span>
                        <div className="flex items-center gap-1.5"><IconClock size={16} /> {new Date(order.$createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between w-full sm:w-auto sm:flex-col sm:items-end gap-2 sm:gap-1.5 pt-2 sm:pt-0 border-t sm:border-0">
                    <div className="text-left sm:text-right">
                      <p className="font-bold text-xl text-foreground">₹{order.totalAmount.toFixed(2)}</p>
                      <div className="flex items-center gap-1.5 mt-1 justify-start sm:justify-end">
                        <span className={`w-2 h-2 rounded-full ${order.paymentStatus === 'paid' ? 'bg-primary/80' : 'bg-yellow-500'}`}></span>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{order.paymentStatus} ({order.paymentType})</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="sm:mt-2 -mr-2 text-muted-foreground hover:text-foreground hidden sm:inline-flex">
                      {expandedOrder === order.$id ? <IconChevronUp size={20} /> : <IconChevronDown size={20} />}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedOrder === order.$id && (
                <div className="border-t bg-muted/10 p-4 sm:p-6 space-y-6 animate-in slide-in-from-top-2 duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Customer Details */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                        <IconMapPin size={18} className="text-primary" /> Delivery Details
                      </h3>
                      <Card className="p-4 shadow-none bg-background border-muted">
                        <div className="space-y-3 text-sm">
                          <div className="flex items-center gap-3 font-medium text-foreground">
                            <div className="bg-muted p-1.5 rounded-md"><IconUser size={16} className="text-muted-foreground" /></div>
                            {order.customer?.name || "Unknown Customer"}
                          </div>
                          <div className="flex items-center gap-3 text-muted-foreground">
                            <div className="bg-muted p-1.5 rounded-md"><IconPhone size={16} /></div>
                            {order.addressData?.phone || "N/A"}
                          </div>
                          <div className="flex items-start gap-3 text-muted-foreground mt-3 pt-3 border-t">
                            <div className="bg-muted p-1.5 rounded-md shrink-0"><IconMapPin size={16} /></div>
                            <div className="space-y-1">
                              <p className="font-medium text-foreground">{order.addressData?.location || "N/A"}</p>
                              <p>{order.addressData?.city || "N/A"}, {order.addressData?.state || "N/A"}</p>
                              <p>PIN: {order.addressData?.pincode || "N/A"}</p>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>

                    {/* Order Summary */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                        <IconReceipt size={18} className="text-primary" /> Payment Summary
                      </h3>
                      <Card className="p-4 shadow-none bg-background border-muted">
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between text-muted-foreground">
                            <span>Subtotal</span>
                            <span>₹{(order.totalAmount - order.shipping_charge).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-muted-foreground">
                            <span>Shipping</span>
                            <span>₹{order.shipping_charge.toFixed(2)}</span>
                          </div>
                          <div className="border-t pt-3 mt-1 flex justify-between font-bold text-base text-foreground">
                            <span>Total Amount</span>
                            <span className="text-primary">₹{order.totalAmount.toFixed(2)}</span>
                          </div>
                          {order.awb && (
                            <div className="pt-4 mt-2 border-t">
                              <div className="bg-primary/5 border border-primary/20 text-primary p-3 rounded-lg flex items-center justify-between text-sm">
                                <span className="font-medium">Tracking AWB</span>
                                <span className="font-mono font-bold tracking-wider">{order.awb}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </Card>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                      <IconBox size={18} className="text-primary" /> Order Items ({order.items.length})
                    </h3>
                    <div className="rounded-lg border bg-background overflow-hidden">
                      {order.items.map((item, idx) => (
                        <div
                          key={item.$id}
                          className={`p-4 flex justify-between items-center sm:text-sm text-xs ${idx !== order.items.length - 1 ? 'border-b' : ''} hover:bg-muted/50 transition-colors`}
                        >
                          <div className="flex flex-col gap-1">
                            <p className="font-semibold text-foreground">{item.productName}</p>
                            <p className="text-muted-foreground">
                              Qty: {item.quantity} × ₹{item.price.toFixed(2)}
                            </p>
                          </div>
                          <div className="font-bold text-foreground bg-muted px-3 py-1.5 rounded-md">
                            ₹{(item.quantity * item.price).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3 pt-4 border-t">
                    {order.status === "placed" && (
                      <>
                        <Button
                          onClick={() => handleCreateShipment(order)}
                          disabled={processingOrders.has(order.$id)}
                          className="flex-1 sm:flex-none shadow-sm"
                        >
                          {processingOrders.has(order.$id) ? (
                            <IconLoader2 size={18} className="animate-spin mr-2" />
                          ) : (
                            <IconTruck size={18} className="mr-2" />
                          )}
                          Create Shipment
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleUpdateStatus(order.$id, "cancelled by seller")}
                          disabled={processingOrders.has(order.$id)}
                          className="flex-1 sm:flex-none shadow-sm"
                        >
                          Cancel Order
                        </Button>
                      </>
                    )}

                    {order.status === "processing" && (
                      <Button
                        onClick={() => handleUpdateStatus(order.$id, "shipped")}
                        disabled={processingOrders.has(order.$id)}
                        className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
                      >
                        {processingOrders.has(order.$id) ? (
                          <IconLoader2 size={18} className="animate-spin mr-2" />
                        ) : (
                          <IconPackage size={18} className="mr-2" />
                        )}
                        Mark as Shipped
                      </Button>
                    )}

                    {order.status === "shipped" && (
                      <Button
                        onClick={() => handleUpdateStatus(order.$id, "delivered")}
                        disabled={processingOrders.has(order.$id)}
                        className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white shadow-sm"
                      >
                        {processingOrders.has(order.$id) ? (
                          <IconLoader2 size={18} className="animate-spin mr-2" />
                        ) : (
                          <IconCheck size={18} className="mr-2" />
                        )}
                        Mark as Delivered
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card className="flex flex-col sm:flex-row justify-between items-center sm:gap-4 gap-4 mt-4 p-4 shadow-sm border-muted">
          <p className="text-sm font-medium text-muted-foreground">
            Page <span className="text-foreground font-bold">{currentPage}</span> of <span className="text-foreground font-bold">{totalPages}</span>
          </p>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              className="flex-1 sm:flex-none"
              onClick={() => fetchOrders(currentPage - 1, selectedStatus, searchQuery)}
              disabled={currentPage <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              className="flex-1 sm:flex-none"
              onClick={() => fetchOrders(currentPage + 1, selectedStatus, searchQuery)}
              disabled={currentPage >= totalPages}
            >
              Next
            </Button>
          </div>
        </Card>
      )}

      {/* Shipment Modal */}
      {showShipmentModal && selectedOrder && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6 animate-in fade-in duration-200">
          <Card className="max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border-muted">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30 px-6 py-4">
              <CardTitle className="text-xl flex items-center gap-2">
                <IconTruck className="text-primary" />
                Create Shiprocket Shipment
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowShipmentModal(false)} className="-mr-2 text-muted-foreground hover:text-foreground">
                <IconX size={20} />
              </Button>
            </CardHeader>
            <CardContent className="overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label className="text-sm font-semibold flex items-center gap-2 text-foreground">
                    Pickup Location Name
                  </Label>
                  <Input
                    value={shipmentData.pickup_location}
                    onChange={(e) => setShipmentData({ ...shipmentData, pickup_location: e.target.value })}
                    placeholder="e.g., Primary"
                    className="bg-muted/50 border-muted"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-semibold flex items-center gap-2 text-foreground">
                    Channel ID <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
                  </Label>
                  <Input
                    value={shipmentData.channel_id}
                    onChange={(e) => setShipmentData({ ...shipmentData, channel_id: e.target.value })}
                    placeholder="e.g., 123456"
                    className="bg-muted/50 border-muted"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground border-b pb-2">
                  <IconPackage size={16} className="text-primary" /> Package Dimensions
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">Length (cm)</Label>
                    <Input
                      type="number"
                      value={shipmentData.length}
                      onChange={(e) => setShipmentData({ ...shipmentData, length: parseFloat(e.target.value) })}
                      className="bg-muted/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">Breadth (cm)</Label>
                    <Input
                      type="number"
                      value={shipmentData.breadth}
                      onChange={(e) => setShipmentData({ ...shipmentData, breadth: parseFloat(e.target.value) })}
                      className="bg-muted/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">Height (cm)</Label>
                    <Input
                      type="number"
                      value={shipmentData.height}
                      onChange={(e) => setShipmentData({ ...shipmentData, height: parseFloat(e.target.value) })}
                      className="bg-muted/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">Weight (kg)</Label>
                    <Input
                      type="number"
                      value={shipmentData.weight}
                      onChange={(e) => setShipmentData({ ...shipmentData, weight: parseFloat(e.target.value) })}
                      className="bg-muted/50"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground border-b pb-2">
                  <IconBox size={16} className="text-primary" /> Order Items
                </h3>
                <div className="space-y-2 bg-muted/30 p-4 rounded-lg border border-muted/50">
                  {shipmentData.order_items.map((item, idx) => (
                    <div key={idx} className={`flex justify-between items-center text-sm ${idx !== shipmentData.order_items.length - 1 ? 'border-b border-muted/50 pb-2 mb-2' : ''}`}>
                      <p className="font-medium text-foreground">{item.name}</p>
                      <p className="text-muted-foreground font-medium bg-background px-2 py-1 rounded-md border border-muted/50">
                        {item.units} × ₹{item.selling_price.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col-reverse sm:flex-row bg-muted/30 border-t px-6 py-4 gap-3 sm:justify-end rounded-b-xl">
              <Button
                variant="outline"
                onClick={() => setShowShipmentModal(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitShipment}
                disabled={processingOrders.has(selectedOrder.$id)}
                className="w-full sm:w-auto shadow-sm"
              >
                {processingOrders.has(selectedOrder.$id) ? (
                  <>
                    <IconLoader2 size={18} className="animate-spin mr-2" />
                    Creating Shipment...
                  </>
                ) : (
                  <>
                    <IconDownload size={18} className="mr-2" />
                    Create Shipment
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
