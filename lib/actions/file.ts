"use server";
import { S3Client, PutObjectCommand, CreateBucketCommand, HeadBucketCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from 'uuid';
import { prisma } from "../prisma";
import { CreateTopic } from "./rag-pipeline";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { FileMetadata, URLMetadata } from "../types";
import { IsProcessing, rate_limit_action_function } from "./api";
import { redis } from "../redis";

/**
 * Upload buffer to S3
 */

class LimitExceededError extends Error {
  constructor(message: string = "User limit exceeded") {
    super(message);
    this.name = "LimitExceededError";
  }
}
class S3Error extends Error {
  constructor(message: string) {
    super(message);
    this.name = "S3Error";
  }
}
class RedisError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RedisError";
  }
}

async function UploadToS3(
  buffer: Buffer,
  key: string,
  contentType: string,
) {
  try {
const s3 = new S3Client({
    region:  process.env.S3_REGION || "ap-south-1",
    credentials: {
      accessKeyId:  process.env.S3_ACCESS_KEY_ID || "test",
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY  || "test", 
    },
    forcePathStyle: true
  });
 

    await ensureBucketExists(s3, process.env.S3_BUCKET as string);

    const params = {
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    };

     await s3.send(new PutObjectCommand(params));
  } catch (error) {
    throw new S3Error("Failed to upload file to S3: " + error);
  }
}

async function UploadToRedis(
  metadata:  FileMetadata | URLMetadata,
): Promise<boolean> {
  try {
    const QUEUE_NAME = 'task_queue';
    await redis.lpush(QUEUE_NAME, JSON.stringify(metadata));
    console.log("File metadata uploaded to Redis:", metadata);
    return true;
  } catch (error) {
    console.error("Error uploading to Redis:", error);
    return false;
  }
}

export async function processFile(
  file: File
): Promise<{ status: string; message: string }> { 
  let chatId: string | undefined;
  let key: string | undefined;
  try {
    await rate_limit_action_function();

    if (!file) throw new Error("No file provided");
    if(file.type.toLowerCase()!== "application/pdf") throw new Error("Only PDF files are allowed");

    const data = await getServerSession(authOptions);
    if (!data?.user?.userId) {
      throw new Error("User ID not found in session");
    }

    // const response=await IsProcessing(data.user.userId);
    // if(response){
    //   return { status:"error", message:"Already Processing a file"}
    // }
    await checkLimit(data.user.userId);

    const nameParts = file.name.split('.');
    let topic;
    try {
      topic= await CreateTopic(file.name);
    } catch (error) {
      console.log("Error Getting Topic Name");
    }
    const arrayBuffer = await file.arrayBuffer();

    const chat= await prisma.chat.create({
      data: {
        status: "WAITING",
        topic:topic? topic: nameParts[0],type: "PDF",userId:data.user.userId,
      },
    })
    chatId = chat.id;

    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension !== 'pdf') {
      throw new Error('Only PDF extension is allowed');
    }
    key = `${uuidv4()}.${extension}`;
    const nodeBuffer = Buffer.from(arrayBuffer);
   

    await UploadToS3(nodeBuffer, key, file.type || `application/${extension}`);
   


    const fileMetadata : FileMetadata = {
      name: nameParts[0],
      type: "PDF",
      key,
      chatId,
    };

    const redisResult = await UploadToRedis(fileMetadata);
    if (!redisResult) {
      throw new RedisError("Failed to queue file metadata in Redis");
    }

    console.log("File metadata uploaded to Redis");

    return {
      status: "success",
      message: "File processed successfully",
    };
  } catch (error:any) {
    if(error instanceof LimitExceededError){
      return {
        status: "error",
        message: error.name,
      }
    }
    if( error instanceof S3Error || error instanceof RedisError) {
      if (error instanceof RedisError){
        if (key){
          try {
            await DeleteFromS3(key);
          } catch (error2) {
            if (error2 instanceof S3Error) {
              console.error("Error deleting file from S3:", error2.message);
            }
          }
        } 
      }
      if (chatId) {
        await prisma.chat.update({
          where: { id: chatId },
          data: { status: "FAILED" },
        });
      }
    }
    return {
      status: "error",
      message: "There was an error processing the file: Try again later" ,
    };
  }
}

async function ensureBucketExists(s3: S3Client, bucketName: string) {
  try {
    const headBucketCommand = new HeadBucketCommand({ Bucket: bucketName });
    await s3.send(headBucketCommand);
    console.log(`Bucket ${bucketName} already exists`);
  } catch (err: any) {
    console.log(err)
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
      console.log(`Bucket ${bucketName} not found. Creating...`);
      await s3.send(new CreateBucketCommand({ Bucket: bucketName }));
      console.log(`Bucket ${bucketName} created`);
    } else {
      throw err;
    }
  }
}

export async function processUrl(
  url: string
): Promise<{ status: string; message: string }> {
  let chatId: string | undefined;
  try {
    rate_limit_action_function();
    if (!url) {
      throw new Error("No URL provided");
    }
    const data = await getServerSession(authOptions);
    if (!data?.user?.userId) {
      throw new Error("User ID not found in session");
    }

    // const response=await IsProcessing(data.user.userId);
    // if(response){
    //   return { status:"error", message:"Already Processing a file"}
    // }
    await checkLimit(data.user.userId);
    
    const uri= new URL(url);
    const hostname= uri.hostname.split(".");
    hostname.pop();
    let final= hostname.join(".")
    const {message,status,collectionName}=await checkIfURLExsists(uri.origin);
    const topic= await CreateTopic(uri.origin);
    if (status) {
      console.log(message);
       await prisma.$transaction(async (tx) => {
         await tx.chat.create({
         data: {
           status: "COMPLETED",collectionName,
           topic:topic ? topic : final,type: "URL",userId:data.user.userId,
         },
       })
         await tx.user.update({
         where: {         id : data.user.userId
             },
         data: {
           limit: {
             decrement: 1,
           },
         },
       });
       })
     return {
      status: "success",
      message: "URL processed successfully",
    };
    }
    
    
    const chat= await prisma.chat.create({
      data: {
        status: "WAITING",
        topic: topic ? topic : final,type: "URL",userId: data.user.userId,
      },
    })
    chatId = chat.id;
   const metadata : URLMetadata = {
         url,
        type: "URL",
        chatId,
        };
        
    const redisResult = await UploadToRedis(metadata);
    if (!redisResult) {
      throw new Error("Failed to queue URL metadata in Redis");
    }
    console.log("URL metadata uploaded to Redis");
    return {
      status: "success",
      message: "URL processed successfully",
    };
    }
    catch (error:any) {
    console.error("Unexpected error processing URL:", error);
     if(error instanceof LimitExceededError){
      return {
        status: "error",
        message: error.name,
      }
    }
    if(error instanceof RedisError) {
      if (chatId) {
        await prisma.chat.update({
          where: { id: chatId },
          data: { status: "FAILED" },
        });
      }
    }
    return {
      status: "error",
      message: " There was an error processing the URL: Try again later" ,
    };
    }   
}

async function checkIfURLExsists(url: string) {
  try {
    const urlCreate=await prisma.uRL.findFirst({
          where:{
            url,
          },select:{
            collectionName: true,
          }
        });
    if (urlCreate) {
      return {
        status: true,
        message: "URL already exists in the database",
        collectionName: urlCreate.collectionName,
      }
    }else{
      console.log("URL does not exist in the database");
      return {
        status: false,
        message: "URL does not exist in the database",
      }
    }
  } catch (error) {
    throw new Error("Error checking URL existence in the database: " + error);
  }
}


async function checkLimit(userId: string) {
  try {
    const user= await prisma.user.findUnique({
      where: { 
        id : userId
       },
      select:{
        limit: true,
        id: true,
      }
    });
    if (!user) {
    throw new Error("User not found in database");
  }
  if (user.limit && user.limit <= 0) {
        throw new LimitExceededError();
  }

    return user.id;
  } catch (error) {
    console.error("Error checking user limit:", error);
    if (error instanceof LimitExceededError) {
      throw error;
    } else {
      throw new Error("Error checking user limit: " + error);
    }
  }
}



// async function increaseLimit() {
//     try {
//     const data = await getServerSession(authOptions);
//     console.log(data?.user);
//     if (!data?.user?.email) {
//       throw new Error("User email not found in session");
//     }
//     const email= data.user.email;

//     const user= await prisma.user.findUnique({
//       where: { email },
//       select:{
//         limit: true,
//         id: true,
//       }
//     });
//     if (!user) {
//     console.error("User not found in database");
//     throw new Error("User not found in database");
//   }
//     await prisma.user.update({
//       where: { email },
//       data: {
//         limit: {
//           increment: 1,
//         },
//       },
//     });
//     console.log("User limit Incremented successfully");
//     return user.id;
//   } catch (error) {
//     console.error("Error checking user limit:", error);
//   }
// }


async function DeleteFromS3(key: string) {
    try {
  const s3 = new S3Client({
    region:  process.env.S3_REGION || "ap-south-1",
    credentials: {
      accessKeyId:  process.env.S3_ACCESS_KEY_ID || "test",
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY  || "test", 
    },
    forcePathStyle: true
  });
    const deleteCommand = new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key
    });
    await s3.send(deleteCommand);
    console.log(`PDF with key ${key} deleted from S3 successfully`);
  } catch (error) {
    console.error(`Error deleting PDF with key ${key} from S3:`, error);
     throw new S3Error(`Error deleting PDF from S3: ${error}`);
  }
}
