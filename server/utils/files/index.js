const fs = require("fs");
const fsPromise = require("fs/promises");
const path = require("path");
const { v5: uuidv5 } = require("uuid");
const { Document } = require("../../models/documents");
const { DocumentSyncQueue } = require("../../models/documentSyncQueue");
const documentsPath =
  process.env.NODE_ENV === "development"
    ? path.resolve(__dirname, `../../storage/documents`)
    : path.resolve(process.env.STORAGE_DIR, `documents`);
const vectorCachePath =
  process.env.NODE_ENV === "development"
    ? path.resolve(__dirname, `../../storage/vector-cache`)
    : path.resolve(process.env.STORAGE_DIR, `vector-cache`);

// Should take in a folder that is a subfolder of documents
// eg: youtube-subject/video-123.json
async function fileData(filePath = null) {
  if (!filePath) throw new Error("No docPath provided in request");
  const fullFilePath = path.resolve(documentsPath, normalizePath(filePath));
  if (!fs.existsSync(fullFilePath) || !isWithin(documentsPath, fullFilePath))
    return null;

  const data = fs.readFileSync(fullFilePath, "utf8");
  return JSON.parse(data);
}

async function viewLocalFiles() {
  try {
    // Check if the directory exists before attempting to create it
    await fsPromise.access(documentsPath);
  } catch (error) {
    // Directory does not exist, so create it
    if (error.code === "ENOENT") {
      await fsPromise.mkdir(documentsPath);
    } else {
      // If there's another error, rethrow it
      throw error;
    }
  }
  const liveSyncAvailable = await DocumentSyncQueue.enabled();

  const directory = {
    name: "documents",
    type: "folder",
    items: [],
  };

  const files = await fsPromise.readdir(documentsPath);

  // Filter and process files asynchronously
  const folders = await Promise.all(
    files.map(async (file) => {
      if (path.extname(file) === ".md") return null; // Skip .md files
      const folderPath = path.resolve(documentsPath, file);
      const isFolder = (await fsPromise.lstat(folderPath)).isDirectory();
      if (!isFolder) return null;

      // Read metadata if exists
      const metadata = await readMetadata(folderPath);

      // Process subfiles asynchronously
      const subdocs = {
        name: file,
        type: "folder",
        items: await processSubFiles(folderPath, liveSyncAvailable),
        metadata,
      };

      return subdocs;
    })
  );

  // Remove null entries (skipped files) and sort
  directory.items = folders.filter((folder) => folder !== null);

  // Ensure custom-documents folder is first
  directory.items.sort((a, b) => (a.name === "custom-documents" ? -1 : 1));

  return directory;
}

async function readMetadata(folderPath) {
  const metadataPath = path.join(folderPath, "metadata.json");
  if (await fileExists(metadataPath)) {
    const rawData = await fsPromise.readFile(metadataPath, "utf8");
    return JSON.parse(rawData);
  }
  return {};
}

async function processSubFiles(folderPath, liveSyncAvailable) {
  const subfiles = await fsPromise.readdir(folderPath);

  return await Promise.all(
    subfiles.map(async (subfile) => {
      if (path.extname(subfile) !== ".json" || subfile === "metadata.json")
        return null;

      const filePath = path.join(folderPath, subfile);
      const rawData = await fsPromise.readFile(filePath, "utf8");
      const { pageContent, ...metadata } = JSON.parse(rawData);
      const cachefilename = `${folderPath}/${subfile}`;

      const pinnedInWorkspaces = await Document.getOnlyWorkspaceIds({
        docpath: cachefilename,
        pinned: true,
      });

      const watchedInWorkspaces = liveSyncAvailable
        ? await Document.getOnlyWorkspaceIds({
          docpath: cachefilename,
          watched: true,
        })
        : [];

      return {
        name: subfile,
        type: "file",
        ...metadata,
        cached: await cachedVectorInformation(cachefilename, true),
        pinnedWorkspaces: pinnedInWorkspaces,
        canWatch: liveSyncAvailable
          ? DocumentSyncQueue.canWatch(metadata)
          : false,
        watched: watchedInWorkspaces.length !== 0,
      };
    })
  );
}

async function fileExists(filePath) {
  try {
    await fsPromise.access(filePath);
    return true;
  } catch (e) {
    return false;
  }
}

// Searches the vector-cache folder for existing information so we dont have to re-embed a
// document and can instead push directly to vector db.
async function cachedVectorInformation(filename = null, checkOnly = false) {
  if (!filename) return checkOnly ? false : { exists: false, chunks: [] };

  const digest = uuidv5(filename, uuidv5.URL);
  const file = path.resolve(vectorCachePath, `${digest}.json`);
  const exists = fs.existsSync(file);

  if (checkOnly) return exists;
  if (!exists) return { exists, chunks: [] };

  console.log(
    `Cached vectorized results of ${filename} found! Using cached data to save on embed costs.`
  );
  const rawData = fs.readFileSync(file, "utf8");
  return { exists: true, chunks: JSON.parse(rawData) };
}

// vectorData: pre-chunked vectorized data for a given file that includes the proper metadata and chunk-size limit so it can be iterated and dumped into Pinecone, etc
// filename is the fullpath to the doc so we can compare by filename to find cached matches.
async function storeVectorResult(vectorData = [], filename = null) {
  if (!filename) return;
  console.log(
    `Caching vectorized results of ${filename} to prevent duplicated embedding.`
  );
  if (!fs.existsSync(vectorCachePath)) fs.mkdirSync(vectorCachePath);

  const digest = uuidv5(filename, uuidv5.URL);
  const writeTo = path.resolve(vectorCachePath, `${digest}.json`);
  fs.writeFileSync(writeTo, JSON.stringify(vectorData), "utf8");
  return;
}

// Purges a file from the documents/ folder.
async function purgeSourceDocument(filename = null) {
  if (!filename) return;
  const filePath = path.resolve(documentsPath, normalizePath(filename));

  if (
    !fs.existsSync(filePath) ||
    !isWithin(documentsPath, filePath) ||
    !fs.lstatSync(filePath).isFile()
  )
    return;

  console.log(`Purging source document of ${filename}.`);
  fs.rmSync(filePath);
  return;
}

// Purges a vector-cache file from the vector-cache/ folder.
async function purgeVectorCache(filename = null) {
  if (!filename) return;
  const digest = uuidv5(filename, uuidv5.URL);
  const filePath = path.resolve(vectorCachePath, `${digest}.json`);

  if (!fs.existsSync(filePath) || !fs.lstatSync(filePath).isFile()) return;
  console.log(`Purging vector-cache of ${filename}.`);
  fs.rmSync(filePath);
  return;
}

// Search for a specific document by its unique name in the entire `documents`
// folder via iteration of all folders and checking if the expected file exists.
async function findDocumentInDocuments(documentName = null) {
  if (!documentName) return null;
  for (const folder of fs.readdirSync(documentsPath)) {
    const isFolder = fs
      .lstatSync(path.join(documentsPath, folder))
      .isDirectory();
    if (!isFolder) continue;

    const targetFilename = normalizePath(documentName);
    const targetFileLocation = path.join(documentsPath, folder, targetFilename);

    if (
      !fs.existsSync(targetFileLocation) ||
      !isWithin(documentsPath, targetFileLocation)
    )
      continue;

    const fileData = fs.readFileSync(targetFileLocation, "utf8");
    const cachefilename = `${folder}/${targetFilename}`;
    const { pageContent, ...metadata } = JSON.parse(fileData);
    return {
      name: targetFilename,
      type: "file",
      ...metadata,
      cached: await cachedVectorInformation(cachefilename, true),
    };
  }

  return null;
}

/**
 * Checks if a given path is within another path.
 * @param {string} outer - The outer path (should be resolved).
 * @param {string} inner - The inner path (should be resolved).
 * @returns {boolean} - Returns true if the inner path is within the outer path, false otherwise.
 */
function isWithin(outer, inner) {
  if (outer === inner) return false;
  const rel = path.relative(outer, inner);
  return !rel.startsWith("../") && rel !== "..";
}

function normalizePath(filepath = "") {
  const result = path
    .normalize(filepath.trim())
    .replace(/^(\.\.(\/|\\|$))+/, "")
    .trim();
  if (["..", ".", "/"].includes(result)) throw new Error("Invalid path.");
  return result;
}

// Check if the vector-cache folder is empty or not
// useful for it the user is changing embedders as this will
// break the previous cache.
function hasVectorCachedFiles() {
  try {
    return (
      fs.readdirSync(vectorCachePath)?.filter((name) => name.endsWith(".json"))
        .length !== 0
    );
  } catch { }
  return false;
}

module.exports = {
  findDocumentInDocuments,
  cachedVectorInformation,
  viewLocalFiles,
  purgeSourceDocument,
  purgeVectorCache,
  storeVectorResult,
  fileData,
  normalizePath,
  isWithin,
  documentsPath,
  hasVectorCachedFiles,
};
