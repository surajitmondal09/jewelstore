import { authenticateServer } from "@/lib/serverAuth";
import { tablesDB as adminTablesDB } from "@/models/server/config";
import { NextRequest, NextResponse } from "next/server";
import { Cashfree, CFEnvironment } from "cashfree-pg";
import { db, customerTable, onlineOrderTable, customerPaymentTable, itemTable, productTable, addressTable, notificationTable } from "@/models/name";
import { ID } from "node-appwrite";

const cashfree = new Cashfree(
    CFEnvironment.SANDBOX,
    process.env.CASHFREE_CLIENT_ID,
    process.env.CASHFREE_CLIENT_SECRET_KEY
);

export async function POST(request: NextRequest) {
    try {
        const { orderId, customerId, addressID, itemId, shipping_charge, isDirect, isGuest, guestEmail, guestDetails } = await request.json();

        let tablesDBToUse = null;
        if (isGuest) {
            tablesDBToUse = adminTablesDB;
        } else {
            const auth = await authenticateServer(request);
            if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            tablesDBToUse = auth.dbClient;
        }

        let customer = null;
        let itemsToCalculate = itemId;

        if (!isGuest) {
            customer = await tablesDBToUse.getRow(db, customerTable, customerId);
            if (!customer) {
                return NextResponse.json({ error: "Customer not found" }, { status: 400 });
            }
            itemsToCalculate = isDirect ? itemId : customer.cartId;
        }

        if (!itemsToCalculate || itemsToCalculate.length === 0) {
            return NextResponse.json({ error: "No items to checkout" }, { status: 400 });
        }

        let expectedTotalAmount = 0;
        for (const id of itemsToCalculate) {
            try {
                const item = await tablesDBToUse.getRow(db, itemTable, id);
                if (item && item.productId) {
                    const product = await tablesDBToUse.getRow(db, productTable, item.productId);
                    if (product && typeof product.finalPrice === 'number') {
                        expectedTotalAmount += product.finalPrice * item.quantity;
                    }
                }
            } catch (err) {
                console.error(`Error fetching item/product details for item ID ${id}:`, err);
            }
        }

        const response = await cashfree.PGOrderFetchPayments(orderId);
        const payments = response.data;
        const successfulPayment = payments.find((p: any) => p.payment_status === "SUCCESS");

        if (!successfulPayment) {
            return NextResponse.json({ error: "Payment not successful" }, { status: 400 });
        }

        const actualPaidAmount = successfulPayment.payment_amount || 0;

        if (actualPaidAmount < expectedTotalAmount) {
            console.error(`Payment amount mismatch. Expected: ${expectedTotalAmount}, Paid: ${actualPaidAmount}`);
            return NextResponse.json({ error: "Partial payment received or amount mismatch" }, { status: 400 });
        }

        const paymentGroup = successfulPayment.payment_group;
        let paymentTypeStr = "card";
        if (paymentGroup === "upi") paymentTypeStr = "upi";
        else if (paymentGroup === "net_banking") paymentTypeStr = "netbanking";

        let addressData = addressID;
        if (isGuest) {
            addressData = JSON.stringify(guestDetails);
        } else {
            try {
                if (addressID) {
                    const address = await tablesDBToUse.getRow(db, addressTable, addressID);
                    if (address) {
                        addressData = JSON.stringify({
                            location: address.location,
                            city: address.city,
                            state: address.state,
                            pincode: address.pincode,
                            phone: address.phone
                        });
                    }
                }
            } catch (err) {
                console.error("Error fetching address:", err);
            }
        }

        const orderCustomerId = isGuest ? `guest_${guestEmail}` : customerId;

        const onlineOrder = await tablesDBToUse.createRow(db, onlineOrderTable, ID.unique(), {
            customerId: orderCustomerId,
            address: addressData,
            itemId,
            totalAmount: actualPaidAmount || 0,
            shipping_charge: shipping_charge || 0,
            paymentType: paymentTypeStr,
            paymentId: String(successfulPayment.cf_payment_id),
            paymentStatus: "paid",
            status: "placed",
        });

        const paymentRecord = await tablesDBToUse.createRow(db, customerPaymentTable, ID.unique(), {
            amount: actualPaidAmount,
            customerId: orderCustomerId,
            transactionId: String(successfulPayment.cf_payment_id)
        });

        if (!isGuest && customer) {
            const currentOrderHistory = customer.orderHistory ? [...customer.orderHistory, onlineOrder.$id] : [onlineOrder.$id];
            const currentPaymentHistory = customer.paymentHistory ? [...customer.paymentHistory, paymentRecord.$id] : [paymentRecord.$id];

            const updateData: any = {
                orderHistory: currentOrderHistory,
                paymentHistory: currentPaymentHistory,
                hasUnreadNotification: true
            };

            if (!isDirect) {
                updateData.cartId = [];
            }

            await tablesDBToUse.updateRow(db, customerTable, customerId, updateData);

            try {
                await tablesDBToUse.createRow(db, notificationTable, ID.unique(), {
                    userId: customerId,
                    notification: `Payment Successful! Your order (#${onlineOrder.$id.slice(-6).toUpperCase()}) has been placed.`
                });
            } catch (notifConfErr) {
                console.error("Failed to create placement notification:", notifConfErr);
            }
        }

        return NextResponse.json({ success: true, order: onlineOrder });
    } catch (error: any) {
        console.error("Cashfree verify error:", error.response?.data || error.message);
        return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 });
    }
}
