import { DetectTextCommand, TextDetection } from "@aws-sdk/client-rekognition";
import { rekognitionClient } from "./config";

export async function detectTextFromS3(bucket: string, key: string): Promise<TextDetection[]> {
  const command = new DetectTextCommand({
    Image: {
      S3Object: {
        Bucket: bucket,
        Name: key,
      },
    },
  });

  const response = await rekognitionClient.send(command);
  return response.TextDetections || [];
}
