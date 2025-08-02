"use client"

import { uploadMessage } from "@/lib/actions/api"
import { ask } from "@/lib/actions/rag-pipeline"
import { ROLE, UPLOADMESSAGE } from "@/lib/types"
import { Chat, useChatStore } from "@/store/store"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { ChatHeader } from "./ui/ChatHeader"
import { ChatInput } from "./ui/ChatInput"
import { ChatMessages } from "./ui/ChatMessage"


export function ChatInterface() {
   const {addMessages,activeChatId,chats} = useChatStore();
  const [loading, setLoading] = useState(false);
  const [chat, setchat] = useState<Chat>()
  useEffect(() => {
    if (activeChatId == null) return;
    const chat = chats[activeChatId];
    if (!chat) return;
    setchat(chat);
  }, [activeChatId, chats]);


  const handleSubmit= async(input:string)=>{
    if(input.trim()=="") return;
    if(activeChatId==null) return;
    if(chat?.collectionName==null) return;
      setLoading(true);
      try {
        const msg:UPLOADMESSAGE= {
          chatId:activeChatId,
          message:input,
          role :  ROLE.USER
        }
        const response= await uploadMessage(msg);
        if(!response){
          console.log("ERROR OCCUR WHILE CALLING");
          return;
        }
          addMessages(activeChatId,response);
            const updatedHistory = [
        ...chat.messages,
        { content: response.content, Sender: response.Sender as ROLE }, 
      ];

      const msgs = updatedHistory.map((msg) => ({
        content: msg.content,
        role: msg.Sender as ROLE,
      }));

        const ai = await ask(
          response?.content,
          chat?.collectionName,
          msgs,
          chat.type,
          chat.id
        );
        if(ai.message!="" && ai.status){
           const msg:UPLOADMESSAGE= {
          chatId:activeChatId,
          message:ai.message,
          role :  ROLE.ASSISTANT
        }
        const response= await uploadMessage(msg);
         if(response)addMessages(activeChatId,response);
        }
      } catch (error) {
        //@ts-ignore
          toast.error(error.message);
      } finally{
        setLoading(false);
      }
  }

  return (
      <div className="flex flex-col h-screen">
      <ChatHeader topic={chat?.topic} />
      <ChatMessages messages={chat?.messages} loading={loading} />
      <ChatInput onSend={handleSubmit} disabled={loading} />
    </div>
  )
}


