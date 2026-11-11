"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/icons/icon";
import { ATTACHMENT_TYPES } from "@/constants/help";
import { parseCsv } from "@/lib/csv";
import { cn } from "@/utils/cn";
import { formatBytes } from "../attachment";
import type { AttachmentInput } from "../schemas";

const PREVIEW_ROWS = 6;
const PREVIEW_COLS = 6;

/** The text of a CSV attachment's data URL. */
function csvText(dataUrl: string): string {
  const binary = atob(dataUrl.slice(dataUrl.indexOf(",") + 1));
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
}

/**
 * Shows an attached file: the picture itself, the first page of a PDF, the first rows of a CSV,
 * or (for Excel, which can't be previewed in the browser) a file card. Every kind has Open and
 * Download; pass `onRemove` to let the user take it off again.
 */
export function AttachmentPreview({
  attachment,
  onRemove,
  className,
}: {
  attachment: AttachmentInput;
  onRemove?: () => void;
  className?: string;
}) {
  const { name, type, size, dataUrl } = attachment;
  const [blobUrl, setBlobUrl] = useState<string>();
  const kind = ATTACHMENT_TYPES[type].label;

  // Browsers won't open data: URLs in a new tab, so open a temporary blob URL instead. (The
  // server only accepts the file types in ATTACHMENT_TYPES, so a blob is never HTML.)
  useEffect(() => {
    let url: string | undefined;
    let cancelled = false;
    fetch(dataUrl)
      .then((r) => r.blob())
      .then((blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setBlobUrl(url);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [dataUrl]);

  const rows = useMemo(() => {
    if (type !== "text/csv") return null;
    try {
      return parseCsv(csvText(dataUrl)).slice(0, PREVIEW_ROWS);
    } catch {
      return null;
    }
  }, [type, dataUrl]);

  return (
    <figure className={cn("overflow-hidden rounded-2xl border border-line bg-surface", className)}>
      <figcaption className="flex flex-wrap items-center gap-3 border-b border-line-soft bg-page px-4 py-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-brand-tint text-link">
          <Icon name="file" size={18} strokeWidth={1.9} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-ink">{name}</span>
          <span className="block text-xs text-muted">
            {kind} · {formatBytes(size)}
          </span>
        </span>
        <span className="flex items-center gap-3 text-sm font-semibold">
          {blobUrl && type !== "application/vnd.ms-excel" && !type.includes("spreadsheetml") ? (
            <a
              href={blobUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-link hover:underline"
            >
              Open
            </a>
          ) : null}
          <a href={blobUrl ?? dataUrl} download={name} className="text-link hover:underline">
            Download
          </a>
          {onRemove ? (
            <button type="button" onClick={onRemove} className="text-danger hover:underline">
              Remove
            </button>
          ) : null}
        </span>
      </figcaption>

      {type === "image/jpeg" ? (
        // eslint-disable-next-line @next/next/no-img-element -- a file the user just attached
        <img
          src={dataUrl}
          alt={`Preview of ${name}`}
          className="mx-auto max-h-56 w-auto object-contain p-2"
        />
      ) : type === "application/pdf" ? (
        blobUrl ? (
          <iframe
            src={`${blobUrl}#toolbar=0&navpanes=0`}
            title={`Preview of ${name}`}
            className="h-64 w-full bg-white"
          />
        ) : (
          <p className="px-4 py-6 text-center text-sm text-muted">Loading preview…</p>
        )
      ) : rows ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[320px] text-left text-xs">
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={i}
                  className={cn(
                    "border-b border-line-soft last:border-b-0",
                    i === 0 && "bg-page font-bold text-ink",
                  )}
                >
                  {row.slice(0, PREVIEW_COLS).map((cell, j) => (
                    <td key={j} className="max-w-[160px] truncate px-3 py-2 text-ink-2">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="px-4 py-5 text-center text-sm text-muted">
          {type === "text/csv"
            ? "Couldn't preview this CSV, but you can download it."
            : "A preview isn't available for Excel files here. Download it to open it in Excel."}
        </p>
      )}
    </figure>
  );
}
