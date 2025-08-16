import { useChatStore } from "@/store/store";
import { MessageSquare } from "lucide-react";
import { Card } from "./card";

export function ChatHistory() {
   const { chats, selectChat, activeChatId } = useChatStore();
  let chatHistory = Object.values(chats);

  return (
    <div className="flex-1 mt-8">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-slate-800 mb-1 flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Recent Chats
        </h2>
        <p className="text-xs text-slate-500">Your conversation history</p>
      </div>

      {/* Chat List */}
      <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent hover:scrollbar-thumb-slate-400">
        {chatHistory.length > 0 ? (
          chatHistory.map((chat) => (
            <Card
              key={chat.id}
              className={`p-3 cursor-pointer transition-all duration-200 border hover:shadow-md hover:shadow-slate-200/20 group ${
                activeChatId === chat.id
                  ? "border-blue-400 bg-blue-50/50 shadow-md shadow-blue-100/30"
                  : "border-slate-200/50 bg-white/40 hover:bg-white/70 hover:border-slate-300/50"
              }`}
              onClick={() => selectChat(chat.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-slate-900 truncate group-hover:text-slate-800">
                    {chat.topic}
                  </h4>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm text-slate-500 mb-1">No conversations yet</p>
            <p className="text-xs text-slate-400">Start by processing a document</p>
          </div>
        )}
      </div>

    </div>
  )
}