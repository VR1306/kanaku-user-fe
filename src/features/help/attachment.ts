import {
  ATTACHMENT_TYPES,
  TICKET_ATTACHMENT_MAX_BYTES,
  type AttachmentType,
} from "@/constants/help";
import type { AttachmentInput } from "./schemas";

const MAX_SIDE = 1280;
const MAX_MB = TICKET_ATTACHMENT_MAX_BYTES / 1_000_000;

/** The MIME type to store for a file, from its extension (browsers often report CSV/Excel wrongly). */
function typeOf(file: File): AttachmentType | null {
  if (file.type.startsWith("image/")) return "image/jpeg"; // images are converted to JPEG below
  const name = file.name.toLowerCase();
  for (const [mime, info] of Object.entries(ATTACHMENT_TYPES)) {
    if (info.extensions.some((ext) => name.endsWith(ext))) return mime as AttachmentType;
  }
  return null;
}

const readDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Couldn't read that file."));
    reader.readAsDataURL(blob);
  });

const toBytes = (dataUrl: string) =>
  Math.floor(((dataUrl.length - dataUrl.indexOf(",") - 1) * 3) / 4);

/** Shrinks an image to a JPEG no bigger than the attachment limit. */
async function shrinkImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser couldn't process that image.");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  for (const quality of [0.8, 0.65, 0.5, 0.35]) {
    const url = canvas.toDataURL("image/jpeg", quality);
    if (toBytes(url) <= TICKET_ATTACHMENT_MAX_BYTES) return url;
  }
  throw new Error("That image is too large. Try a smaller one.");
}

/** Turns a chosen file (image, PDF, Excel or CSV) into something a ticket can carry. */
export async function fileToAttachment(file: File): Promise<AttachmentInput> {
  const type = typeOf(file);
  if (!type) throw new Error("Attach an image, PDF, Excel or CSV file.");
  if (type !== "image/jpeg" && file.size > TICKET_ATTACHMENT_MAX_BYTES) {
    throw new Error(`That file is too large. Attachments can be up to ${MAX_MB} MB.`);
  }
  const dataUrl =
    type === "image/jpeg"
      ? await shrinkImage(file)
      : (await readDataUrl(file)).replace(/^data:[^;,]*/, `data:${type}`);
  return {
    name: file.name.replace(/^.*[\\/]/, "").slice(0, 120),
    type,
    size: toBytes(dataUrl),
    dataUrl,
  };
}

/** "1.4 MB", "820 KB". */
export function formatBytes(bytes: number): string {
  return bytes >= 1_000_000
    ? `${(bytes / 1_000_000).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1000))} KB`;
}
