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

        const likedProducts = user.likedProducts || [];

        const likedProductsNew = likedProducts.filter((id: any) => id !== productID);

        const result = await tablesDB.updateRow(db, customerTable, userID, {
            likedProducts: likedProductsNew,
        });

        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ error });
    }
}
