const { v4 } = require("uuid");
const { DocumentAnalysisClient, AzureKeyCredential } = require("@azure/ai-form-recognizer");
const fs = require("fs");
const { writeToServerDocuments, createdDate, trashFile } = require("../../utils/files");
const { tokenizeString } = require("../../utils/tokenizer");
const { default: slugify } = require("slugify");
const path = require("path")



async function asDocX({ fullFilePath = "", filename = "" }) {
  const DOCUMENT_INTELLIGENCE_ENDPOINT = process.env.DOCUMENT_INTELLIGENCE_ENDPOINT
  const DOCUMENT_INTELLIGENCE_KEY = process.env.DOCUMENT_INTELLIGENCE_KEY
  if (!DOCUMENT_INTELLIGENCE_ENDPOINT || !DOCUMENT_INTELLIGENCE_KEY) {
    return { success: false, reason: "Missing environment variables for Document Intelligence." };
  }
  try {
    const client = new DocumentAnalysisClient(
      DOCUMENT_INTELLIGENCE_ENDPOINT,
      new AzureKeyCredential(DOCUMENT_INTELLIGENCE_KEY)
    );
    const file = fs.createReadStream(fullFilePath);

    const poller = await client.beginAnalyzeDocument("prebuilt-read", file);

    const { pages } = await poller.pollUntilDone();

    let extractedText = "";

    for (const page of pages) {
      for (const line of page.lines) {
        extractedText += line.content + "\n";
      }
    }

    console.log(`-- Working ${filename} --`);

    const destinationDirectory = path.resolve(__dirname, "../../../server/storage/downloadFiles");

    const destinationPath = path.join(destinationDirectory, filename);

    // Ensure destination directory exists
    try {
      fs.mkdirSync(destinationDirectory, { recursive: true });
    } catch (err) {
      console.error("Could not create destination directory!", err);
      return {
        success: false,
        reason: `Failed to create destination directory.`,
        documents: [],
      };
    }

    // Write the content to the new file
    try {
      // fs.writeFileSync(destinationPath, content, "utf8");
      fs.copyFileSync(fullFilePath, destinationPath);
      console.log(`[SUCCESS]: File written to ${destinationPath}`);
    } catch (err) {
      console.error("Could not write file!", err);
      return {
        success: false,
        reason: `Failed to write file to ${destinationPath}.`,
        documents: [],
      };
    }

    const data = {
      id: v4(),
      url: "file://" + fullFilePath,
      title: filename,
      docAuthor: "Unknown",
      description: "Unknown",
      docSource: "img file uploaded by the user.",
      chunkSource: "",
      published: createdDate(fullFilePath),
      wordCount: extractedText.split(" ").length,
      pageContent: extractedText,
      token_count_estimate: tokenizeString(extractedText).length,
    };
    // TODO: REMOVE FUTUREREF COMMENTS
    // FUTUREREFERENCE: HANDLE OCR HERE FOR PDF PNG JPG JPEG AND STORE USING WRITETOSERVERDOCUMENTS FUNCTION AND USE JSON
    const document = writeToServerDocuments(
      data,
      `${slugify(filename)}-${data.id}`
    );
    trashFile(fullFilePath);
    return { success: true, reason: null, documents: [document] };
  } catch (error) {
    console.error("An error occurred while processing the document:", error);
    return { success: false, reason: "Error processing the document." };
  }
}

module.exports = asDocX;
