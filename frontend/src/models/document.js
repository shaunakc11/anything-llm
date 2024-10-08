import { API_BASE } from "@/utils/constants";
import { baseHeaders } from "@/utils/request";

const Document = {
  createFolder: async (name, metadata) => {
    return await fetch(`${API_BASE}/document/create-folder`, {
      method: "POST",
      headers: baseHeaders(),
      body: JSON.stringify({ name, metadata }),
    })
      .then((res) => res.json())
      .catch((e) => {
        console.error(e);
        return { success: false, error: e.message };
      });
  },
  updateFolderMetadata: async (folderName, metadata) => {
    return await fetch(
      `${API_BASE}/document/update-folder-metadata/${folderName}`,
      {
        method: "PUT",
        headers: baseHeaders(),
        body: JSON.stringify(metadata),
      }
    )
      .then((res) => res.json())
      .catch((e) => {
        console.error(e);
        return { success: false, error: e.message };
      });
  },
  moveToFolder: async (files, folderName) => {
    const data = {
      files: files.map((file) => ({
        from: file.folderName ? `${file.folderName}/${file.name}` : file.name,
        to: `${folderName}/${file.name}`,
      })),
    };

    return await fetch(`${API_BASE}/document/move-files`, {
      method: "POST",
      headers: baseHeaders(),
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .catch((e) => {
        console.error(e);
        return { success: false, error: e.message };
      });
  },
};

export default Document;
