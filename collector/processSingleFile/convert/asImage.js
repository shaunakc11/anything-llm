const path = require("path");
const { tokenizeString } = require("../../utils/tokenizer");
const { S3Service } = require("../../utils/s3");
const { TextractService } = require("../../utils/textract");
const prisma = require("../../utils/prisma");

//TODO: remove unused variables
async function asImage({ fullFilePath = "", filename = "", uploadedFile }) {
  const BUCKET_NAME = process.env.S3_BUCKET_NAME;
  if (!BUCKET_NAME) {
    return {
      success: false,
      reason: "Missing environment variables for Document Intelligence.",
    };
  }
  try {
    console.log(`-- Working ${uploadedFile.title} --`);
    const s3Service = new S3Service();
    const textractService = new TextractService();

    const extractedText = await textractService.analyzeS3Document(
      BUCKET_NAME,
      `${uploadedFile.storageKey}-${uploadedFile.title}`
    );
    const fileNameWithoutExt = path.parse(uploadedFile.title).name;
    const pageContentParams = {
      Bucket: BUCKET_NAME,
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

    return { success: true, reason: null, documents: [data] };
  } catch (error) {
    console.error("An error occurred while processing the document:", error);
    return { success: false, reason: "Error processing the document." };
  }
}

module.exports = asImage;
