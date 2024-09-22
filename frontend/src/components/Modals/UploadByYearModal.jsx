import showToast from "@/utils/toast";
import React, { useState } from "react";

const noop = () => false;
export default function UploadByYearModal({
  hideModal = noop,
  onYearSubmitted = noop,
}) {
  const [year, setYear] = useState("");

  const handleYearSubmit = () => {
    const yearNum = parseInt(year, 10);
    if (year && year.length === 4 && yearNum > 2000 && !isNaN(yearNum)) {
      setYear("");
      hideModal();
      onYearSubmitted();
      showToast(
        `Year ${year} submitted. You can now create a workspace.`,
        "success"
      );
    } else {
      showToast("Please enter a valid 4-digit year greater than 2000", "error");
    }
  };

  const handleYearCancel = () => {
    setYear("");
    hideModal();
  };

  return (
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
  );
}

export function useNewYearModal() {
  const [showing, setShowing] = useState(false);
  const showModal = () => {
    setShowing(true);
  };
  const hideModal = () => {
    setShowing(false);
  };

  return { showing, showModal, hideModal };
}
