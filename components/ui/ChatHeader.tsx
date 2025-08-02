"use client"

import { FileText } from "lucide-react";

export  function ChatHeader({ topic } :{ topic: string | undefined }) {
  return (
    <div className="border-b border-white/20 p-6 bg-white/80 backdrop-blur-xl shadow-sm">
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200/30">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-slate-900 truncate">{topic}</h2>
          <div className="flex items-center space-x-2 mt-1">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
            <p className="text-sm text-slate-600">AI-powered document chat active</p>
          </div>
        </div>
      </div>
    </div>
  );
}