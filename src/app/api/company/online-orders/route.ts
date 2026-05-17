import { authenticateServer } from "@/lib/serverAuth";
import { db, onlineOrderTable, customerTable, itemTable, productTable, addressTable, notificationTable } from "@/models/name";
import { tablesDB } from "@/models/server/config";
import { NextResponse, NextRequest } from "next/server";
import { Query } from "appwrite";
import { ID } from "node-appwrite";

const enrichOrder = async (order: any) => {
  try {
    let customer = null;
    let addressData = null;

    // 1. Handle Customer
    if (order.customerId && order.customerId.startsWith("guest_")) {
      const email = order.customerId.replace("guest_", "");
      try {
        const guestDetails = JSON.parse(order.address);
        customer = {
          $id: order.customerId,
          name: guestDetails.name || "Guest User",
          email: guestDetails.email || email,
          phone: guestDetails.phone || "",
        };
      } catch (e) {
        customer = { $id: order.customerId, name: "Guest User", email, phone: "" };
      }
    } else {
      customer = await tablesDB.getRow(db, customerTable, order.customerId).catch(() => null);
    }

    // 2. Handle Address
    if (order.address && typeof order.address === "string" && order.address.trim().startsWith("{")) {
      try {
        const parsedAddress = JSON.parse(order.address);
        addressData = {
          $id: "parsed_address",
          customerId: order.customerId,
          location: parsedAddress.location || parsedAddress.address || "Unknown Address",
          city: parsedAddress.city || "",
          state: parsedAddress.state || "",
          pincode: parsedAddress.pincode || "",
          phone: parsedAddress.phone || "",
        };
      } catch (e) {
        addressData = { $id: "error_address", location: "Invalid Address Format", city: "", state: "", pincode: "", phone: "" };
      }
    } else if (order.address) {
      addressData = await tablesDB.getRow(db, addressTable, order.address).catch(() => null);
    }

    // 3. Handle Items
    const itemDetails = await Promise.all(
      (order.itemId || []).map((id: string) => tablesDB.getRow(db, itemTable, id).catch(() => null))
    );
    return {
      ...order,
      customer: customer || {},
      items: itemDetails.filter(Boolean),
      addressData: addressData || {},
    };
  } catch (err) {
    console.error(`Error enriching order ${order.$id}:`, err);
    return { ...order, customer: {}, items: [], addressData: {} };
  }
};

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const search = url.searchParams.get("search");
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "20", 10);
    const offset = (page - 1) * limit;

    if (search) {
      let queries: any[] = [Query.limit(1000), Query.orderDesc("$createdAt")];
      if (status && status !== "all") {
        queries.push(Query.equal("status", status));
      }
      
      const allOrders = await tablesDB.listRows(db, onlineOrderTable, queries);
      const enrichedAll = await Promise.all(allOrders.rows.map(enrichOrder));

      const searchLower = search.toLowerCase();
      const matchedOrders = enrichedAll.filter((order) => {
        const orderIdMatch = order.$id.toLowerCase().includes(searchLower);
        const phoneMatch = order.addressData?.phone?.includes(searchLower) || order.customer?.phone?.includes(searchLower);
        return orderIdMatch || phoneMatch;
      });

      const paginatedOrders = matchedOrders.slice(offset, offset + limit);

      return NextResponse.json({
        orders: paginatedOrders,
        total: matchedOrders.length,
        page,
        limit,
        totalPages: Math.ceil(matchedOrders.length / limit) || 1,
      });
    }

    let queries: any[] = [Query.limit(limit), Query.offset(offset), Query.orderDesc("$createdAt")];

    if (status && status !== "all") {
      queries.push(Query.equal("status", status));
    }

    const orders = await tablesDB.listRows(db, onlineOrderTable, queries);
    const enrichedOrders = await Promise.all(orders.rows.map(enrichOrder));

    return NextResponse.json({
      orders: enrichedOrders,
      total: orders.total,
      page,
      limit,
      totalPages: Math.ceil(orders.total / limit) || 1,
    });
  } catch (error) {
    console.error("Error fetching online orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
        const auth = await authenticateServer(request);
        if (!auth || !auth.user.labels?.includes("owner")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { orderId, status, shiprocketOrderId, awb } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (shiprocketOrderId) updateData.shiprocketOrderId = shiprocketOrderId;
    if (awb) updateData.awb = awb;

    const updatedOrder = await tablesDB.updateRow(
      db,
      onlineOrderTable,
      orderId,
      updateData
    );

    if (status && updatedOrder.customerId) {
      try {
        await tablesDB.updateRow(db, customerTable, updatedOrder.customerId, {
          hasUnreadNotification: true
        });
        await tablesDB.createRow(db, notificationTable, ID.unique(), {
          userId: updatedOrder.customerId,
          notification: `Update! Your order (#${orderId.slice(-6).toUpperCase()}) status is now: ${status}.`
        });
      } catch (notifErr) {
        console.error("Failed to create order status update notification:", notifErr);
      }
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
