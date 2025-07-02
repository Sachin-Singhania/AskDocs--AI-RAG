"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useChatStore } from "@/store/store"
import { FileText, Globe, RotateCcw, CheckCircle } from "lucide-react"

interface SidebarProps {
  documentType: "pdf" | "url" | null
  setDocumentType: (type: "pdf" | "url" | null) => void
}

export function Sidebar({ documentType, setDocumentType }: SidebarProps) {
  const { selectChat,activeChatId } = useChatStore();
  return (
    <div className="w-80 bg-white border-r border-gray-200 p-4 flex flex-col">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">AskDocs AI</h1>
        <p className="text-sm text-gray-600">Upload a PDF or enter a URL to start chatting with your documents</p>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-gray-700 mb-3">Choose Document Source</h2>
        <Button
          className={` outline-gray-700 outline w-full justify-start h-12 ${documentType === "pdf" && !activeChatId
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          onClick={() => {
            setDocumentType("pdf")
            selectChat(null);
          }}
        >
          <FileText className="mr-3 h-4 w-4" />
          Upload PDF
        </Button>

        <Button
          className={`outline-gray-700 outline w-full justify-start h-12 ${documentType === "url" && !activeChatId
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          onClick={() => {
            setDocumentType("url")
            selectChat(null);
          }}
        >
          <Globe className="mr-3 h-4 w-4" />
          Enter URL
        </Button>
      </div>
      <div>
        <Chats />
      </div>
    </div>
  )
}
export const Chats = () => {
  const { chats, selectChat, activeChatId } = useChatStore();
  return (
    <div className="mt-8">
      <h1 className="text-xl font-semibold text-gray-900 mb-2">Chats</h1>
      <div className="space-y-2">
        {Object.values(chats).map((chat) => (
          <button
            key={chat.id}
            onClick={() => selectChat(chat.id)}
            className={`w-full text-left text-base px-3 py-2 rounded-md transition ${activeChatId === chat.id ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100 text-gray-800'
              }`}            >
            {chat.topic}
          </button>
        ))}
      </div>
    </div>
  );
};
