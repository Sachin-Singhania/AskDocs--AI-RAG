"use client"
import { useEffect, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { ChatInterface } from "@/components/chat-interface"
import { DocumentProcessor } from "@/components/document-processor"
import { useSession } from "next-auth/react"

export default function RAGChat() {
  const [documentType, setDocumentType] = useState<"pdf" | "url" | null>(null)
  const [isDocumentProcessed, setIsDocumentProcessed] = useState(false)
  const [documentId, setDocumentId] = useState<string | null>(null)
  const [documentTitle, setDocumentTitle] = useState<string>("")
  const session = useSession()
  useEffect(() => {
    if (session.status === "unauthenticated") {
      console.error("User is not authenticated")
    } else {
      console.log("User is authenticated", session.data?.user)
    }
  }, [])
  

  const handleDocumentProcessed = (id: string, title: string) => {
    setDocumentId(id)
    setDocumentTitle(title)
    setIsDocumentProcessed(true)
    console.log("Document processed:", { id, title })
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
          <DocumentProcessor documentType={documentType} />
        ) : (
          <ChatInterface documentId={documentId!} documentTitle={documentTitle} />
        )}
      </div>
    </div>
  )
}
