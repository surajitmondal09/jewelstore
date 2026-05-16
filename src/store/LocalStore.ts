import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import axios from "@/lib/axios";

export interface LocalCartItem {
  productID: string;
  productName: string;
  slug: string;
  price: number;
  qty: number;
  images?: string[];
}

interface ILocalStore {
  localCart: LocalCartItem[];
  localLiked: string[];
  addToLocalCart: (item: LocalCartItem) => void;
  removeFromLocalCart: (productID: string) => void;
  updateLocalCartQty: (productID: string, qty: number) => void;
  toggleLocalLiked: (productID: string) => void;
  clearLocalCart: () => void;
  clearLocalData: () => void;
  syncData: (userId: string) => Promise<void>;
}

export const useLocalStore = create<ILocalStore>()(
  persist(
    immer((set, get) => ({
      localCart: [],
      localLiked: [],

      addToLocalCart: (item) => {
        set((state) => {
          const existing = state.localCart.find((i) => i.productID === item.productID);
          if (existing) {
            existing.qty += item.qty;
          } else {
            state.localCart.push(item);
          }
        });
      },

      removeFromLocalCart: (productID) => {
        set((state) => {
          state.localCart = state.localCart.filter((i) => i.productID !== productID);
        });
      },

      updateLocalCartQty: (productID, qty) => {
        set((state) => {
          const existing = state.localCart.find((i) => i.productID === productID);
          if (existing) {
            existing.qty = qty;
          }
        });
      },

      toggleLocalLiked: (productID) => {
        set((state) => {
          const index = state.localLiked.indexOf(productID);
          if (index > -1) {
            state.localLiked.splice(index, 1);
          } else {
            state.localLiked.push(productID);
          }
        });
      },
      clearLocalCart: () => {
        set((state) => {
          state.localCart = [];
        });
      },

      clearLocalData: () => {
        set((state) => {
          state.localCart = [];
          state.localLiked = [];
        });
      },

      syncData: async (userId: string) => {
        const state = get();
        try {
          if (state.localLiked.length > 0) {
            for (const productId of state.localLiked) {
              try {
                await axios.post("/api/company/product/add-to-liked", { userID: userId, productID: productId });
              } catch (e) {
                console.error("Failed to sync liked product", productId, e);
              }
            }
          }

          if (state.localCart.length > 0) {
            for (const item of state.localCart) {
              try {
                await axios.post("/api/user/cart/add", {
                  customerID: userId,
                  productID: item.productID,
                  productName: item.productName,
                  slug: item.slug,
                  price: item.price,
                  qty: item.qty
                });
              } catch (e) {
                console.error("Failed to sync cart item", item.productID, e);
              }
            }
          }

          if (state.localCart.length > 0 || state.localLiked.length > 0) {
            set((s) => {
              s.localCart = [];
              s.localLiked = [];
            });
          }
        } catch (err) {
          console.error("Failed to sync local data", err);
        }
      },
    })),
    {
      name: "jewelstore-local",
    }
  )
);
