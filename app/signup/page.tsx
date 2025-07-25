"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Sparkles, ArrowRight } from "lucide-react"
import Link from "next/link"
import { signIn } from "next-auth/react"

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleAuth = async () => {
    setIsLoading(true)
    signIn("google",{callbackUrl : "/"});
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200/30">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  RAG Chat
                </h1>
                <div className="w-16 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mt-1"></div>
              </div>
            </div>

            <p className="text-slate-600 leading-relaxed">
              Transform your documents into intelligent conversations with AI-powered insights
            </p>
          </div>

          {/* Auth Card */}
          <Card className="p-8 bg-white/80 backdrop-blur-xl border-white/20 shadow-2xl shadow-slate-200/20">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Get Started</h3>
              <p className="text-slate-600 text-sm">
                Sign in with your Google account to access AI-powered document analysis
              </p>
            </div>

            {/* Google Sign In Button */}
            <Button
              type="button"
              onClick={handleGoogleAuth}
              disabled={isLoading}
              className="w-full h-12 bg-white hover:bg-gray-50 text-slate-700 border border-slate-200 hover:border-slate-300 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
                  <span className="font-medium">Signing in...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-3">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="font-medium">Continue with Google</span>
                </div>
              )}
            </Button>

            {/* Features Preview */}
            <div className="mt-6 pt-6 border-t border-slate-200/50">
              <p className="text-xs font-medium text-slate-700 mb-4 text-center">What you'll get:</p>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-sm text-slate-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                  <span>Upload PDFs and analyze web content</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-slate-600">
                  <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></div>
                  <span>AI-powered document conversations</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-slate-600">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0"></div>
                  <span>Smart search and insights</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}