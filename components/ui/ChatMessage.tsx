"use client"
import { forwardRef, useEffect, useRef } from "react";
import MarkdownViewer from "../Markdown";
import { Card } from "./card";
import { Bot, Sparkles, User } from "lucide-react";
import { LoadingBubble } from "./LoadinBubble";
import { Chat } from "@/store/store";

export  function ChatMessages({ messages, loading } :{ messages: Chat['messages'] | undefined, loading: boolean }) {
  const scroll= useRef<HTMLDivElement>(null);
useEffect(() => {
  setTimeout(() => {
    scroll.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, 0);
}, [messages]);
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
      {messages?.map((message,index) => (
        <ChatMessage key={message.id} message={message} ref={index === messages.length - 1 ? scroll : null} />
      ))}
      {loading && <LoadingBubble />}
    </div>
  );
}
interface ChatMessageProps {
  message: Chat["messages"][number];
}
export const ChatMessage = forwardRef<HTMLDivElement, ChatMessageProps>(
  ({ message }, ref) => {
  function cleanChatMessage(text: string) {
   return text
    .replace(/^```[^\n]*\n/, '')   
    .replace(/\n```$/, '')         
    .trim();
}
  return (
    <div key={message.id} ref={ref} className={`flex ${message.Sender === "USER" ? "justify-end" : "justify-start"}`}>
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
          className={`px-6 py-4 rounded-2xl shadow-lg backdrop-blur-sm  max-w-2xl break-words  ${
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
})