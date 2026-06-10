# JewelStore - E-Commerce Platform

JewelStore is a full-stack, aesthetically modern E-Commerce web application built using **Next.js 14**, **TypeScript**, and **Tailwind CSS**. It is designed with robust state-management, real-time database capabilities via **Appwrite**, and fully integrated logistics routing via **Shiprocket**.

## 🚀 Core Technologies
- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **State Management:** Zustand (Immer & Persistence middleware)
- **Backend/BaaS:** Appwrite (Auth, Databases, and Real-time WebSockets)
- **Styling:** Tailwind CSS + Glassmorphism UI
- **Icons:** Tabler Icons React
- **Logistics:** Shiprocket API Integration

---

## 🌟 Feature Breakdown

### 🛒 Customer-Facing Features (Frontend)
1. **Dynamic Shopping Cart:** Add to cart, adjust quantities, and robust checkout validation that accurately mirrors live database prices to prevent exploits.
2. **Wishlist ("Liked"):** Users can like their favorite products and seamlessly track them.
3. **Automated Order History:** Customers can browse their robust invoice histories and previous online orders securely.
4. **Address Management:** A structured multi-address management interface allowing customers to assign custom delivery locations to specific orders.
5. **Real-time Notifications:** 
   - Instant WebSocket-driven UI alerts for order statuses.
   - Built-in "Clear All" read-receipt capabilities.
6. **Dynamic Theming:** Seamless Dark Mode / Light Mode toggle integrated directly into the Navbar and sidebar.
7. **Responsive Navigation:** A complete mobile-optimized sidebar overlay paired with a beautiful desktop frosted-glass Navbar.

### 🏢 Admin & Seller Tools (Dashboard)
1. **Complete Control Panel:** Secure `/dashboard` routes hidden behind role-based (Owner) label permissions validating through Appwrite.
2. **Product Catalog Management:** Full Create, Read, Update, and Delete (CRUD) operations on all listed products.
3. **Marketing Controls:**
   - **Featured Products Configurator:** Control which items appear in premium slots.
   - **Slider Configurator:** Manage the hero-images and promotional sliders on the front page.
   - **Notification Broadcasts:** A powerful marketing tool allowing admins to blast customized alerts directly to the real-time notification bells of every registered user.
4. **Order Management Interface:** Track all incoming `online-orders`, filter by their status, and instantly update delivery milestones.

### 🚚 Advanced Logistics & Checkout (Backend Integration)
1. **Shiprocket API Connectivity:**
   - Automated Webhook/Tracking integration via `/api/company/shiprocket-track`.
   - Direct courier assignment via `/api/company/shiprocket-create-order`.
   - Robust backend authentication caching utilizing Shiprocket Auth algorithms.
2. **Immutable Snapshot Invoicing:** To ensure complete financial accuracy, the cart checkout endpoints automatically sever database links at the time of purchase, forcing the order invoice to strictly record the live "price snapshot" of the items. This protects the invoice even if the seller deletes or drastically updates the product listing later on.
3. **Database Security Definitions:** Granular row-level-security configurations built into Node-Appwrite schema setups (`customerTable`, `onlineOrderTable`, `addressTable`, `notificationTable`).

---

## 💻 Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. The environment requires connected `NEXT_PUBLIC_APPWRITE_PROJECT_ID` and `NEXT_PUBLIC_APPWRITE_HOST_URL` variables.

## 🤝 Deployment
https://jewelstore.appwrite.network/
