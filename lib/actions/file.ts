"use server";
import { S3Client, PutObjectCommand, CreateBucketCommand, HeadBucketCommand } from "@aws-sdk/client-s3";
import redis from '@/lib/redis';
import { v4 as uuidv4 } from 'uuid';

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

    await ensureBucketExists(s3, "rag-chat-bucket");

    const params = {
      Bucket: "rag-chat-bucket",
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
    return undefined;
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

/**
 * Main file processing function
 */
export async function processFile(
  file: File
): Promise<{ status: string; message: string }> {
  try {
    if (!file) {
      console.error("No file provided");
      return { status: "error", message: "No file provided" };
    }
    const nameParts = file.name.split('.');
    const extension = nameParts[nameParts.length-1] || 'bin';
    const key = `${uuidv4()}.${extension}`;

    const arrayBuffer = await file.arrayBuffer();
    if (!arrayBuffer) {
      console.error("Could not read file data");
      return { status: "error", message: "Could not read file data" };
    }

    const nodeBuffer = Buffer.from(arrayBuffer);
    if (!nodeBuffer || !nodeBuffer.length) {
      console.error("Buffer conversion failed");
      return { status: "error", message: "Buffer conversion failed" };
    }

    const s3Path = await UploadToS3(nodeBuffer, key, file.type || `application/${extension}`);
    if (!s3Path) {
      console.error("S3 upload failed");
      return { status: "error", message: "Failed to upload to S3" };
    }

    console.log("File uploaded to S3:", s3Path);

    const fileMetadata : FileMetadata = {
      name: nameParts[0],
      path: s3Path,
      type: "pdf",
      key,
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

    const metadata : URLMetadata = {
         url,
        type: "url",
        };
    const redisResult = await UploadToRedis(metadata);
    if (!redisResult) {
      console.error("Redis upload failed");
      return { status: "error", message: "Failed to queue URL metadata in Redis" };
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
type FileMetadata = { name: string; path: string; type: string; key: string }
type URLMetadata = { url: string; type: "url" }