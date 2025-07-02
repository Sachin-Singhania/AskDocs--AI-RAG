"use server"

import { $Enums } from "../generated/prisma";
import { prisma } from "../prisma";
import { UPLOADMESSAGE } from "../types";

export async function uploadMessage(message:UPLOADMESSAGE){
  try {
    const res=await prisma.message.create({
      data:{
        content : message.message,
        Sender: message.role,
        chatId:message.chatId,
      },select:{
        content : true,
        Sender:true,
        id:true,
      }
    });
    return res
  } catch (error) {
     console.error("Error uploading message:", error);
  }
}

export async function getChats(userId:string): Promise<{
    id: string;
    topic: string;
    collectionName: string | null;
    type: $Enums.TYPE;
    messages: {
        id: string;
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
                messages:{
                  select:{
                    content :true,
                    Sender: true,
                    id: true
                  }
                },
                collectionName:true,
                topic:true,
                type:true
            }
        })
        return chats;
    } catch (error) {
        console.log(error);
    }
}

