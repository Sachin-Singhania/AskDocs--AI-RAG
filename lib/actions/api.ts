"use server"

import { $Enums } from "../generated/prisma";
import { prisma } from "../prisma";

async function uploadMessage(message:UPLOADMESSAGE){
  try {
    await prisma.message.create({
      data:{
        content : message.message,
        Sender: message.role,
        chatId:message.chatId,
      }
    })
  } catch (error) {
     console.error("Error uploading message:", error);
  }
}

async function getChats(userId:string): Promise<{
    id: string;
    topic: string;
    collectionName: string | null;
    messages: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        chatId: string;
        content: string;
        Sender: $Enums.Sender;
    }[];
}[] | undefined>{
    try {
        const chats=await prisma.chat.findMany({
            where:{
                userId,
                status:"COMPLETED"
            },select:{
                id : true,
                messages:true,
                collectionName:true,
                topic:true,
            }
        })
        return chats;
    } catch (error) {
        console.log(error);
    }
}

