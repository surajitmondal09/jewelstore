import { authenticateServer } from "@/lib/serverAuth";
import { db, notificationTable, customerTable } from "@/models/name";
import { NextRequest, NextResponse } from "next/server";
import { Query } from "appwrite";

export async function GET(request: NextRequest) {
    try {
        const auth = await authenticateServer(request);
        if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const tablesDB = auth.dbClient;

        const url = new URL(request.url);
        const userId = url.searchParams.get('userId');
        const page = parseInt(url.searchParams.get('page') || '1', 10);
        const limit = parseInt(url.searchParams.get('limit') || '10', 10);

        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        const offset = (page - 1) * limit;

        const notifications = await tablesDB.listRows(db, notificationTable, [
            Query.equal("userId", userId),
            Query.orderDesc("$createdAt"),
            Query.limit(limit + 1),
            Query.offset(offset)
        ]);

        const hasMore = notifications.rows.length > limit;
        const slicedNotifications = notifications.rows.slice(0, limit);

        return NextResponse.json({ notifications: slicedNotifications, hasMore });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const auth = await authenticateServer(request);
        if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const tablesDB = auth.dbClient;

        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        await tablesDB.updateRow(db, customerTable, userId, {
            hasUnreadNotification: false
        });

        return NextResponse.json({ success: true, message: "Notifications marked as read" });
    } catch (error) {
        console.error("Error updating unread notification status:", error);
        return NextResponse.json({ error: "Failed to mark notifications as read" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const auth = await authenticateServer(request);
        if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const tablesDB = auth.dbClient;

        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        let hasMore = true;
        let offset = 0;
        const limit = 50;

        while (hasMore) {
            const notifications = await tablesDB.listRows(db, notificationTable, [
                Query.equal("userId", userId),
                Query.limit(limit),
                Query.offset(offset)
            ]);

            if (notifications.rows.length === 0) {
                hasMore = false;
                break;
            }

            await Promise.all(
                notifications.rows.map(row => tablesDB.deleteRow(db, notificationTable, row.$id))
            );
            
            // Do not increment offset since we are deleting rows! Size shrinks.
        }

        return NextResponse.json({ success: true, message: "All notifications cleared" });
    } catch (error) {
        console.error("Error deleting notifications:", error);
        return NextResponse.json({ error: "Failed to clear notifications" }, { status: 500 });
    }
}
