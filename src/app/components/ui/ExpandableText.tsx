"use client";

import { useState } from "react";

type ExpandableTextProps = {
  className?: string;
  previewLength?: number;
  text: string;
};

const ExpandableText = ({
  className = "",
  previewLength = 120,
  text,
}: ExpandableTextProps) => {
  const [expanded, setExpanded] = useState(false);
  const isLongText = text.length > previewLength || text.includes("\n");

  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden" data-expandable-text="true">
      <p
        className={`whitespace-pre-line break-words [overflow-wrap:anywhere] max-w-full text-sm leading-relaxed ${
          !expanded ? "line-clamp-2" : ""
        } ${className}`}
      >
        {text}
      </p>
      {isLongText && (
        <button
          aria-expanded={expanded}
          className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400 underline decoration-rose-300 dark:decoration-rose-600/40 underline-offset-4 hover:text-rose-700 dark:hover:text-rose-300 transition-colors"
          type="button"
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? "Thu gọn" : "Xem thêm"}
          <i
            aria-hidden="true"
            className={`fa-solid fa-chevron-down text-[9px] transition-transform duration-200 ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </button>
      )}
    </div>
  );
};

export default ExpandableText;
