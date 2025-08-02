"use client"
import { Bot } from "lucide-react";

export  function LoadingBubble() {
  return (
    <div className="flex justify-start">
      <div className="flex max-w-4xl">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-slate-600 to-slate-700 mr-4 shadow-lg shadow-slate-200/30">
          <Bot className="h-5 w-5 text-white" />
        </div>
        <div className="px-6 py-4 rounded-2xl bg-white/80 border border-white/20 shadow-lg backdrop-blur-sm">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
            </div>
            <span className="text-sm text-slate-600">AI is thinking...</span>
          </div>
        </div>
      </div>
    </div>
  );
}