"use server";
import { S3Client, PutObjectCommand, CreateBucketCommand, HeadBucketCommand } from "@aws-sdk/client-s3";
import redis from '@/lib/redis';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from "../prisma";
import { useSession } from "next-auth/react";
import { CreateTopic } from "./rag-pipeline";

/**
 * Upload buffer to S3
 */
async function UploadToS3(
  buffer: Buffer,
  key: string,
  contentType: string,
): Promise<string | undefined> {
  try {
    const s3 = new S3Client({
      region: "us-east-1",
      endpoint: "http://localhost:4566",
      credentials: {
        accessKeyId: "test",
        secretAccessKey: "test"
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

    const data = await s3.send(new PutObjectCommand(params));
    console.log("File uploaded successfully:", data);
    // const path =  https://${bucket}.s3.${region}.amazonaws.com/${key}; for aws s3
    const path = `http://localhost:4566/rag-chat-bucket/${key}`;
    return path;

  } catch (error) {
    console.error("Error uploading to S3:", error);
    throw new Error("Failed to upload file to S3: " + error);
  }
}

async function UploadToRedis(
  metadata:  FileMetadata | URLMetadata,
): Promise<boolean> {
  try {
    const QUEUE_NAME = 'task_queue';
    await redis.lPush(QUEUE_NAME, JSON.stringify(metadata));
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
  try {
    if (!file) {
      console.error("No file provided");
      return { status: "error", message: "No file provided" };
    }
    const userId = await checkLimit();
    const nameParts = file.name.split('.');
    const topic= await CreateTopic(file.name);
    const chat= await prisma.chat.create({
      data: {
        status: "WAITING",
        topic:topic? topic: nameParts[0],type: "PDF",userId,
      },
    })
    const extension = nameParts[nameParts.length-1] || 'bin';
    const key = `${uuidv4()}.${extension}`;

    const arrayBuffer = await file.arrayBuffer();
    

    const nodeBuffer = Buffer.from(arrayBuffer);
   

    const s3Path = await UploadToS3(nodeBuffer, key, file.type || `application/${extension}`);
    if (!s3Path) {
      throw new Error("Failed to upload file to S3");
    }

    console.log("File uploaded to S3:", s3Path);

    const fileMetadata : FileMetadata = {
      name: nameParts[0],
      path: s3Path,
      type: "pdf",
      key,
      chatId: chat.id,
    };

    const redisResult = await UploadToRedis(fileMetadata);
    if (!redisResult) {
      console.error("Redis upload failed");
      return { status: "error", message: "Failed to queue metadata in Redis" };
    }

    console.log("File metadata uploaded to Redis");

    return {
      status: "success",
      message: "File processed successfully",
    };

  } catch (error) {
    console.error("Unexpected error processing file:", error);
    return {
      status: "error",
      message: "Unexpected server error during processing",
    };
  }
}
async function ensureBucketExists(s3: S3Client, bucketName: string) {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucketName }));
    console.log(`Bucket ${bucketName} already exists`);
  } catch (err: any) {
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
      console.log(`Bucket ${bucketName} not found. Creating...`);
      await s3.send(new CreateBucketCommand({ Bucket: bucketName }));
      console.log(`Bucket ${bucketName} created`);
    } else {
      console.error('Error checking bucket:', err);
      throw err;
    }
  }
}
export async function processUrl(
  url: string
): Promise<{ status: string; message: string }> {
  try {
    if (!url) {
      console.error("No URL provided");
      return { status: "error", message: "No URL provided" };
    }
    const userId= await checkLimit();
    const uri= new URL(url);
    const hostname= uri.hostname.split(".");
    hostname.pop();
    let final= hostname.join(".")
    const {message,status,collectionName}=await checkIfURLExsists(uri.origin);
    const topic= await CreateTopic(uri.origin);
    if (status) {
      console.log(message);
      const chat= await prisma.chat.create({
      data: {
        status: "COMPLETED",collectionName,
        topic:topic ? topic : final,type: "URL",userId,
      },
    })
     return {
      status: "success",
      message: "URL processed successfully",
    };
    }
    
    
    const chat= await prisma.chat.create({
      data: {
        status: "WAITING",
        topic: "",type: "URL",userId,
      },
    })
   const metadata : URLMetadata = {
         url,
        type: "url",
        chatId: chat.id,
        };
        
    const redisResult = await UploadToRedis(metadata);
    if (!redisResult) {
      console.error("Redis upload failed");
      throw new Error("Failed to queue URL metadata in Redis");
    }
    console.log("URL metadata uploaded to Redis");
    return {
      status: "success",
      message: "URL processed successfully",
    };
    }
    catch (error) {
    console.error("Unexpected error processing URL:", error);
    return {
      status: "er",
      message: "Unexpected server error during URL processing",
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
      console.error("URL already exists in the database");
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
async function checkLimit() {
  try {
    const email = useSession().data?.user?.email;
    if (!email) {
      throw new Error("User email not found in session");
    }

    const user= await prisma.user.findUnique({
      where: { email },
      select:{
        limit: true,
        id: true,
      }
    });
    if (!user) {
    console.error("User not found in database");
    throw new Error("User not found in database");
  }
  if (user.limit && user.limit <= 0) {
    console.error("User has reached their limit");
    throw new Error("User has reached their limit");
  }
    await prisma.user.update({
      where: { email },
      data: {
        limit: {
          decrement: 1,
        },
      },
    });
    console.log("User limit decremented successfully");
    return user.id;
  } catch (error) {
    console.error("Error checking user limit:", error);
    throw new Error("Error checking user limit: " + error);
  }
}



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
