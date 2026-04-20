import { ReceiveMessageCommand, DeleteMessageCommand } from "@aws-sdk/client-sqs";
import { sqsClient, SQS_QUEUE_URL } from "./config";
import { getImageBytesFromS3 } from "./s3";
import { detectTextFromS3 } from "./rekognition";
import { evaluateLabelWithClaude } from "./bedrock";
import { prisma } from "../lib/prisma";

const S3_BUCKET = process.env.S3_BUCKET_NAME || "ttb-label-images";

async function processMessage(messageBody: string) {
  const payload = JSON.parse(messageBody);
  const applicationId = payload.applicationId;

  if (!applicationId) {
    throw new Error("applicationId missing from message body");
  }

  // 1. Fetch Application & Labels
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { images: true },
  });

  if (!application) {
    throw new Error(`Application ${applicationId} not found`);
  }

  // Update status to PROCESSING
  await prisma.application.update({
    where: { id: applicationId },
    data: { status: "PROCESSING" },
  });

  // For this prototype, we'll process the FRONT label
  const frontLabel = application.images.find((img) => img.type === "FRONT") || application.images[0];
  if (!frontLabel) {
    throw new Error(`No images found for application ${applicationId}`);
  }

  const s3Key = frontLabel.s3_key;

  try {
    // 2. Fetch Image from S3
    const imageBytes = await getImageBytesFromS3(S3_BUCKET, s3Key);

    // 3. AWS Rekognition (OCR)
    const textDetections = await detectTextFromS3(S3_BUCKET, s3Key);

    // 4. AWS Bedrock (Claude 3.5 Sonnet)
    const checklistResult = await evaluateLabelWithClaude(imageBytes, textDetections, application.alcohol_type);

    // 5. Store Verification Result and set to READY
    await prisma.verificationResult.create({
      data: {
        application_id: applicationId,
        checklist_json: checklistResult as any,
        raw_ocr_json: textDetections as any,
      },
    });

    await prisma.application.update({
      where: { id: applicationId },
      data: { status: "READY" },
    });

    console.log(`Successfully processed application ${applicationId}`);
  } catch (error) {
    console.error(`Error processing application ${applicationId}:`, error);
    // You could revert status to PENDING or ERROR here depending on your needs.
    throw error; // Rethrow to ensure message is not deleted from SQS if processing failed.
  }
}

async function pollQueue() {
  console.log("Worker started, polling SQS...");
  while (true) {
    try {
      const receiveCommand = new ReceiveMessageCommand({
        QueueUrl: SQS_QUEUE_URL,
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: 20, // Long polling
      });

      const response = await sqsClient.send(receiveCommand);

      if (response.Messages && response.Messages.length > 0) {
        for (const message of response.Messages) {
          if (message.Body) {
            console.log("Received message:", message.MessageId);
            await processMessage(message.Body);

            const deleteCommand = new DeleteMessageCommand({
              QueueUrl: SQS_QUEUE_URL,
              ReceiptHandle: message.ReceiptHandle,
            });
            await sqsClient.send(deleteCommand);
            console.log("Message deleted:", message.MessageId);
          }
        }
      }
    } catch (error) {
      console.error("Error polling SQS:", error);
      // Backoff before retrying
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

pollQueue();
