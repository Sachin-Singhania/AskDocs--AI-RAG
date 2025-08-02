import { $Enums, Sender } from '@prisma/client'
import { create } from 'zustand'

type ChatStore = {
  chats: Record<string, Chat>
  activeChatId: string | null
  selectChat: (id: string | null) => void
  addMessages: (chatId: string, message: Message) => void
  setChats: (newChats:Chat[]) => void

}
type Message = {
  id: string
  content: string
  Sender: Sender
}

export type Chat = {
  id: string
  topic: string
  collectionName: string | null
  messages: Message[]
  type: $Enums.TYPE;
}
export const useChatStore = create<ChatStore>((set, get) => ({
  chats: {},
  activeChatId: null,

    selectChat: (id) => set({ activeChatId: id }),
  addMessages: (chatId: string ,message: Message) => {
    const activeId = get().activeChatId
    if (!activeId) return;
    if (chatId!=activeId) return;
    set((state) => ({
      chats: {
        ...state.chats,
        [activeId]: {
            ...state.chats[activeId],
            messages: [...(state.chats[activeId].messages || []),message]
        }
      }
    }))
  },
setChats: (newChats:Chat[]) => {
    const chatMap: Record<string, Chat> = {}
    newChats.forEach((chat) => {
      chatMap[chat.id] = chat
    })
    set({ chats: chatMap })
  },
  get currentChat() {
    const activeChatId = get().activeChatId;
    return activeChatId ? get().chats[activeChatId] : null;
  }
  
}))
