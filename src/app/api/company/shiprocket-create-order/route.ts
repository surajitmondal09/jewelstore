
import { NextResponse, NextRequest } from "next/server";

const SHIPROCKET_URL = "https://apiv2.shiprocket.in";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { token, order } = body;

    console.log("token:", token);
    console.log("order:", order);

		if (!token) {
			return NextResponse.json({ error: "Shiprocket token is required" }, { status: 400 });
		}

		if (!order) {
			return NextResponse.json({ error: "Order details are required" }, { status: 400 });
		}

		// call Shiprocket create adhoc order
		const res = await fetch(`${SHIPROCKET_URL}/v1/external/orders/create/adhoc`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify(order),
		});

		const data = await res.json();

		if (!res.ok || !data.order_id || data.status_code === 0 || data.status_code === 400 || data.status_code === 422) {
			return NextResponse.json({ 
                error: "Failed to create Shiprocket order", 
                details: data 
            }, { status: 400 });
		}

		// normalize response: Shiprocket may return order_id, shipment_id, awb
		return NextResponse.json({ success: true, ...data });
	} catch (error) {
		console.error("Shiprocket order creation error:", error);
		return NextResponse.json({ error: "Failed to create Shiprocket order" }, { status: 500 });
	}
}
