import { authenticateServer } from "@/lib/serverAuth";
import { tablesDB as adminTablesDB } from "@/models/server/config";
import { NextRequest, NextResponse } from "next/server";
import { db, onlineOrderTable, customerTable, customerPaymentTable } from "@/models/name";
import { Query } from "node-appwrite";

export async function POST(request: NextRequest) {
    try {
        const auth = await authenticateServer(request);
        if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const tablesDB = auth.dbClient;

        const { email } = await request.json();
        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        const userId = auth.user.$id;
        const guestId = `guest_${email}`;

        // 1. Find all guest orders
        const guestOrders = await adminTablesDB.listRows(db, onlineOrderTable, [
            Query.equal("customerId", guestId)
        ]);

        if (guestOrders.rows.length === 0) {
            return NextResponse.json({ success: true, message: "No guest orders found" });
        }

        // 2. Fetch customer to update orderHistory
        const customer = await tablesDB.getRow(db, customerTable, userId);
        if (!customer) {
            return NextResponse.json({ error: "Customer not found" }, { status: 404 });
        }

        const newOrderIds = guestOrders.rows.map((doc: any) => doc.$id);
        const currentOrderHistory = customer.orderHistory || [];
        
        // Filter out any that might already be there (unlikely but safe)
        const uniqueOrderHistory = Array.from(new Set([...currentOrderHistory, ...newOrderIds]));

        // 3. Find guest payments (optional, if they exist)
        const guestPayments = await adminTablesDB.listRows(db, customerPaymentTable, [
            Query.equal("customerId", guestId)
        ]);

        const newPaymentIds = guestPayments.rows.map((doc: any) => doc.$id);
        const currentPaymentHistory = customer.paymentHistory || [];
        const uniquePaymentHistory = Array.from(new Set([...currentPaymentHistory, ...newPaymentIds]));

        // 4. Update the orders and payments to belong to the new user ID
        const orderPromises = guestOrders.rows.map((doc: any) => 
            adminTablesDB.updateRow(db, onlineOrderTable, doc.$id, {
                customerId: userId
            })
        );
        
        const paymentPromises = guestPayments.rows.map((doc: any) => 
            adminTablesDB.updateRow(db, customerPaymentTable, doc.$id, {
                customerId: userId
            })
        );

        await Promise.allSettled([...orderPromises, ...paymentPromises]);

        // 5. Update customer record with the claimed orders
        await tablesDB.updateRow(db, customerTable, userId, {
            orderHistory: uniqueOrderHistory,
            paymentHistory: uniquePaymentHistory
        });

        return NextResponse.json({ success: true, claimedCount: newOrderIds.length });
    } catch (error: any) {
        console.error("Failed to claim guest orders:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
