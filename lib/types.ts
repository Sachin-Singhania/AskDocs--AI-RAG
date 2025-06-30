enum Role{
  USER = "USER",
  ASSISTANT = "ASSISTANT",
}
interface UPLOADMESSAGE{
  chatId: string,
  message: string,
  role : Role,
}
type FileMetadata = { name: string; path: string; type: string; key: string ;chatId: string }
type URLMetadata = { url: string; type: "url" ; chatId: string }