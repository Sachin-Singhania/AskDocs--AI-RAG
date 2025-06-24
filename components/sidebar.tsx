"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FileText, Globe, RotateCcw, CheckCircle } from "lucide-react"

interface SidebarProps {
  documentType: "pdf" | "url" | null
  setDocumentType: (type: "pdf" | "url" | null) => void
  isDocumentProcessed: boolean
  documentTitle: string
  onReset: () => void
}

export function Sidebar({ documentType, setDocumentType, isDocumentProcessed, documentTitle, onReset }: SidebarProps) {
  return (
    <div className="w-80 bg-white border-r border-gray-200 p-4 flex flex-col">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">AskDocs AI</h1>
        <p className="text-sm text-gray-600">Upload a PDF or enter a URL to start chatting with your documents</p>
      </div>

      {!isDocumentProcessed ? (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-gray-700 mb-3">Choose Document Source</h2>

          <Button
            variant={documentType === "pdf" ? "default" : "outline"}
            className={`w-full justify-start h-12 ${
              documentType === "pdf"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
            onClick={() => setDocumentType("pdf")}
          >
            <FileText className="mr-3 h-4 w-4" />
            Upload PDF
          </Button>

          <Button
            variant={documentType === "url" ? "default" : "outline"}
            className={`w-full justify-start h-12 ${
              documentType === "url"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
            onClick={() => setDocumentType("url")}
          >
            <Globe className="mr-3 h-4 w-4" />
            Enter URL
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <Card className="p-4 bg-green-50 border-green-200">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800">Document Processed</p>
                <p className="text-xs text-green-600 mt-1 truncate">{documentTitle}</p>
              </div>
            </div>
          </Card>

          <Button
            variant="outline"
            className="w-full bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            onClick={onReset}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Process New Document
          </Button>
        </div>
      )}
      <div>
        <Chats />
      </div>
    </div>
  )
}
export const Chats = () => {
  const chatTitles = [
    "Solana Blockchain Overview",
    " Understanding React Hooks",
    " AI in Healthcare: Opportunities and Challenges",
  ];

  return (
    <div className="mt-8">
       <h1 className="text-xl font-semibold text-gray-900 mb-2">Chats</h1>
      <div className="space-y-2">
        {chatTitles.map((title, index) => (
          <button
            key={index}
            className="w-full text-left text-base px-3 py-2 rounded-md hover:bg-gray-100 text-gray-800 transition"
            >
            {title}
          </button>
        ))}
      </div>
    </div>
  );
};
