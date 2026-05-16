import { authenticateServer } from "@/lib/serverAuth";
import { db, customerTable, onlineOrderTable, addressTable, itemTable, productTable, notificationTable } from "@/models/name";
import { tablesDB as adminTablesDB } from "@/models/server/config";
import { NextRequest, NextResponse } from "next/server";
import { ID } from "node-appwrite";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { customerId, addressID, itemId, shipping_charge, paymentType, isDirect, isGuest, guestEmail, guestDetails } = data;

    let tablesDBToUse = null;
    if (isGuest) {
      tablesDBToUse = adminTablesDB;
    } else {
      const auth = await authenticateServer(request);
      if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      tablesDBToUse = auth.dbClient;
    }

    if (!isGuest && (!customerId || !addressID)) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    if (isGuest && (!guestEmail || !guestDetails)) {
      return NextResponse.json({ error: "Invalid guest details" }, { status: 400 });
    }
    if (!itemId || !Array.isArray(itemId) || itemId.length === 0) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // validate customer
    let customer = null;
    if (!isGuest) {
      customer = await tablesDBToUse.getRow(db, customerTable, customerId);
      if (!customer) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 });
      }
    }

    // Calculate total amount server-side to prevent price tampering
    let serverTotalAmount = 0;
    for (const id of itemId) {
        try {
            const item = await tablesDBToUse.getRow(db, itemTable, id);
            if (!item) {
                return NextResponse.json({ error: "Cart item not found" }, { status: 400 });
            }
            if (item && item.productId) {
                const product = await tablesDBToUse.getRow(db, productTable, item.productId);
                if (product && typeof product.finalPrice === 'number') {
                    serverTotalAmount += product.finalPrice * item.quantity;
                    // Sync the snapshot item with the latest price at checkout to ensure order history uses the current live price
                    await tablesDBToUse.updateRow(db, itemTable, id, { 
                        price: product.finalPrice,
                        productName: product.productName
                    });
                } else {
                    return NextResponse.json({ error: "One or more products in your cart are no longer available" }, { status: 400 });
                }
            }
        } catch (err) {
            console.error(`Error fetching item/product details for item ID ${id}:`, err);
            return NextResponse.json({ error: "Internal server error during validation" }, { status: 500 });
        }
    }

    if (serverTotalAmount <= 0) {
        return NextResponse.json({ error: "Invalid order total" }, { status: 400 });
    }

    // create online order row
    const orderCustomerId = isGuest ? `guest_${guestEmail}` : customerId;
    const orderAddress = isGuest ? JSON.stringify(guestDetails) : addressID;

    const onlineOrder = await tablesDBToUse.createRow(db, onlineOrderTable, ID.unique(), {
      customerId: orderCustomerId,
      address: orderAddress,
      itemId,
      totalAmount: serverTotalAmount,
      shipping_charge: shipping_charge || 0,
      paymentType: paymentType || "cod",
      paymentStatus: "unpaid",
      status: "placed",
    });

    if (!isGuest && customer) {
      // clear customer's cart and push order id into orderHistory if available
      const currentOrderHistory = customer.orderHistory ? [...customer.orderHistory, onlineOrder.$id] : [onlineOrder.$id];

      const updateData: any = {
        orderHistory: currentOrderHistory,
        hasUnreadNotification: true, // Show unseen dot in Navbar
      };

      if (!isDirect) {
        updateData.cartId = [];
      }

      await tablesDBToUse.updateRow(db, customerTable, customerId, updateData);

      // Create a new notification
      try {
        await tablesDBToUse.createRow(db, notificationTable, ID.unique(), {
          userId: customerId,
          notification: `Order Confirmed! Your order (#${onlineOrder.$id.slice(-6).toUpperCase()}) has been successfully placed.`,
        });
      } catch (notifConfErr) {
        console.error("Failed to create placement notification:", notifConfErr);
      }
    }
    
    return NextResponse.json(onlineOrder);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error }, { status: 500 });
  }
}
