"use client"

import React from 'react'

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from "@/lib/utils";
import {
  IconBrandGoogle,
} from "@tabler/icons-react";

import Link from 'next/link';
import { useAuthStore } from '@/store/Auth';
import { LoaderOne } from '@/components/ui/loader';
import { account } from '@/models/client/config';
import { OAuthProvider } from 'appwrite';
import { tr } from 'motion/react-client';
import { toast } from 'react-toastify';

export default function Login() {
  const { login } = useAuthStore();
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState("");
    const [message, setMessage] = React.useState("")

    const [email, setEmail] = React.useState("")
    const [password, setPassword] = React.useState("")


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // const formData = new FormData(e.currentTarget);
        // const email = formData.get("email");
        // const password = formData.get("password");

        if (!email || !password) {
            setError(() => "Please fill out all fields");
            return;
        }

        setIsLoading(() => true);
        setError(() => "");

        const loginResponse = await login(email.toString(), password.toString());
        if (loginResponse.error) {
            setError(() => loginResponse.error!.message);
        }

        setIsLoading(() => false);
    };

    const hendelForgotPassword = async () => {
    if (!email) {
      setError(() => "Please enter your email");
      return;
    }

    setError(() => "");

    try {
      const promise = account.createRecovery({
      email: email,
      url: `${process.env.NEXT_PUBLIC_DOMAIN_NAME}/reset-password`
      }); 

      console.log(promise)
      setMessage("A password reset link has been sent. Check your email")
      toast.success("Reset link has been sent")
    } catch (error) {
      console.error(error)
      setError("Failed to send reset link. Please check your email and try again.")
    }
  }

    const continueWithGoogle = ()=>{
    account.createOAuth2Session(
      OAuthProvider.Google,
      `${process.env.NEXT_PUBLIC_DOMAIN_NAME}/session`,
      `${process.env.NEXT_PUBLIC_DOMAIN_NAME}/login`
    )
  }

  return (
    <div className='flex justify-center items-center h-screen p-2'>
    <div className='flex flex-col gap-4 p-2 w-100 border rounded-xl shadow-2xl bg-card'>
      <h1 className="flex justify-center text-xl font-bold text-neutral-800 dark:text-neutral-200">
        Log in
      </h1>    
 
      <form className="my-2" onSubmit={handleSubmit}>        
        <LabelInputContainer className="mb-4">
          <Label htmlFor="email">Email</Label>
          <Input id="email" placeholder="Enter your email" type="email" onChange={(e: any)=>{setEmail(e.target.value)}} />
        </LabelInputContainer>
        <LabelInputContainer className="mb-4">
          <div className='flex justify-between'>
            <Label htmlFor="password">Password</Label>
            <p onClick={hendelForgotPassword} className='text-sm font-semibold underline active:scale-97 cursor-pointer'>Forgot Password ?</p>
          </div>
          <Input id="password" placeholder="••••••••" type="password" onChange={(e: any)=>{setPassword(e.target.value)}} />
        </LabelInputContainer>
        
 
        <button
          className="group/btn relative block h-10 w-full cursor-pointer active:scale-95 items-center justify-center rounded-md bg-linear-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset]"
          type="submit"
          disabled={isLoading}
        >
          {!isLoading ? <p className='font-semibold'>Log in &rarr;</p> : <div className='pb-1 flex justify-center items-center'><LoaderOne /></div>}
          
          <BottomGradient />
        </button>
 
        <div className="my-8 h-px w-full bg-linear-to-r from-transparent via-neutral-300 to-transparent dark:via-neutral-700" />
 
        <div className="flex flex-col space-y-4">
          
          <button
            className="group/btn shadow-input relative flex h-10 w-full cursor-pointer active:scale-95 items-center justify-center space-x-2 rounded-md bg-gray-50 px-4 font-medium text-black dark:bg-zinc-900 dark:shadow-[0px_0px_1px_1px_#262626]"
            type="button"
            disabled={isLoading}
            onClick={continueWithGoogle}
          >
            <IconBrandGoogle className="h-4 w-4 text-neutral-800 dark:text-neutral-300" />
            <span className="text-sm text-neutral-700 dark:text-neutral-300">
              Continue With Google
            </span>
            <BottomGradient />
          </button>
          
        </div>
      </form>

      {error && (
                <p className=" text-center text-sm text-red-500 dark:text-red-400">{error}</p>
            )}

      {message && (
          <p className="text-center text-sm text-primary/90 dark:text-primary/80">{message}</p>
        )}      

      <p className=" max-w-sm text-sm text-neutral-600 dark:text-neutral-300">
        If you don&apos;t have an account, then please{" "}
                <Link href="/register" className="text-orange-500 underline">
                    register
                </Link>{""} to our site
      </p>

    </div>
    </div>
  );
}
 
const BottomGradient = () => {
  return (
    <>
      <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-linear-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
      <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-linear-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
    </>
  );
};
 
const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("flex w-full flex-col space-y-2", className)}>
      {children}
    </div>
  );
  
}
