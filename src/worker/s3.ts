import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "./config";

export async function getImageBytesFromS3(bucket: string, key: string): Promise<Uint8Array> {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const response = await s3Client.send(command);
  
  if (!response.Body) {
    throw new Error("Failed to get image body from S3");
  }

  const byteArray = await response.Body.transformToByteArray();
  return byteArray;
}
