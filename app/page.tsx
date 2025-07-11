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
      let isCanceled = false;
      let id: NodeJS.Timeout | null = null;
      async function chat(userId: string) {
    let pollInterval = 4000;
    try {
      const res = await getChats(userId);
      if (res && res.length > 0) {
        setChats(res);
        if (res.length >=5) {
          pollInterval= 20000;
        }else{
          pollInterval= 4000;
        }
      }else{
        pollInterval= 10000;
      }
    } catch (error) {
      console.log(error);
      pollInterval = 15000;
    }
    if (!isCanceled) {
     id = setTimeout(() => chat(userId), pollInterval);
    }
  }
  chat(session.user.userId);
  
  return () => {
    isCanceled = true;
    if (id) {
      clearTimeout(id);
    }
  }
}, [status])  


  return (
        <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
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

