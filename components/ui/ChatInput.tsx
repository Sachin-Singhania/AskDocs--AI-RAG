"use client"
import { Send, Sparkles } from "lucide-react";
import { Input } from "./input";
import { Button } from "./button";
import { useState } from "react";

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
