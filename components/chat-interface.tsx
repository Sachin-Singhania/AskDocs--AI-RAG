"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Send, Bot, User } from "lucide-react"
import { useChatStore } from "@/store/store"
import { useState } from "react"
import { uploadMessage } from "@/lib/actions/api"
import { ask } from "@/lib/actions/rag-pipeline"
import { ROLE, UPLOADMESSAGE } from "@/lib/types"
import MarkdownViewer from "./Markdown"

export function ChatInterface() {
  const {addMessages,activeChatId,chats} = useChatStore();
  const [loading, setLoading] = useState(false);
    const chat = activeChatId ? chats[activeChatId] : null;
  const [input, setinput] = useState("");


  const handleSubmit= async(e: React.FormEvent<HTMLFormElement>)=>{
    e.preventDefault();
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
        setinput("");
        const response= await uploadMessage(msg);
        if(!response){
          console.log("ERROR OCCUR WHILE CALLING");
          return;
        }
          addMessages(activeChatId,response);
        const msgs = chat.messages.map((msg) => ({
          content: msg.content,
          role:  msg.Sender as ROLE
        }));
        const ai = await ask(
          response?.content,
          chat?.collectionName,
          msgs,
          chat.type
        );
        if(ai!=""){
           const msg:UPLOADMESSAGE= {
          chatId:activeChatId,
          message:ai,
          role :  ROLE.ASSISTANT
        }
        const response= await uploadMessage(msg);
         if(response)addMessages(activeChatId,response);
        }
      } catch (error) {
        
      } finally{
        setLoading(false);
      }
  }
  return (
<div className="flex flex-col h-full max-h-screen">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 bg-white">
        <h2 className="text-lg font-medium text-gray-900">{chat?.topic}</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">

        {chat?.messages.length === 0 ? (
          <Card className="p-6 text-center">
            <Bot className="mx-auto h-8 w-8 text-gray-400 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Chat!</h3>
            <p className="text-gray-600">Your document has been processed. Ask me anything about its content.</p>
          </Card>
        ) : (
          chat?.messages.map((message) => (
            <div key={message.id} className={`flex ${message.Sender === "USER" ? "justify-end" : "justify-start"}`}>
              <div className={`flex max-w-3xl ${message.Sender === "USER" ? "flex-row-reverse" : "flex-row"}`}>
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.Sender === "USER" ? "bg-blue-600 ml-3" : "bg-gray-200 mr-3"
                  }`}
                >
                  {message.Sender === "USER" ? (
                    <User className="h-4 w-4 text-white" />
                  ) : (
                    <Bot className="h-4 w-4 text-gray-600" />
                  )}
                </div>
                <div
                  className={`px-4 py-2 rounded-lg ${
                    message.Sender === "USER" ? "bg-blue-600 text-white" : "bg-white border border-gray-200"
                  }`}
                >
                    <MarkdownViewer content={message.content}/>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
        {loading && (
    <div className="flex justify-start">
      <div className="flex max-w-3xl flex-row">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 mr-3 flex items-center justify-center">
          <Bot className="h-4 w-4 text-gray-600" />
        </div>
        <div className="px-4 py-2 rounded-lg bg-white border border-gray-200 animate-pulse">
          <p className="whitespace-pre-wrap text-gray-400">AI is typing...</p>
        </div>
      </div>
    </div>
  )}

      {/* Input */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Input
            value={input}
            onChange={(e)=>setinput(e.target.value)}
            placeholder="Ask a question about the document..."
            className="flex-1"
          />
          <Button
            type="submit"
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
