"use client"
import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { ChatInterface } from "@/components/chat-interface"
import { DocumentProcessor } from "@/components/document-processor"

export default function RAGChat() {
  const [documentType, setDocumentType] = useState<"pdf" | "url" | null>(null)
  const [isDocumentProcessed, setIsDocumentProcessed] = useState(false)
  const [documentId, setDocumentId] = useState<string | null>(null)
  const [documentTitle, setDocumentTitle] = useState<string>("")

  const handleDocumentProcessed = (id: string, title: string) => {
    setDocumentId(id)
    setDocumentTitle(title)
    setIsDocumentProcessed(true)
  }

  const handleReset = () => {
    setDocumentType(null)
    setIsDocumentProcessed(false)
    setDocumentId(null)
    setDocumentTitle("")
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        documentType={documentType}
        setDocumentType={setDocumentType}
        isDocumentProcessed={isDocumentProcessed}
        documentTitle={documentTitle}
        onReset={handleReset}
      />

      <div className="flex-1 flex flex-col">
        {!isDocumentProcessed ? (
          <DocumentProcessor documentType={documentType} onDocumentProcessed={handleDocumentProcessed} />
        ) : (
          <ChatInterface documentId={documentId!} documentTitle={documentTitle} />
        )}
      </div>
    </div>
  )
}
