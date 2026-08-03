"use client";

import { useState } from "react";

type RoomShareButtonProps = {
  roomName: string;
};

const RoomShareButton = ({ roomName }: RoomShareButtonProps) => {
  const [copied, setCopied] = useState(false);

  const shareRoom = async () => {
    const shareData = { title: roomName, url: window.location.href };

    if (navigator.share) {
      await navigator.share(shareData).catch(() => undefined);
      return;
    }

    await navigator.clipboard.writeText(shareData.url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button
      className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-full border border-gray-900 bg-gray-900 px-6 py-3 text-base font-semibold text-white shadow-md transition-[color,background-color,border-color,box-shadow,transform] duration-300 ease-out hover:-translate-y-0.5 hover:border-rose-500 hover:bg-rose-500 hover:shadow-lg"
      type="button"
      onClick={shareRoom}
    >
      <i aria-hidden="true" className="fa-solid fa-arrow-up-from-bracket" />
      {copied ? "Đã sao chép" : "Chia sẻ"}
    </button>
  );
};

export default RoomShareButton;
