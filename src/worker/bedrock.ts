import { ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { bedrockClient } from "./config";
import { TextDetection } from "@aws-sdk/client-rekognition";

const MODEL_ID = "anthropic.claude-3-5-sonnet-20240620-v1:0";

export async function evaluateLabelWithClaude(
  imageBytes: Uint8Array,
  textDetections: TextDetection[],
  alcoholType: string
) {
  // Format the Rekognition output to something Claude can read easily
  const ocrData = textDetections.map((detection) => ({
    id: detection.Id,
    type: detection.Type, // LINE or WORD
    text: detection.DetectedText,
    parentId: detection.ParentId,
    // Add confidence or coordinates if helpful, but keep it brief for token limit
  }));

  const systemPrompt = `You are a TTB label verification assistant. You must analyze the provided label image and the OCR data (which contains text and their polygon IDs).
Your goal is to extract key information required for TTB Form 5100.31 based on the alcohol type: ${alcoholType}.

You must return a JSON object containing the checklist items. Each checklist item should include a 'value' (the extracted text), and a 'polygon_id' (the exact Id from the OCR data that corresponds to the text, if found). If the text is heavily stylized and OCR missed it but you can read it, provide 'value' and leave 'polygon_id' null.

Expected checklist items (depending on alcohol type, but generally):
- Brand Name
- Class/Type Designation
- Net Contents
- Alcohol Content
- Government Warning

Return ONLY valid JSON.`;

  const command = new ConverseCommand({
    modelId: MODEL_ID,
    messages: [
      {
        role: "user",
        content: [
          {
            image: {
              format: "png", // or "jpeg" depending on the file, let's assume Claude handles auto-detect or we can pass a generic format. Claude supports jpeg, png, gif, webp.
              source: {
                bytes: imageBytes,
              },
            },
          },
          {
            text: `OCR Data:\n${JSON.stringify(ocrData, null, 2)}`,
          },
        ],
      },
    ],
    system: [{ text: systemPrompt }],
    toolConfig: {
      tools: [
        {
          toolSpec: {
            name: "submit_verification_result",
            description: "Submit the final JSON result of the label verification.",
            inputSchema: {
              json: {
                type: "object",
                properties: {
                  brand_name: {
                    type: "object",
                    properties: {
                      value: { type: "string" },
                      polygon_id: { type: ["number", "null"] },
                    },
                  },
                  class_type: {
                    type: "object",
                    properties: {
                      value: { type: "string" },
                      polygon_id: { type: ["number", "null"] },
                    },
                  },
                  net_contents: {
                    type: "object",
                    properties: {
                      value: { type: "string" },
                      polygon_id: { type: ["number", "null"] },
                    },
                  },
                  alcohol_content: {
                    type: "object",
                    properties: {
                      value: { type: "string" },
                      polygon_id: { type: ["number", "null"] },
                    },
                  },
                  government_warning: {
                    type: "object",
                    properties: {
                      value: { type: "boolean" },
                      polygon_id: { type: ["number", "null"] },
                    },
                  },
                },
              },
            },
          },
        },
      ],
      toolChoice: {
        tool: {
          name: "submit_verification_result",
        },
      },
    },
  });

  try {
    const response = await bedrockClient.send(command);
    
    if (response.output?.message?.content) {
      const toolUse = response.output.message.content.find((c) => c.toolUse);
      if (toolUse && toolUse.toolUse) {
        return toolUse.toolUse.input;
      }
    }
    
    throw new Error("No tool use found in response");
  } catch (error) {
    console.error("Error calling Bedrock:", error);
    throw error;
  }
}
