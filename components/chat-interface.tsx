"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Send, Bot, User, FileText, Sparkles } from "lucide-react"
import { Chat, useChatStore } from "@/store/store"
import { useEffect, useRef, useState } from "react"
import { uploadMessage } from "@/lib/actions/api"
import { ask } from "@/lib/actions/rag-pipeline"
import { ROLE, UPLOADMESSAGE } from "@/lib/types"
import MarkdownViewer from "./Markdown"
import { toast } from "sonner"


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
  const [input, setinput] = useState("");


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
export  function ChatHeader({ topic } :{ topic: string | undefined }) {
  return (
    <div className="border-b border-white/20 p-6 bg-white/80 backdrop-blur-xl shadow-sm">
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200/30">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-slate-900 truncate">{topic}</h2>
          <div className="flex items-center space-x-2 mt-1">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
            <p className="text-sm text-slate-600">AI-powered document chat active</p>
          </div>
        </div>
      </div>
    </div>
  );
}
export  function ChatMessages({ messages, loading } :{ messages: Chat['messages'] | undefined, loading: boolean }) {
  const scroll= useRef<HTMLDivElement>(null);
  useEffect(() => {
    scroll.current?.scrollIntoView({behavior : 'smooth',block:"end",inline:"nearest"});
  },[messages])
  if (!messages?.length && !loading) {
    return (
      <div className="flex-1 overflow-y-auto p-6 no-scrollbar flex items-center justify-center">
        <Card className="p-8 max-w-md text-center bg-white/70 backdrop-blur-sm border-white/20 shadow-xl">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto"></div>
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-3">Ready to Chat!</h3>
          <p className="text-slate-600 leading-relaxed">
            Your document has been processed and indexed. Ask me anything about its content and I'll provide
            intelligent, contextual answers.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
      {messages?.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}
      <div ref={scroll}/>
      {loading && <LoadingBubble />}
    </div>
  );
}
export  function ChatMessage({ message } :{ message: Chat['messages'][number] }) {
  function cleanChatMessage(text: string) {
   return text
    .replace(/^```[^\n]*\n/, '')   
    .replace(/\n```$/, '')         
    .trim();
}
  return (
    <div key={message.id} className={`flex ${message.Sender === "USER" ? "justify-end" : "justify-start"}`}>
      <div className={`flex max-w-4xl ${message.Sender === "USER" ? "flex-row-reverse" : "flex-row"}`}>
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
            message.Sender === "USER"
              ? "bg-gradient-to-br  from-blue-600 to-blue-700 ml-4 shadow-blue-200/30 "
              : "bg-gradient-to-br from-slate-600 to-slate-700 mr-4 shadow-slate-200/30"
          }`}
        >
          {message.Sender === "USER" ? <User className="h-5 w-5 text-white" /> : <Bot className="h-5 w-5 text-white" />}
        </div>
        <div
          className={`px-6 py-4 rounded-2xl shadow-lg backdrop-blur-sm ${
            message.Sender === "USER"
              ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-blue-200/30"
              : "bg-white/80 border border-white/20 text-slate-800 shadow-slate-200/20"
          }`}
        >
          {
            message.Sender=="ASSISTANT" ? <MarkdownViewer key={message.id} content={cleanChatMessage(message.content)} /> : message.content
          }
          
          {message.Sender === "ASSISTANT" && (
            <div className="mt-3 pt-3 border-t border-slate-200/50">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-3 h-3 text-slate-400" />
                <span className="text-xs text-slate-500">AI-generated response</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
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
export  function ChatInput({ onSend, disabled } :{ onSend: (input: string) => void, disabled: boolean }) {
  const [input, setInput] = useState("");

  function handleSubmit(e : React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    onSend(input);
    setInput("");
  }

  return (
    <div className="border-t border-white/20 p-6 bg-white/80 backdrop-blur-xl">
      <form onSubmit={handleSubmit} className="flex space-x-4">
        <div className="flex-1 relative">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about your document..."
            disabled={disabled}
            className="h-12 pr-12 bg-white/70 border-slate-200 focus:border-blue-400 focus:ring-blue-400/20 rounded-xl shadow-sm"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Sparkles className="w-4 h-4 text-slate-400" />
          </div>
        </div>
        <Button
          type="submit"
          disabled={disabled || !input.trim()}
          className="h-12 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-lg shadow-blue-200/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
