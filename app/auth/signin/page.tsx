'use client';

import { signIn } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';

export default function SignIn() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-purple-900 relative">
      <div className="absolute top-6 left-6">
        <Link 
          href="/"
          className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
        >
          LinkTree
        </Link>
      </div>
      
      <div className="max-w-md w-full space-y-8 p-8 backdrop-blur-lg bg-white/5 rounded-xl border border-white/10 shadow-2xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-gray-300">
            Sign in to manage your Linktree pages
          </p>
        </div>
        
        <div className="mt-8 space-y-4">
          <button
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/10 text-white font-medium transition-all duration-200"
          >
            <Image
              src="https://authjs.dev/img/providers/google.svg"
              alt="Google"
              width={20}
              height={20}
              className="rounded-full"
            />
            Continue with Google
          </button>
          
          <button
            onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/10 text-white font-medium transition-all duration-200"
          >
            <Image
              src="https://authjs.dev/img/providers/github.svg"
              alt="GitHub"
              width={20}
              height={20}
              className="rounded-full"
            />
            Continue with GitHub
          </button>
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">
            By signing in, you agree to our{' '}
            <Link href="" className="text-blue-400 hover:text-blue-300">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="" className="text-blue-400 hover:text-blue-300">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 