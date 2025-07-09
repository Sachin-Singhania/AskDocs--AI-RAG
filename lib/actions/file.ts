"use server";
import { S3Client, PutObjectCommand, CreateBucketCommand, HeadBucketCommand } from "@aws-sdk/client-s3";
import redis from '@/lib/redis';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from "../prisma";
import { CreateTopic } from "./rag-pipeline";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { FileMetadata, URLMetadata } from "../types";
import { IsProcessing, rate_limit_action_function } from "./api";

/**
 * Upload buffer to S3
 */

class LimitExceededError extends Error {
  constructor(message: string = "User limit exceeded") {
    super(message);
    this.name = "LimitExceededError";
  }
}

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
    rate_limit_action_function();
      const data = await getServerSession(authOptions);
    console.log(data?.user);
    if (!data?.user?.userId) {
      throw new Error("User ID not found in session");
    }
    const response=await IsProcessing(data.user.userId);
    if(response){
      return { status:"error", message:"Already Processing a file"}
    }
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
      type: "PDF",
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

  } catch (error:any) {
    console.error("Unexpected error processing file:", error);
    if(error.name!="LimitExceededError"){
      await increaseLimit();
    }
    return {
      status: "error",
      message: error.name,
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
    rate_limit_action_function();
    const data = await getServerSession(authOptions);
    if (!data?.user?.userId) {
      throw new Error("User ID not found in session");
    }
    const response=await IsProcessing(data.user.userId);
    if(response){
      return { status:"error", message:"Already Processing a file"}
    }
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
      await prisma.chat.create({
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
        topic: topic ? topic : final,type: "URL",userId,
      },
    })
   const metadata : URLMetadata = {
         url,
        type: "URL",
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
    catch (error:any) {
    console.error("Unexpected error processing URL:", error);
     if(error.name!="LimitExceededError"){
      await increaseLimit();
    }
    return {
      status: "error",
      message: error.name,
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
    const data = await getServerSession(authOptions);
    console.log(data?.user);
    if (!data?.user?.email) {
      throw new Error("User email not found in session");
    }
    const email= data.user.email;

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
    throw new LimitExceededError();
  }
}



async function increaseLimit() {
    try {
    const data = await getServerSession(authOptions);
    console.log(data?.user);
    if (!data?.user?.email) {
      throw new Error("User email not found in session");
    }
    const email= data.user.email;

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
    await prisma.user.update({
      where: { email },
      data: {
        limit: {
          increment: 1,
        },
      },
    });
    console.log("User limit Incremented successfully");
    return user.id;
  } catch (error) {
    console.error("Error checking user limit:", error);
  }
}