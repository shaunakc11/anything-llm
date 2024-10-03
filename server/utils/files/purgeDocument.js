const fs = require("fs");
const path = require("path");
const {
  purgeVectorCache,
  purgeSourceDocument,
  normalizePath,
  isWithin,
  documentsPath,
} = require(".");
const { Document } = require("../../models/documents");
const { Workspace } = require("../../models/workspace");
const prisma = require("../prisma");

async function purgeDocument(file = null) {
  if (!file || !normalizePath(file.name)) return;

  await purgeVectorCache(file.name);
  await purgeSourceDocument(file);
  const workspaces = await Workspace.where();
  for (const workspace of workspaces) {
    await Document.removeDocuments(workspace, [file.name]);
  }
  return;
}

async function purgeFolder(folderName = null) {
  if (!folderName) return;
  const subFolder = normalizePath(folderName);
  if (subFolder === 'custom-documents') {
    console.log("Skipping deletion of 'custom-documents' folder.");
  } else {
    // Delete the folder if it's not "custom-documents"
    const folder = await prisma.folder.findUnique({
      where: {
        name: subFolder,
      },
    });

    if (folder) {
      // Deleting the folder
      await prisma.folder.delete({
        where: {
          name: subFolder,
        },
      });
      console.log(`Folder "${folderName}" deleted.`);
    }
  }
  const subFolderPath = path.resolve(documentsPath, subFolder);
  const validRemovableSubFolders = fs
    .readdirSync(documentsPath)
    .map((folder) => {
      // Filter out any results which are not folders or
      // are the protected custom-documents folder.
      if (folder === "custom-documents") return null;
      const subfolderPath = path.resolve(documentsPath, folder);
      if (!fs.lstatSync(subfolderPath).isDirectory()) return null;
      return folder;
    })
    .filter((subFolder) => !!subFolder);

  if (
    !validRemovableSubFolders.includes(subFolder) ||
    !fs.existsSync(subFolderPath) ||
    !isWithin(documentsPath, subFolderPath)
  )
    return;

  const filenames = fs
    .readdirSync(subFolderPath)
    .map((file) =>
      path.join(subFolderPath, file).replace(documentsPath + "/", "")
    );
  const workspaces = await Workspace.where();

  const purgePromises = [];
  // Remove associated Vector-cache files
  for (const filename of filenames) {
    const rmVectorCache = () =>
      new Promise((resolve) =>
        purgeVectorCache(filename).then(() => resolve(true))
      );
    purgePromises.push(rmVectorCache);
  }

  // Remove workspace document associations
  for (const workspace of workspaces) {
    const rmWorkspaceDoc = () =>
      new Promise((resolve) =>
        Document.removeDocuments(workspace, filenames).then(() => resolve(true))
      );
    purgePromises.push(rmWorkspaceDoc);
  }

  await Promise.all(purgePromises.flat().map((f) => f()));
  fs.rmSync(subFolderPath, { recursive: true }); // Delete target document-folder and source files.

  return;
}

module.exports = {
  purgeDocument,
  purgeFolder,
};
