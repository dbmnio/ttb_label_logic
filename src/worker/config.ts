import { SQSClient } from "@aws-sdk/client-sqs";
import { RekognitionClient } from "@aws-sdk/client-rekognition";
import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import { S3Client } from "@aws-sdk/client-s3";

const region = process.env.AWS_REGION || "us-east-1";

export const sqsClient = new SQSClient({ region });
export const rekognitionClient = new RekognitionClient({ region });
export const bedrockClient = new BedrockRuntimeClient({ region });
export const s3Client = new S3Client({ region });

export const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL || "";
