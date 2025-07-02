"use client"
import { useEffect, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { ChatInterface } from "@/components/chat-interface"
import { DocumentProcessor } from "@/components/document-processor"
import { useSession } from "next-auth/react";
import { useChatStore } from "@/store/store"
import { getChats } from "@/lib/actions/api"

export default function Page() {
  const [documentType, setDocumentType] = useState<"pdf" | "url" | null>(null)
  const {data:session,status} = useSession();
    const { activeChatId,setChats,chats } = useChatStore();
  useEffect(() => {
      if (status !== "authenticated" || !session?.user?.userId) return;

  async function chat(userId: string) {
    try {
      const res = await getChats(userId);
      if (res) {
        setChats(res);
      }
    } catch (error) {
      console.log(error);
    }
  }
  
  chat(session.user.userId);
}, [session,status])  


  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        documentType={documentType}
        setDocumentType={setDocumentType}
      />
      <div className="flex-1 flex flex-col">
        {!activeChatId ? (
          <DocumentProcessor documentType={documentType} />
        ) : (
          <ChatInterface />
        )}
      </div>
    </div>
  )
}

