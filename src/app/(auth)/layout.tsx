import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full flex-1 w-full flex bg-slate-50 dark:bg-slate-950">
      {/* Left side: Branding / Image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-purple-800/20 z-10" />
        {/* Subtle animated background shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/20 blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/20 blur-[100px]" />
        </div>
        
        <div className="z-20 p-12 text-white max-w-xl">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 font-bold text-xl">
              C
            </div>
            <h1 className="text-3xl font-bold tracking-tight">SuaProva AI</h1>
            <p className="text-slate-200 mt-2">A tecnologia a favor da educação.</p>
          </div>
          
          <div className="absolute bottom-10 left-10 right-10">
            <p className="text-sm text-slate-400 font-medium italic">
              "A ferramenta que precisávamos para modernizar nossas correções."
            </p>
          </div>
        </div>
      </div>

      {/* Right side: Auth forms */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="flex items-center gap-3 lg:hidden mb-8">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              C
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">SuaProva AI</h1>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
