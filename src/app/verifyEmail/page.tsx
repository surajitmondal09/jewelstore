"use client"

import { account } from '@/models/client/config';
import { useSearchParams } from 'next/navigation';
import React, { Suspense } from 'react'
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/Auth';

function VerifyEmailContent() {
  const {setUser} = useAuthStore()
  const searchParams = useSearchParams();
  const userId : any = searchParams.get("userId")
  const secret : any = searchParams.get("secret")

  const router = useRouter();

  const handleVerify = async () => {
      
        const promise = account.updateVerification({
            userId,
            secret
        });

        promise.then(function (response) {
          console.log(response); // Success
          setUser()
          toast.success("Email verified successfully")
          router.push("/user")
        }, function (error) {
          console.error(error); // Failure
          toast.error("Failed to verify email")
        });
  }
    
  return (
    <div className='flex justify-center items-center h-screen'>
      <p onClick={handleVerify} className='flex justify-center items-center p-2 rounded-lg text-white font-semibold bg-primary active:bg-primary/90 active:scale-97 cursor-pointer'>Verify your email</p>
    </div>
  )
}

function VerifyEmail() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  )
}

export default VerifyEmail
