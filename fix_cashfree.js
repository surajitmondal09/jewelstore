const fs = require('fs');
let content = fs.readFileSync('src/app/api/user/online-order/verify-cashfree/route.ts', 'utf8');

const newStr = `        const updateData: any = {
            orderHistory: currentOrderHistory,
            paymentHistory: currentPaymentHistory,
            hasUnreadNotification: true
        };

        if (!isDirect) {
            updateData.cartId = [];
        }

        await tablesDB.updateRow(db, customerTable, customerId, updateData);

        // Create a new notification
        try {
            await tablesDB.createRow(db, notificationTable, ID.unique(), {
                userId: customerId,
                notification: \\\`Payment Successful! Your order (#\${onlineOrder.$id.slice(-6).toUpperCase()}) has been placed.\\\`
            });
        } catch (notifConfErr) {
            console.error("Failed to create placement notification:", notifConfErr);
        }

        return NextResponse.json({ success: true, order: onlineOrder });`;

content = content.replace(/paymentHistory: currentPaymentHistory\r?\n\s*\};\r?\n\r?\n\s*if \(\!isDirect\) \{\r?\n\s*updateData\.cartId = \[\];\r?\n\s*\}\r?\n\r?\n\s*await tablesDB\.updateRow\(db, customerTable, customerId, updateData\);\r?\n\r?\n\s*return NextResponse\.json\(\{ success: true, order: onlineOrder \}\);/, newStr);

fs.writeFileSync('src/app/api/user/online-order/verify-cashfree/route.ts', content);
