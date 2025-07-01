import { createContext, ReactNode, useContext, useState } from "react"

type ChatContextType ={
    activeChatId : string | null,
    chats : Record<string,string[]>,
    selectChat: (id:string) => void,
    addMessages :(message:string)=>void,
    currentMessages: string[]
}
export const ChatContext = createContext<ChatContextType| undefined>(undefined)
export const ChatProvider = ({children}:{children:ReactNode})=>{
  const [chats, setchats] = useState<Record<string, string[]>>({});
    const [activeChatId, setactiveChatId] = useState<string| null>(null);
    
    function selectChat(id:string) {
        setactiveChatId(id);
        setchats(prev=>({
            ...prev,
            [id]:prev[id] || []
        }));
    }
    function addMessages(message:string){
        if(!activeChatId) return;
        setchats(prev=>({
            ...prev,
            [activeChatId]: [...(prev[activeChatId] || []) ,message]
        }))
    }
    const currentMessages= activeChatId ? chats[activeChatId] : [];
    return (
        <ChatContext.Provider value={{selectChat,addMessages,chats,activeChatId,currentMessages}}>
            {children}
        </ChatContext.Provider>
    )
}
export const UseChat=()=>{
    const context= useContext(ChatContext);
    if (!context) throw new Error("CONTEXT IS NOT DEFINED")
    return context;
    
}