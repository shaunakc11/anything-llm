const path = require("path");
const { tokenizeString } = require("../../utils/tokenizer");
const { S3Service } = require("../../utils/s3");
const prisma = require("../../utils/prisma");

//TODO: remove unused variables
async function asTxt({ fullFilePath = "", filename = "", uploadedFile }) {
  const bucketName = process.env.S3_BUCKET_NAME;
  if (!bucketName) {
    return {
      success: false,
      reason: "Missing environment variables for Document Intelligence.",
    };
  }
  console.log(`-- Working ${filename} --`);

  const s3Service = new S3Service();
  const fileContents = await s3Service.getObject({
    Bucket: bucketName,
    Key: `${uploadedFile.storageKey}-${uploadedFile.title}`,
  });

  const fileNameWithoutExt = path.parse(uploadedFile.title).name;

  const pageContentParams = {
    Bucket: bucketName,
    Key: `pageContents/${uploadedFile.storageKey}-${fileNameWithoutExt}.txt`,
    Body: fileContents,
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
      wordCount: fileContents.split(" ").length,
      tokenCountEstimate: tokenizeString(fileContents).length,
    },
    where: {
      id: uploadedFile.id,
    },
  });

  console.log(
    `[SUCCESS]: ${uploadedFile.title} converted & ready for embedding.\n`
  );
  return { success: true, reason: null, documents: [data] };
}

module.exports = asTxt;
