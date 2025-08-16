"use client"

import { useChatStore } from "@/store/store"
import { FileText, Globe, Sparkles } from "lucide-react"
import { Card } from "./ui/card"
import { ChatHistory } from "./ui/ChatHistory"
import { SidebarProps } from "@/lib/types"



export function Sidebar({ documentType, setDocumentType }: SidebarProps) {
  const { selectChat,activeChatId } = useChatStore();
  return (
        <div className="w-80 bg-white/80 backdrop-blur-xl border-r border-white/20  shadow-slate-200/20 p-6 flex flex-col shadow-md">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              RAG Chat
            </h1>
            <div className="w-12 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
          </div>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          Transform your documents into intelligent conversations with AI-powered insights
        </p>
      </div>

        <div className="space-y-4">
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-slate-800 mb-1">Choose Your Source</h2>
            <p className="text-xs text-slate-500">Select how you'd like to upload your content</p>
          </div>

          <Card
            className={`p-4 cursor-pointer transition-all duration-300 border-2 hover:shadow-lg hover:shadow-blue-100/50 ${
              documentType === "pdf"  && activeChatId== null
                ? "border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-md shadow-blue-100/50"
                : "border-slate-200 bg-white/50 hover:border-slate-300"
            }`}
           onClick={() => {
            setDocumentType("pdf")
            selectChat(null);
          }}
          >
            <div className="flex items-center space-x-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                  documentType === "pdf" && activeChatId== null ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-slate-900">Upload PDF</h3>
                <p className="text-xs text-slate-500">Process PDF documents</p>
              </div>
              {documentType === "pdf" && activeChatId== null && <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>}
            </div>
          </Card>

          <Card
            className={`p-4 cursor-pointer transition-all duration-300 border-2 hover:shadow-lg hover:shadow-purple-100/50 ${
              documentType === "url"  && activeChatId== null
                ? "border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 shadow-md shadow-purple-100/50"
                : "border-slate-200 bg-white/50 hover:border-slate-300"
            }`}
                      onClick={() => {
            setDocumentType("url")
            selectChat(null);
          }}
          >
            <div className="flex items-center space-x-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                  documentType === "url" && activeChatId== null ? "bg-purple-500 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                <Globe className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-slate-900">Web URL</h3>
                <p className="text-xs text-slate-500">Extract from websites</p>
              </div>
              {documentType === "url" &&activeChatId== null &&  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>}
            </div>
          </Card>
        </div>
        <div>
          <ChatHistory />
        </div>

      {/* Footer */}
    </div>
  )
}

