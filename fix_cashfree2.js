const fs = require('fs');
let content = fs.readFileSync('src/app/api/user/online-order/verify-cashfree/route.ts', 'utf8');

content = content.replace(
    '        const updateData: any = {\r\n            orderHistory: currentOrderHistory,\r\n                    const updateData: any = {\r\n            orderHistory: currentOrderHistory,\r\n            paymentHistory: currentPaymentHistory,\r\n            hasUnreadNotification: true\r\n        };',
    '        const updateData: any = {\n            orderHistory: currentOrderHistory,\n            paymentHistory: currentPaymentHistory,\n            hasUnreadNotification: true\n        };'
);

content = content.replace(
    '        const updateData: any = {\n            orderHistory: currentOrderHistory,\n                    const updateData: any = {\n            orderHistory: currentOrderHistory,\n            paymentHistory: currentPaymentHistory,\n            hasUnreadNotification: true\n        };',
    '        const updateData: any = {\n            orderHistory: currentOrderHistory,\n            paymentHistory: currentPaymentHistory,\n            hasUnreadNotification: true\n        };'
);

if (!content.includes('notificationTable')) {
    content = content.replace(
        'addressTable } from "@/models/name";',
        'addressTable, notificationTable } from "@/models/name";'
    );
}

fs.writeFileSync('src/app/api/user/online-order/verify-cashfree/route.ts', content);
