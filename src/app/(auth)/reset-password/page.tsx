"use client"

import { Input } from '@/components/ui/input'
import { account } from '@/models/client/config'
import { Label } from '@radix-ui/react-label'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { Suspense, useState } from 'react'
import { toast } from 'react-toastify'

function ResetPassContent() {
  const router = useRouter();
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const searchParams = useSearchParams();
  const userId : any = searchParams.get("userId")
  const secret : any = searchParams.get("secret")

  const handelResetPass = async () => {
    if (!confirmPassword || !password) {
      setError(() => "Please fill out all fields");
      return;
    }

    if(password !== confirmPassword){
      setError("Passwords do not match")
      return;
    }

    try {
      // console.log(userId, secret, password)
      await account.updateRecovery({userId, secret, password})
      toast.success("Password reset successfully")
      router.push("/login")
    } catch (error) {
      console.error(error)
      setError("Something went wrong")
      toast.error("Failed to reset password")
    }
  }
  return (
    <div className='flex justify-center items-center h-screen p-2 bg-primary/10 dark:bg-gray-900'>
      <div className='flex flex-col gap-4 p-2 w-100 border rounded-xl shadow-2xl bg-card'>
        <div className='flex justify-center'>
          <p className='font-semibold text-xl'>Reset Password</p>
        </div>
        <div className='flex flex-col gap-1.5'>
          <div className='flex justify-between items-center'>
            <Label htmlFor="password">Password:</Label>
            <p className='text-xs text-gray-500 dark:text-gray-400'>Minimum 8 characters</p>
          </div>
          <Input type="password" placeholder="Enter your password" onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className='flex flex-col gap-1.5'>
          <Label htmlFor="password">Confirm Password:</Label>
          <Input type="password" placeholder="Re-enter your password" onChange={(e) => setConfirmPassword(e.target.value)} />
        </div>
        <div className='flex justify-center'>
          <button onClick={handelResetPass} className='bg-primary hover:bg-primary/90 text-white font-semibold py-2 px-4 rounded-md cursor-pointer active:bg-primary/90 active:scale-97'>
            Reset Password
          </button>
        </div>
        {error && (
          <p className="text-center text-sm text-red-500 dark:text-red-400">{error}</p>
        )}
      </div>
    </div>
  )
}

function ResetPass() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPassContent />
    </Suspense>
  )
}

export default ResetPass
