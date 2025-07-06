"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Send, Bot, User, FileText, Sparkles } from "lucide-react"
import { useChatStore } from "@/store/store"
import { useState } from "react"
import { uploadMessage } from "@/lib/actions/api"
import { ask } from "@/lib/actions/rag-pipeline"
import { ROLE, UPLOADMESSAGE } from "@/lib/types"
import MarkdownViewer from "./Markdown"

export function ChatInterface2() {
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
            <div  key={message.id} className={`flex ${message.Sender === "USER" ? "justify-end" : "justify-start"}`}>
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
    <div className="flex-1 flex flex-col bg-gradient-to-b from-white/50 to-slate-50/30 shadow-md  h-full max-h-screen">
      {/* Header */}
      <div className="border-b border-white/20 p-6 bg-white/80 backdrop-blur-xl shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200/30">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-slate-900 truncate">{chat?.topic}</h2>
            <div className="flex items-center space-x-2 mt-1">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
              <p className="text-sm text-slate-600">AI-powered document chat active</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {chat?.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Card className="p-8 max-w-md text-center bg-white/70 backdrop-blur-sm border-white/20 shadow-xl shadow-slate-200/20">
              <div className="mb-6">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200/30 mb-4">
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
        ) : (
          chat?.messages.map((message) => (
            <div key={message.id} className={`flex ${message.Sender === "USER" ? "justify-end" : "justify-start"}`}>
              <div className={`flex max-w-4xl ${message.Sender === "USER" ? "flex-row-reverse" : "flex-row"}`}>
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
                    message.Sender === "USER"
                      ? "bg-gradient-to-br from-blue-600 to-blue-700 ml-4 shadow-blue-200/30"
                      : "bg-gradient-to-br from-slate-600 to-slate-700 mr-4 shadow-slate-200/30"
                  }`}
                >
                  {message.Sender === "USER" ? (
                    <User className="h-5 w-5 text-white" />
                  ) : (
                    <Bot className="h-5 w-5 text-white" />
                  )}
                </div>
                <div
                  className={`px-6 py-4 rounded-2xl shadow-lg backdrop-blur-sm ${
                    message.Sender === "USER"
                      ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-blue-200/30"
                      : "bg-white/80 border border-white/20 text-slate-800 shadow-slate-200/20"
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
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
          ))
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="flex max-w-4xl">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-slate-600 to-slate-700 mr-4 shadow-lg shadow-slate-200/30">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div className="px-6 py-4 rounded-2xl bg-white/80 border border-white/20 shadow-lg shadow-slate-200/20 backdrop-blur-sm">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                  <span className="text-sm text-slate-600">AI is thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-white/20 p-6 bg-white/80 backdrop-blur-xl">
        <form onSubmit={handleSubmit} className="flex space-x-4">
          <div className="flex-1 relative">
            <Input
              value={input}
                   onChange={(e)=>setinput(e.target.value)}
              placeholder="Ask anything about your document..."
              disabled={loading}
              className="h-12 pr-12 bg-white/70 border-slate-200 focus:border-blue-400 focus:ring-blue-400/20 rounded-xl shadow-sm"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Sparkles className="w-4 h-4 text-slate-400" />
            </div>
          </div>
          <Button
            type="submit"
            disabled={loading || !input.trim()}
            className="h-12 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-lg shadow-blue-200/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
