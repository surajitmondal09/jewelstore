import { db, customerTable} from "@/models/name";
import { authenticateServer } from "@/lib/serverAuth";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const { userID } = await request.json();

        const auth = await authenticateServer(request);
        if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const tablesDB = auth.dbClient;

        const user = await tablesDB.getRow(db, customerTable, userID);

        return NextResponse.json(user);

    } catch (error) {
        return NextResponse.json({ error });
    }
}
