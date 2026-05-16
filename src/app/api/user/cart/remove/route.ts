import { authenticateServer } from "@/lib/serverAuth";
import { db, customerTable, itemTable } from "@/models/name";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';


export async function POST(request: NextRequest) {
  try {
        const auth = await authenticateServer(request);
        if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const tablesDB = auth.dbClient;

    const data = await request.json();
    const { customerID, itemID } = data;

    if (!customerID || !itemID) {
      return NextResponse.json({ error: "customerID and itemID are required" }, { status: 400 });
    }

    const customer = await tablesDB.getRow(db, customerTable, customerID);
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // delete the item row
    try {
      await tablesDB.deleteRow(db, itemTable, itemID);
    } catch (err) {
      // If item already deleted, continue to update cart
      console.warn('Failed to delete item', err);
    }

    const cartArray = Array.isArray(customer.cartId) ? customer.cartId.map((id: any) => typeof id === 'string' ? id : id.$id).filter((id: string) => id !== itemID) : [];

    await tablesDB.updateRow(db, customerTable, customerID, { cartId: cartArray });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cart remove error:", error);
    return NextResponse.json({ error: "Failed to remove from cart" }, { status: 500 });
  }
}
