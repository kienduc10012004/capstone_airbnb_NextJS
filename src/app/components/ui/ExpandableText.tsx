"use client";

import { useState } from "react";

type ExpandableTextProps = {
  className?: string;
  previewLength?: number;
  text: string;
};

const ExpandableText = ({
  className = "",
  previewLength = 320,
  text,
}: ExpandableTextProps) => {
  const [expanded, setExpanded] = useState(false);
  const shouldCollapse = text.length > previewLength;
  const preview = text.slice(0, previewLength);
  const lastSpaceIndex = preview.lastIndexOf(" ");
  const shortenedText =
    lastSpaceIndex > 0 ? preview.slice(0, lastSpaceIndex) : preview;
  const displayedText =
    shouldCollapse && !expanded ? `${shortenedText.trimEnd()}…` : text;

  return (
    <div data-expandable-text="true">
      <p className={`whitespace-pre-line ${className}`}>{displayedText}</p>
      {shouldCollapse && (
        <button
          aria-expanded={expanded}
          className="mt-3 text-sm font-semibold text-gray-900 underline decoration-gray-400 underline-offset-4 hover:text-rose-500"
          type="button"
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? "Thu gọn" : "Xem thêm"}
        </button>
      )}
    </div>
  );
};

export default ExpandableText;
