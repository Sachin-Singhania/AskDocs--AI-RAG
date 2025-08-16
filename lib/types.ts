export enum ROLE{
  USER = "USER",
  ASSISTANT = "ASSISTANT",
}
export interface UPLOADMESSAGE{
  chatId: string,
  message: string,
  role : ROLE,
}
export type FileMetadata = { name: string; type: "PDF"; key: string ;chatId: string }
export type URLMetadata = { url: string; type: "URL" ; chatId: string }

export interface MESSAGESSENTTOAI {
 role:ROLE,
 content:string
}
export interface MESSAGESSENTTOAI_WITHSUMMARY {
  messages: MESSAGESSENTTOAI[];
    ChatSummary?: string;
}
export interface SidebarProps {
  documentType: "pdf" | "url" | null
  setDocumentType: (type: "pdf" | "url" | null) => void
}
export interface DocumentProcessorProps {
  documentType: "pdf" | "url" | null
}
