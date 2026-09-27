'use client';

import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 dark:from-gray-950 dark:to-gray-900">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg dark:border-gray-700 dark:bg-gray-800">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-gray-100">Đăng nhập</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-gray-400">
          Chỉ tài khoản được phép truy cập vào dự án này mới có thể đăng nhập.
        </p>

        <div className="mt-6">
          <Button onClick={() => signIn('github', { callbackUrl: '/' })} className="w-full">
            Đăng nhập bằng GitHub
          </Button>
        </div>
      </div>
    </div>
  );
}
