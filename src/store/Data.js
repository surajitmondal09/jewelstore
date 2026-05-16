import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

import axios from "@/lib/axios";


export const useDataStore = create()(
    immer((set) => ({
        userData: null,

        setUserData: async (userID) => {
            const user = await axios.post("/api/user/get-user", { userID });
            const data = user.data;
            if (data) {
                if (Array.isArray(data.likedProducts)) {
                    data.likedProducts = data.likedProducts.map(p => typeof p === 'string' ? p : p.$id).filter(Boolean);
                }
                if (Array.isArray(data.cartId)) {
                    data.cartId = data.cartId.map(c => typeof c === 'string' ? c : c.$id).filter(Boolean);
                }
            }
            set(() => ({
                userData: data
            }))
        },

    }))
);
