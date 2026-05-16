import { db, customerTable, onlineOrderTable, itemTable, productTable } from "@/models/name";
import { tablesDB as adminTablesDB } from "@/models/server/config";
import { NextRequest, NextResponse } from "next/server";
import { Query } from "node-appwrite";

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const email = url.searchParams.get("email");

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // 1. Find guest orders
        const guestOrders = await adminTablesDB.listRows(db, onlineOrderTable, [
            Query.equal("customerId", `guest_${normalizedEmail}`),
            Query.orderDesc("$createdAt")
        ]);

        let registeredUserOrders: any[] = [];

        // 2. Find if this email belongs to a registered customer
        const customers = await adminTablesDB.listRows(db, customerTable, [
            Query.equal("email", normalizedEmail)
        ]);

        if (customers.rows.length > 0) {
            const customerId = customers.rows[0].$id;
            const regOrders = await adminTablesDB.listRows(db, onlineOrderTable, [
                Query.equal("customerId", customerId),
                Query.orderDesc("$createdAt")
            ]);
            registeredUserOrders = regOrders.rows;
        }

        // Combine orders and sort by date descending
        const allOrders = [...guestOrders.rows, ...registeredUserOrders].sort((a, b) => {
            return new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime();
        });

        if (allOrders.length === 0) {
            return NextResponse.json({ success: true, orders: [] });
        }

        // 3. Process orders and mask product details for privacy
        const processedOrders = await Promise.all(allOrders.map(async (order, index) => {
            const itemIds = order.itemId || [];
            
            // Fetch items
            const items = await Promise.all(itemIds.map(async (id: string, itemIdx: number) => {
                try {
                    const item = await adminTablesDB.getRow(db, itemTable, id);
                    if (item) {
                        return {
                            $id: item.$id,
                            productName: `Aura Product ${index + 1}-${itemIdx + 1}`, // MASKED
                            quantity: item.quantity,
                            price: item.price
                        };
                    }
                } catch (e) {
                    console.error("Failed to fetch item", id);
                }
                return null;
            }));

            const validItems = items.filter(Boolean);

            return {
                $id: order.$id,
                $createdAt: order.$createdAt,
                status: order.status,
                paymentStatus: order.paymentStatus,
                paymentType: order.paymentType,
                totalAmount: order.totalAmount,
                items: validItems
            };
        }));

        return NextResponse.json({ success: true, orders: processedOrders });

    } catch (error) {
        console.error("Track Order API Error:", error);
        return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }
}
