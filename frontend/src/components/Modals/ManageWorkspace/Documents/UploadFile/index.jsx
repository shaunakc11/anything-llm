import { CloudArrowUp } from "@phosphor-icons/react";
import debounce from "lodash.debounce";
import { useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { v4 } from "uuid";
import System from "../../../../../models/system";
import Workspace from "../../../../../models/workspace";
import showToast from "../../../../../utils/toast";
import FileUploadProgress from "./FileUploadProgress";
import { useTranslation } from "react-i18next";

export default function UploadFile({
  workspace,
  fetchKeys,
  setLoading,
  setLoadingMessage,
  isUploadedDoc = true,
}) {
  const [ready, setReady] = useState(false);
  const [files, setFiles] = useState([]);
  const [fetchingUrl, setFetchingUrl] = useState(false);
  const [year, setYear] = useState("");
  const [yearSubmitted, setYearSubmitted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDropModal, setShowDropModal] = useState(false);
  const fileInputRef = useRef(null);

  const { t } = useTranslation();

  const handleSendLink = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoadingMessage("Scraping link...");
    setFetchingUrl(true);
    const formEl = e.target;
    const form = new FormData(formEl);
    const { response, data } = await Workspace.uploadLink(
      workspace.slug,
      form.get("link")
    );
    if (!response.ok) {
      showToast(`Error uploading link: ${data.error}`, "error");
    } else {
      fetchKeys(true);
      showToast("Link uploaded successfully", "success");
      formEl.reset();
    }
    setLoading(false);
    setFetchingUrl(false);
  };

  // Don't spam fetchKeys, wait 1s between calls at least.
  const handleUploadSuccess = debounce(() => fetchKeys(true), 1000);
  const handleUploadError = (_msg) => null; // stubbed.

  const onDrop = async (acceptedFiles, rejections) => {
    if (!yearSubmitted) {
      setShowDropModal(true);
      const newAccepted = acceptedFiles.map((file) => {
        return {
          uid: v4(),
          file,
        };
      });
      const newRejected = rejections.map((file) => {
        return {
          uid: v4(),
          file: file.file,
          rejected: true,
          reason: file.errors[0].code,
        };
      });
      setYearSubmitted(false);
      setFiles([...newAccepted, ...newRejected]);
    } else {
      setShowDropModal(false);
      const newAccepted = acceptedFiles.map((file) => {
        return {
          uid: v4(),
          file,
        };
      });
      const newRejected = rejections.map((file) => {
        return {
          uid: v4(),
          file: file.file,
          rejected: true,
          reason: file.errors[0].code,
        };
      });
      setYearSubmitted(false);
      setFiles([...newAccepted, ...newRejected]);
    }
  };

  useEffect(() => {
    async function checkProcessorOnline() {
      const online = await System.checkDocumentProcessorOnline();
      setReady(online);
    }
    checkProcessorOnline();
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    disabled: !ready,
  });

  const handleYearSubmit = () => {
    const yearNum = parseInt(year, 10);
    if (year && year.length === 4 && yearNum > 2000 && !isNaN(yearNum)) {
      setYearSubmitted(true);
      setShowModal(false);
      showToast(
        `Year ${year} submitted. You can now upload a file.`,
        "success"
      );
      setYear("");
      fileInputRef.current.click(); // Trigger the file input click
    } else {
      showToast("Please enter a valid 4-digit year greater than 2000", "error");
    }
  };

  const handleDropYearCancel = () => {
    setShowDropModal(false);
    setYear("");
    setYearSubmitted(false);
  };
  const handleYearCancel = () => {
    setShowModal(false);
    setYear("");
    setYearSubmitted(false);
  };

  return (
    <div className="flex flex-col items-center">
      <div
        className={`w-[280px] border-2 border-dashed rounded-2xl bg-zinc-900/50 p-3 ${ready ? "cursor-pointer" : "cursor-not-allowed"
          } hover:bg-zinc-900/90`}
        {...getRootProps()}
        onClick={() => setShowModal(true)}
        style={{ minWidth: !isUploadedDoc ? "41.3rem" : "3rem" }}
      >
        <input {...getInputProps()} ref={fileInputRef} />
        {ready === false ? (
          <div className="flex flex-col items-center justify-center h-full">
            <CloudArrowUp className="w-8 h-8 text-white/80" />
            <div className="text-white text-opacity-80 text-sm font-semibold py-1">
              {t("modal.error.title")}
            </div>
            <div className="text-white text-opacity-60 text-xs font-medium py-1 px-20 text-center">
              {t("modal.error.description")}
            </div>
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center">
            <CloudArrowUp className="w-8 h-8 text-white/80" />
            <div className="text-white text-opacity-80 text-sm font-semibold py-1">
              {t("modal.upload.title")}
            </div>
            <div className="text-white text-opacity-60 text-xs font-medium py-1">
              {t("modal.upload.description")}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 overflow-auto max-h-[180px] p-1 overflow-y-scroll no-scroll">
            {files.map((file) => (
              <FileUploadProgress
                key={file.uid}
                year={year}
                file={file.file}
                uuid={file.uid}
                setFiles={setFiles}
                slug={workspace.slug}
                rejected={file?.rejected}
                reason={file?.reason}
                onUploadSuccess={handleUploadSuccess}
                onUploadError={handleUploadError}
                setLoading={setLoading}
                setLoadingMessage={setLoadingMessage}
              />
            ))}
          </div>
        )}
      </div>
      {showDropModal && (
        <div className="fixed w-full h-full z-30 inset-0 bg-black bg-opacity-75 flex items-center justify-center">
          <div
            className="bg-zinc-800 rounded-lg p-6 w-[400px] border border-gray-500"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-white text-lg font-semibold mb-4">
              Upload by year
            </h2>
            <input
              type="number"
              placeholder="Enter Year (e.g., 2024)"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="disabled:bg-zinc-600 disabled:text-slate-300 bg-zinc-900 text-white placeholder:text-white/20 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            />
            <div className="flex justify-end mt-6 space-x-3">
              <button
                onClick={handleDropYearSubmit}
                className="px-4 py-2 text-white hover:bg-switch-selected hover:bg-opacity-60 bg-switch-selected shadow-md rounded-lg"
              >
                Submit
              </button>
              <button
                onClick={handleDropYearCancel}
                className="px-4 py-2 text-white bg-zinc-900 shadow-md rounded-lg hover:bg-opacity-60"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {showModal && (
        <div className="fixed w-full h-full z-30 inset-0 bg-black bg-opacity-75 flex items-center justify-center">
          <div
            className="bg-zinc-800 rounded-lg p-6 w-[400px] border border-gray-500"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-white text-lg font-semibold mb-4">
              Upload by year
            </h2>
            <input
              type="number"
              placeholder="Enter Year (e.g., 2024)"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="disabled:bg-zinc-600 disabled:text-slate-300 bg-zinc-900 text-white placeholder:text-white/20 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            />
            <div className="flex justify-end mt-6 space-x-3">
              <button
                onClick={handleYearSubmit}
                className="px-4 py-2 text-white hover:bg-switch-selected hover:bg-opacity-60 bg-switch-selected shadow-md rounded-lg"
              >
                Submit
              </button>
              <button
                onClick={handleYearCancel}
                className="px-4 py-2 text-white bg-zinc-900 shadow-md rounded-lg hover:bg-opacity-60"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="text-center text-white text-opacity-50 text-xs font-medium w-[280px] py-2">
        or submit a link
      </div>
      <form
        onSubmit={handleSendLink}
        className="flex gap-x-2"
        style={{
          width: !isUploadedDoc ? "40rem" : "17.5rem",
          justifyContent: "center",
        }}
      >
        <input
          disabled={fetchingUrl}
          name="link"
          type="url"
          className="disabled:bg-zinc-600 disabled:text-slate-300 bg-zinc-900 text-white placeholder:text-white/20 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-3/4 p-2.5"
          placeholder={"https://example.com"}
          autoComplete="off"
        />
        <button
          disabled={fetchingUrl}
          type="submit"
          className="disabled:bg-white/20 disabled:text-slate-300 disabled:border-slate-400 disabled:cursor-wait bg bg-transparent hover:bg-slate-200 hover:text-slate-800 w-auto border border-white text-sm text-white p-2.5 rounded-lg"
        >
          {fetchingUrl ? "Fetching..." : "Fetch website"}
        </button>
      </form>
      <div className="mt-6 text-center text-white text-opacity-80 text-xs font-medium w-[280px]">
        {t("modal.info")}
      </div>
    </div>
  );
}
