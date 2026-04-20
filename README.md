# TTB Label Verification App

This repository contains the prototype for the automated intake and review of Alcohol and Tobacco Tax and Trade Bureau (TTB) labels. Designed for high-speed, human-in-the-loop verification, it leverages optical character recognition (OCR) and generative AI to read label images, extract mandated information (such as Brand Name, Alcohol Content, and Government Warnings), and map them back to the original image for expedited human review.

## 🏗️ Architecture & AWS Infrastructure

While the user interface and core application logic are still undergoing active development, the underlying **infrastructure is production-grade and entirely built on AWS**. 

The architecture was intentionally designed for security, to scale with application load, and to have strict compliance with government standards:

- **Complete AWS Ecosystem:** The application and its worker components are deployed entirely within an **AWS Virtual Private Cloud (VPC)**. This ensures that no data traverses the public internet unnecessarily, maintaining data sovereignty and security.
- **IAM Permissions:** All services utilize AWS Identity and Access Management (IAM) roles, adhering to the principle of least privilege.
- **Decoupled Processing:** 
  - The frontend and API are powered by a **Next.js (App Router)** server.
  - The heavy lifting (OCR and AI inference) is handled asynchronously by a dedicated **Node.js Worker process**.
  - The two are decoupled using **Amazon SQS** for reliable message queueing and load management.
- **Secure Storage & Database:** 
  - Label images are stored in **Amazon S3** and are only accessed via secure, time-limited Pre-signed URLs.
  - State and metadata are persisted in an **Amazon RDS for PostgreSQL** instance using strict SSL connections and the Prisma ORM.

## 🛡️ AI Policy Resilience

A major consideration for this project was navigating the evolving landscape of government AI policies. Which AI providers are permitted or banned can change rapidly. 

To future-proof the application, all AI capabilities are routed exclusively through **Amazon Bedrock**. By keeping the inference engine strictly within the AWS perimeter:
1. **Data Security:** Private unapproved label data never leaves the AWS environment to hit external SaaS APIs.
2. **Provider Agnostic:** The application can seamlessly pivot between foundation models (e.g., from Anthropic's Claude 3.5 Sonnet to Amazon's Nova Pro or Meta's Llama) simply by changing an Inference Profile ID. This makes the system resilient to government changes regarding authorized AI vendors.

The initial image processing is also handled natively via **Amazon Rekognition** to provide bounding box coordinates before the LLM steps in, minimizing the heavy lifting required by the foundation model.

## 💻 Tech Stack

- **Frontend & API:** Next.js (App Router), React, TypeScript
- **Styling:** Tailwind CSS, ShadCN UI.
- **Database:** PostgreSQL (Amazon RDS), Prisma ORM
- **Cloud Infrastructure:** AWS S3, AWS SQS, AWS Rekognition, AWS Bedrock

## 🚀 Getting Started

To run the application locally, you will need two terminal windows to run both the web server and the background worker.

First, ensure your `.env` file is populated with your AWS credentials and database connection string.

**1. Start the Next.js Web Server:**
```bash
npm install
npm run dev
```
The application will be available at [http://localhost:3000](http://localhost:3000).

**2. Start the Background AI Worker:**
```bash
npm run worker
```
The worker will begin polling the SQS queue and processing submitted applications using Rekognition and Bedrock.
