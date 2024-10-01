const path = require("path");
const { SUPPORTED_FILETYPE_CONVERTERS } = require("../utils/constants");

//TODO: remove unused variables
async function processSingleFile(targetFilename, uploadedFile, options = {}) {
  const fileExtension = path.parse(uploadedFile.title).ext.toLowerCase();

  if (!fileExtension) {
    return {
      success: false,
      reason: `No file extension found. This file cannot be processed.`,
      documents: [],
    };
  }

  let processFileAs = fileExtension;
  if (!SUPPORTED_FILETYPE_CONVERTERS.hasOwnProperty(fileExtension)) {
    return {
      success: false,
      reason: `File extension ${fileExtension} not supported for parsing and cannot be assumed as text file type.`,
      documents: [],
    };
  }

  const FileTypeProcessor = require(SUPPORTED_FILETYPE_CONVERTERS[
    processFileAs
  ]);
  return await FileTypeProcessor({
    fullFilePath: undefined,
    filename: uploadedFile.title,
    uploadedFile,
    options,
  });
}

module.exports = {
  processSingleFile,
};
