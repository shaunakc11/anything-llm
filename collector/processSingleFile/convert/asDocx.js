const { DocxLoader } = require("langchain/document_loaders/fs/docx");
const { tokenizeString } = require("../../utils/tokenizer");
const { S3Service } = require("../../utils/s3");
const prisma = require("../../utils/prisma");
const path = require("path");
const fs = require("fs").promises;

// Define the temporary directory (e.g., 'temp' folder in your project)
const TEMP_DIRECTORY = path.join(__dirname, "temp");

// Function to ensure the temporary directory exists
async function ensureTempDirectory() {
  try {
    await fs.access(TEMP_DIRECTORY);
    // Directory exists
  } catch (error) {
    // Directory does not exist, create it
    await fs.mkdir(TEMP_DIRECTORY, { recursive: true });
    console.log(`Created temporary directory at ${TEMP_DIRECTORY}`);
  }
}

//TODO: remove unused variables
async function asDocX({ fullFilePath = "", filename = "", uploadedFile }) {
  const bucketName = process.env.S3_BUCKET_NAME;
  if (!bucketName) {
    return {
      success: false,
      reason: "Missing environment variables for Document Intelligence.",
    };
  }

  console.log(`-- Working ${filename} --`);
  const s3Service = new S3Service();
  const fileContents = await s3Service.getObject(
    {
      Bucket: bucketName,
      Key: `${uploadedFile.storageKey}-${uploadedFile.title}`,
    },
    false
  );

  const fileNameWithoutExt = path.parse(uploadedFile.title).name;

  // Ensure the temporary directory exists
  await ensureTempDirectory();

  const tempFilePath = path.join(
    TEMP_DIRECTORY,
    `${uploadedFile.storageKey}-${uploadedFile.title}`
  );

  // Write the file buffer to the temporary file
  await fs.writeFile(tempFilePath, fileContents);
  console.log(`Temporary file written to ${tempFilePath}`);

  const loader = new DocxLoader(tempFilePath);

  let pageContent = [];
  const docs = await loader.load();

  // Extract page content
  pageContent = docs
    .map((doc) => doc.pageContent)
    .filter((content) => content && content.length > 0);

  if (!pageContent.length) {
    console.error(`Resulting text content was empty for ${filename}.`);
    return {
      success: false,
      reason: `No text content found in ${filename}.`,
      documents: [],
    };
  }

  console.log(`-- Working ${filename} --`);

  const extractedText = pageContent.join("\n"); // Use newline for readability

  const pageContentParams = {
    Bucket: bucketName,
    Key: `pageContents/${uploadedFile.storageKey}-${fileNameWithoutExt}.txt`,
    Body: extractedText,
  };

  const pageContentUploadUrl = await s3Service.uploadFileToS3(
    undefined,
    undefined,
    undefined,
    pageContentParams
  );

  const data = await prisma.file.update({
    data: {
      pageContentUrl: pageContentUploadUrl,
      wordCount: extractedText.split(" ").length,
      tokenCountEstimate: tokenizeString(extractedText).length,
    },
    where: {
      id: uploadedFile.id,
    },
  });

  await fs.unlink(tempFilePath);
  console.log(`-- Temporary file ${tempFilePath} deleted --`);

  console.log(`[SUCCESS]: ${filename} converted & ready for embedding.\n`);
  return { success: true, reason: null, documents: [data] };
}

module.exports = asDocX;
