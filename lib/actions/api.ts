"use server"

import { headers } from "next/headers";
import { prisma } from "../prisma";
import { ratelimit } from "../redis";
import { UPLOADMESSAGE } from "../types";
import { $Enums } from "@prisma/client";


export async function rate_limit_action_function() {
   const ip = (await headers()).get('x-forwarded-for') ?? 'unknown';
    console.log(`Request from IP: ${ip}`);
  const { success, limit, remaining } = await ratelimit.limit(ip);

  if (!success) {
    throw new Error('Too Many Requests', {cause : { status: 429 } });
  }

  return {
    limit,
    remaining,
  }
}
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

export async function IsProcessing(userId:string){
try {
  const count = await prisma.chat.count({
  where: {
    userId,
    status: "PROCESSING"
  }
});
   if (count>=2){
    return true;
   }else{
    return false;
   }
} catch (error) {
    throw new Error("Error While Calling DB");
}
}