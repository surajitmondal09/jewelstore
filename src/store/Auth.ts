import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";

import {AppwriteException, ID, Models} from "appwrite"
import { account } from "../models/client/config";


export interface UserPrefs {
  orders: number
}

interface IAuthStore {
  session: Models.Session | null;
  jwt: string | null
  user: Models.User<UserPrefs> | null
  hydrated: boolean
  theme: String
  
  darkTheme(): void
  lightTheme(): void
  setHydrated(): void;
  verifySession(): Promise<void>;
  login(
    email: string,
    password: string
  ): Promise<
  {
    user: any;
    success: boolean;
    error?: AppwriteException| null
  }>
  createAccount(
    name: string,
    email: string,
    password: string
  ): Promise<
  {
    [x: string]: any;
    success: boolean;
    error?: AppwriteException| null
  }>
  setSession(session:Models.Session | null, user:Models.User<UserPrefs> | null, jwt:string | null): Promise<{
    success: boolean;
    error?: AppwriteException| null
  }>
  setUser(): Promise<void>
  logout(): Promise<void>
}


export const useAuthStore = create<IAuthStore>()(
  persist(
    immer((set) => ({
      session: null,
      jwt: null,
      user: null,
      hydrated: false,
      theme: "light",

      darkTheme(){
        set({theme: "dark"})
      },

      lightTheme() {
        set({theme: "light"})
      },

      setHydrated() {
        set({hydrated: true})
      },

      async verifySession() {
        try {
          const session = await account.getSession("current")
          const [user, {jwt}] = await Promise.all([
            account.get<UserPrefs>(),
            account.createJWT()
          ])
          if (!user.prefs?.orders) await account.updatePrefs<UserPrefs>({
            orders: 0
          })
          set({session, user, jwt})
        } catch (error) {
          console.log(error)
        }
      },

      async login(email: string, password: string) {
        try {
          const session = await account.createEmailPasswordSession(email, password)
          const [user, {jwt}] = await Promise.all([
            account.get<UserPrefs>(),
            account.createJWT()

          ])
          if (!user.prefs?.orders) await account.updatePrefs<UserPrefs>({
            orders: 0
          })

          set({session, user, jwt})
          
          return { 
            success: true,
            user: user
          }

        } catch (error) {

          console.log(error)
          return {
            success: false,
            error: error instanceof AppwriteException ? error: null,
            user: this.user
          }
        }
      },

      async createAccount(name:string, email: string, password: string) {
        try {
          const userData = await account.create(ID.unique(), email, password, name)
          return {success: true, userData}
        } catch (error) {
          console.log(error)
          return {
            success: false,
            error: error instanceof AppwriteException ? error: null,
            
          }
        }
      },


      async setSession(session:Models.Session | null, user:Models.User<UserPrefs> | null, jwt:string | null){
        try {
        
          set({session, user, jwt})
         
          return { success: true}

        } catch (error) {

          console.log(error)
          return {
            success: false,
            error: error instanceof AppwriteException ? error: null,
            
          }
        }
      },

      async setUser() {
        try {
          const user = await account.get<UserPrefs>()
          set({user})
        } catch (error) {
          console.log(error)
        }
      },

      async logout() {
        try {
          await account.deleteSession('current')
          set({session: null, jwt: null, user: null})
          
        } catch (error) {
          console.log(error)
        }
      },
    })),
    {
      name: "auth",
      partialize: (state) => ({ session: state.session, user: state.user, theme: state.theme, hydrated: state.hydrated, jwt: state.jwt }),
      onRehydrateStorage(){
        return (state, error) => {
          if (!error) state?.setHydrated()
        }
      }
    }
  )
)
