"use client";

import React, {useEffect} from 'react'
import { useAuthStore } from '@/store/Auth';
import { redirect } from 'next/navigation';
import { LoaderOne } from '@/components/ui/loader';
import { account, avatars} from '@/models/client/config';
import axios from "@/lib/axios";
import { useLocalStore } from '@/store/LocalStore';

function setSession() {
    let {setSession} = useAuthStore()
    const { syncData } = useLocalStore()

    const setAuth = async ()=>{
        try {
            const userData = await account.get();
            const sessionData = await account.getSession('current');
            const jwtData = await account.createJWT()

            console.log(sessionData, userData, jwtData);
            
            const ID = userData.$id
            const name = userData.name
            const email = userData.email
            // console.log(ID);
            

            const checkUser = await axios.put("/api/user", {ID}, {
                headers: {
                    Authorization: `Bearer ${jwtData.jwt}`
                }
            })
            // console.log(checkUser);
            

            if(checkUser.data.exists){
              console.log("user row exists");
            }else{
              console.log("user not exists");

              const avatar = avatars.getInitials({
                name: name,
                width: 100,
                height: 100,
                background: "CFA576",
              })
              
              const response = await axios.post("/api/user/register", {ID, name, email, avatar})

              console.log("user row created successfully",response.data);
            }

            // Set session AFTER user row is confirmed to exist, so syncData succeeds
            await setSession(sessionData, userData, jwtData.jwt);
            
            try {
              await syncData(userData.$id);
            } catch (err) {
              console.error("Failed to sync guest data on oauth login", err);
            }

            try {
              await axios.post("/api/user/claim-guest-orders", { email: userData.email });
            } catch (err) {
              console.error("Failed to claim guest orders on oauth login", err);
            }

            return redirect("/")
        } catch (error) {
            console.error("Auth setup failed:", error);
            // Redirect to login with error
            return redirect("/login?error=Authentication failed. Please try again.");
        }
    }

    useEffect(() => {
        setAuth()
    }, []);
  return (
    <div className='h-screen flex items-center justify-center'>
      <LoaderOne/>
    </div>
  )
}

export default setSession
