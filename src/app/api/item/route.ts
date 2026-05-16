import { db, itemTable } from "@/models/name";
import { authenticateServer } from "@/lib/serverAuth";
import { tablesDB as adminTablesDB } from "@/models/server/config";
import { NextResponse, NextRequest } from "next/server";
import { ID } from "node-appwrite";

export async function POST(request: NextRequest) {
    try {
        const data = await request.json();
        const { productId, productName, quantity, price, slug, isGuest } = data;
        
        let tablesDBToUse = null;
        if (isGuest) {
            tablesDBToUse = adminTablesDB;
        } else {
            const auth = await authenticateServer(request);
            if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            tablesDBToUse = auth.dbClient;
        }

        const response = await tablesDBToUse.createRow(db, itemTable, ID.unique(), {
            productId,
            productName,
            quantity,
            price,
            slug,
        });
        return NextResponse.json(response);
    } catch (error) {
        return NextResponse.json({ error });
    }
}

// get a item by id
export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const id = url.searchParams.get("id");
        if (!id) {
            return NextResponse.json({ error: "id is required" }, { status: 400 });
        }

        const auth = await authenticateServer(request);
        if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const tablesDB = auth.dbClient;

        const response = await tablesDB.getRow(db, itemTable, id);
        return NextResponse.json(response);
    } catch (error) {
        return NextResponse.json({ error });
    }
}

// update item (quantity, price, productName)
export async function PATCH(request: NextRequest) {
    try {
        const data = await request.json();
        const { id, quantity, price, productName } = data;
        if (!id) {
            return NextResponse.json({ error: "id is required" }, { status: 400 });
        }

        const auth = await authenticateServer(request);
        if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const tablesDB = auth.dbClient;

        const updateData: any = {};
        if (typeof quantity !== 'undefined') updateData.quantity = quantity;
        if (typeof price !== 'undefined') updateData.price = price;
        if (typeof productName !== 'undefined') updateData.productName = productName;

        const response = await tablesDB.updateRow(db, itemTable, id, updateData);
        return NextResponse.json(response);
    } catch (error) {
        return NextResponse.json({ error });
    }
}
