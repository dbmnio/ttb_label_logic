Here is a complete technical recap of the architecture and pipeline we designed for the TTB label verification app. 

### 1. The Core Architecture (Lean & AWS-Native)
We optimized for a small user base (max 50 users) and operational simplicity, choosing a highly decoupled but cost-effective stack over heavy distributed systems bloat.

* **API & Web Server:** A Typescript, Next.js, Tailwind CSS, ShadCN application hosted on a single **Amazon ECS Fargate** container. This serves the frontend assets and handles the synchronous API requests. It uses Prisma for database access.
* **Database & State:** A single-AZ **Amazon RDS PostgreSQL** instance (specifically a `db.t4g` Graviton instance for cost-efficiency). 
    * *Concurrency:* Multi-user check-out states (the UI mutex) will be handled natively using standard row-level database locks (e.g., `SELECT ... FOR UPDATE`), eliminating the need for a separate caching layer like Redis.
* **Message Broker:** **Amazon SQS** sits between the API and the background processing to buffer burst loads (like massive `.zip` uploads).

### 2. The Asynchronous Data Pipeline
Instead of Step Functions and Lambdas, we opted for a traditional producer/consumer model to avoid execution timeouts and simplify the codebase.

* **The Worker:** A dedicated **ECS Fargate** task running constantly (with at least one container idling) that polls the SQS queue. This worker executes the extraction and evaluation scripts.  It is a Typescript application that uses Prisma. **It shares database files (interfaces, etc) with the web server to facilitate rapid, correct coding**
* **Deterministic Vision Layer:** **Amazon Rekognition** (`DetectText`) is used instead of Textract. Rekognition is built for "scene text" and can handle extreme angles, returning precise polygonal coordinate arrays for stylized label graphics.
* **Semantic AI Layer:** **Amazon Bedrock** Use claude sonnet 4.6 model in Bedrock. Bedrock handles the complex conditional logic of the verification checklist and outputs a strictly formatted JSON state.
* **The "Lookup Table" Pattern:** To prevent the LLM from hallucinating geometric coordinates, the worker passes both the image and the Rekognition JSON array to the LLM. The LLM identifies the concept (e.g., "Brand Name") and returns the exact `polygon_id` from the Rekognition data, ensuring the UI gets a pixel-perfect bounding box.

### 3. The Bounding Box Fallback Mechanism
For edge cases where Rekognition completely fails to extract heavily distorted or stylized text, but the LLM is still able to read it semantically, the system gracefully degrades.

* **Normalized Coordinate Generation:** The LLM prompt includes instructions to output an approximate bounding box using normalized coordinates (0-1000 scale) if no matching string exists in the Rekognition array.
* **Visual Differentiation:** The UI translates these coordinates but renders the highlight distinctly to communicate uncertainty to the worker. Instead of a solid, bright border, the UI uses a dashed/dotted border, a muted color, or a semi-transparent "spotlight" effect.
* **UX Goal:** Even though the box isn't pixel-perfect, it successfully directs the worker's eyes to the correct quadrant of the label, drastically reducing visual search time and maintaining their momentum.

### 4. CI/CD

* Use amazon native CI/CD tools for ease of implementation. Use Github as the code repository location.

### 5. Authentication
