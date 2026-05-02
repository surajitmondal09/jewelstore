import axios from "axios";
import { useAuthStore } from "@/store/Auth";

const api = axios.create({});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const jwt = useAuthStore.getState().jwt;
      if (jwt) {
        if (config.headers && typeof config.headers.set === 'function') {
          config.headers.set('Authorization', `Bearer ${jwt}`);
        } else {
          config.headers = config.headers || {};
          // @ts-ignore
          config.headers.Authorization = `Bearer ${jwt}`;
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Lock to prevent multiple concurrent verifySession calls
let isRefreshing = false;
let refreshSubscribers: ((token: string | null) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string | null) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string | null) {
  refreshSubscribers.map(cb => cb(token));
  refreshSubscribers = [];
}

// Gracefully handle expired/missing JWTs
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          await useAuthStore.getState().verifySession();
          const newJwt = useAuthStore.getState().jwt;
          isRefreshing = false;
          onRefreshed(newJwt);
        } catch (e) {
          isRefreshing = false;
          onRefreshed(null);
          return Promise.reject(error);
        }
      }

      // Wait for the refresh to complete
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((token) => {
          if (token) {
            if (originalRequest.headers && typeof originalRequest.headers.set === 'function') {
              originalRequest.headers.set('Authorization', `Bearer ${token}`);
            } else {
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(api(originalRequest));
          } else {
            reject(error);
          }
        });
      });
    }
    return Promise.reject(error);
  }
);

export default api;
