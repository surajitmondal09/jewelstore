import { authenticateServer } from "@/lib/serverAuth";
import { db, customerTable } from "@/models/name";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';


export async function POST(request: NextRequest) {
    try {
        const auth = await authenticateServer(request);
        if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const tablesDB = auth.dbClient;

        const { userID, productID } = await request.json();

        const user = await tablesDB.getRow(db, customerTable, userID);

        const likedProducts = (user.likedProducts || []).map((p: any) => typeof p === 'string' ? p : p.$id).filter(Boolean);

        const likedProductsNew = likedProducts.filter((id: any) => id !== productID);

        const result = await tablesDB.updateRow(db, customerTable, userID, {
            likedProducts: likedProductsNew,
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error("Remove from liked error:", error);
        return NextResponse.json({ error: "Failed to remove from liked" }, { status: 500 });
    }
}
