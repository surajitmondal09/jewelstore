import { authenticateServer } from "@/lib/serverAuth";
import { db, customerTable, itemTable } from "@/models/name";
import { NextRequest, NextResponse } from "next/server";
import { ID } from "appwrite";

export const dynamic = 'force-dynamic';


export async function POST(req: NextRequest) {
  try {
        const auth = await authenticateServer(req);
        if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const tablesDB = auth.dbClient;

    const body = await req.json();
    const { customerID, productID, qty, productName, slug, price } = body;
    if (!customerID || !productID || !productName || !slug || !qty || qty < 1 || !price || price < 1) {
      return NextResponse.json({ success: false, message: "Invalid input" }, { status: 400 });
    }
    const customer = await tablesDB.getRow(db, customerTable, customerID);

    if (!customer) {
      return NextResponse.json({ success: false, message: "Customer not found" }, { status: 404 });
    }

    if (customer.cartId && customer.cartId.length > 0) {
      const promises = customer.cartId.map((id: string) => tablesDB.getRow(db, itemTable, id).catch(() => null));
      const cartItems = await Promise.all(promises);
      
      const existingItem = cartItems.find((item: any) => item && item.productId === productID);

      if (existingItem) {
        const newQuantity = existingItem.quantity + qty;
        await tablesDB.updateRow(db, itemTable, existingItem.$id, { quantity: newQuantity });
        
        return NextResponse.json({ success: true, message: "Item quantity updated in cart" });
      }
    }

    const item = await tablesDB.createRow(db, itemTable, ID.unique(), {
      productId: productID,
      productName,
      slug,
      quantity: qty,
      price,
    });

    const updatedCart = customer.cartId ? [...customer.cartId, item.$id] : [item.$id];
    await tablesDB.updateRow(db, customerTable, customerID, { cartId: updatedCart });

    return NextResponse.json({ success: true, message: "Item added to cart" });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to add item to cart" }, { status: 500 });
  }
}
