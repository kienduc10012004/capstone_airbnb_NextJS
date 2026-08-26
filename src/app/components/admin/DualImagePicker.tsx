"use client";

import Image from "next/image";
import { useState } from "react";

import { getImageSource, getImageValidationMessage } from "@/app/lib/image";
import { uiClassNames } from "@/app/lib/styles";

type DualImagePickerProps = {
  previewUrl: string;
  onFileSelect: (file: File | null, preview: string) => void;
  onUrlChange: (url: string) => void;
  onError: (msg: string) => void;
};

const DualImagePicker = ({
  previewUrl,
  onFileSelect,
  onUrlChange,
  onError,
}: DualImagePickerProps) => {
  const [mode, setMode] = useState<"file" | "url">("file");
  const [urlInput, setUrlInput] = useState(previewUrl && !previewUrl.startsWith("blob:") ? previewUrl : "");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationMsg = getImageValidationMessage(file);
    if (validationMsg) {
      onError(validationMsg);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    onFileSelect(file, objectUrl);
  };

  const handleUrlInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUrlInput(val);
    onUrlChange(val);
  };

  const handleClear = () => {
    setUrlInput("");
    onFileSelect(null, "");
    onUrlChange("");
  };

  const imageSrc = getImageSource(previewUrl);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200">
          Hình ảnh
        </label>
        {/* Toggle 2 kiểu chọn ảnh */}
        <div className="flex rounded-xl bg-gray-100 dark:bg-slate-800 p-1 border border-gray-200/80 dark:border-white/10">
          <button
            type="button"
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
              mode === "file"
                ? "bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm"
                : "text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white"
            }`}
            onClick={() => {
              setMode("file");
              setUrlInput("");
            }}
          >
            <i className="fa-solid fa-file-arrow-up" />
            Tải tệp ảnh
          </button>
          <button
            type="button"
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
              mode === "url"
                ? "bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm"
                : "text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white"
            }`}
            onClick={() => {
              setMode("url");
              onFileSelect(null, urlInput);
            }}
          >
            <i className="fa-solid fa-link" />
            Nhập URL ảnh
          </button>
        </div>
      </div>

      {mode === "file" ? (
        <div>
          <input
            accept="image/*"
            className="block w-full text-xs text-gray-500 dark:text-slate-400 file:mr-3 file:rounded-xl file:border-0 file:bg-rose-50 dark:file:bg-rose-950/40 file:px-4 file:py-2 file:text-xs file:font-bold file:text-rose-600 dark:file:text-rose-400 hover:file:bg-rose-100 cursor-pointer"
            type="file"
            onChange={handleFileChange}
          />
          <p className="mt-1 text-[11px] text-gray-400 dark:text-slate-500">
            Hỗ trợ định dạng JPG, PNG dưới 1MB.
          </p>
        </div>
      ) : (
        <div>
          <input
            className={`${uiClassNames.field}`}
            placeholder="https://images.unsplash.com/..."
            type="url"
            value={urlInput}
            onChange={handleUrlInput}
          />
          <p className="mt-1 text-[11px] text-gray-400 dark:text-slate-500">
            Dán đường link ảnh trực tuyến (URL) hợp lệ.
          </p>
        </div>
      )}

      {/* Xem trước ảnh */}
      {previewUrl && (
        <div className="relative mt-2 h-40 w-full overflow-hidden rounded-2xl bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-white/10 group">
          {imageSrc ? (
            <Image
              fill
              alt="Xem trước hình ảnh"
              className="object-cover"
              sizes="360px"
              src={imageSrc}
            />
          ) : (
            <div className="grid h-full place-items-center text-gray-400">
              <i className="fa-regular fa-image text-3xl" />
            </div>
          )}
          <button
            type="button"
            aria-label="Xóa ảnh"
            className="absolute top-2 right-2 grid h-7 w-7 place-items-center rounded-full bg-gray-900/70 hover:bg-red-600 text-white text-xs font-bold transition-all shadow-md"
            onClick={handleClear}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default DualImagePicker;
