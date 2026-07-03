import { createAdminClient } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";
import { createRequire } from "module";
import mammoth from "mammoth";
import { checkRateLimit, getRateLimitIdentity, rateLimitResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";

const require = createRequire(import.meta.url);

const MAX_UPLOAD_SIZE_BYTES = 20 * 1024 * 1024;

const EXTENSION_TO_MIME = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

function getExtension(fileName = "") {
  return String(fileName || "")
    .toLowerCase()
    .split(".")
    .pop()
    .replace(/[^a-z0-9]/g, "");
}

function makeSafeFileName(fileName = "uploaded-file") {
  const safeName = String(fileName || "uploaded-file")
    .replace(/[\r\n]/g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 140)
    .trim();

  return safeName || "uploaded-file";
}

function isValidUserStoragePath(userId, storagePath) {
  const userPrefix = `${userId}/`;
  const value = String(storagePath || "");

  return (
    Boolean(userId) &&
    value.startsWith(userPrefix) &&
    !value.includes("..") &&
    !value.includes("\\") &&
    !value.startsWith("/") &&
    !value.includes("//")
  );
}

function getNormalizedMimeType(fileName, providedType) {
  const extension = getExtension(fileName);
  const expectedMime = EXTENSION_TO_MIME[extension];

  if (!expectedMime) {
    return null;
  }

  const rawType = String(providedType || "").toLowerCase();

  if (!rawType || rawType === "application/octet-stream") {
    return expectedMime;
  }

  if (extension === "jpg" || extension === "jpeg") {
    return rawType === "image/jpeg" ? expectedMime : null;
  }

  return rawType === expectedMime ? expectedMime : null;
}

async function extractTextFromFile({ bytes, fileName, fileType }) {
  const extension = getExtension(fileName);

  if (extension === "pdf" || fileType === "application/pdf") {
    const pdfParse = require("pdf-parse/lib/pdf-parse.js");
    const pdfResult = await pdfParse(Buffer.from(bytes));
    return pdfResult.text || "";
  }

  if (
    extension === "docx" ||
    fileType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const docxResult = await mammoth.extractRawText({
      buffer: Buffer.from(bytes),
    });

    return docxResult.value || "";
  }

  if (extension === "txt" || fileType === "text/plain") {
    return Buffer.from(bytes).toString("utf8");
  }

  return "";
}

export async function POST(req) {
  const uploadRateLimit = checkRateLimit({
    key: `file-upload:${getRateLimitIdentity(req)}`,
    limit: 10,
    windowMs: 60_000,
  });

  if (!uploadRateLimit.allowed) {
    return rateLimitResponse(uploadRateLimit);
  }


  try {
    const supabase = await createClient();
    const admin = createAdminClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.id) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return Response.json({ error: "No file uploaded" }, { status: 400 });
    }

    const originalFileName = file.name || "uploaded-file";
    const fileSize = Number(file.size || 0);
    const normalizedFileType = getNormalizedMimeType(originalFileName, file.type);

    if (!normalizedFileType) {
      return Response.json(
        { error: "Only PDF, DOCX, TXT, PNG, JPG, JPEG, and WEBP files are allowed." },
        { status: 400 }
      );
    }

    if (fileSize <= 0) {
      return Response.json(
        { error: "Uploaded file is empty." },
        { status: 400 }
      );
    }

    if (fileSize > MAX_UPLOAD_SIZE_BYTES) {
      return Response.json(
        { error: "File is too large. Maximum upload size is 20 MB." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const fileData = new Uint8Array(bytes);
    const safeName = makeSafeFileName(originalFileName);
    const storagePath = `${user.id}/${Date.now()}-${safeName}`;

    if (!isValidUserStoragePath(user.id, storagePath)) {
      return Response.json(
        { error: "Invalid storage path." },
        { status: 403 }
      );
    }

    const extractedText = await extractTextFromFile({
      bytes,
      fileName: originalFileName,
      fileType: normalizedFileType,
    });

    const { error: uploadError } = await admin.storage
      .from("user-files")
      .upload(storagePath, fileData, {
        contentType: normalizedFileType,
        upsert: false,
      });

    if (uploadError) {
      return Response.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: savedFile, error: dbError } = await admin
      .from("user_files")
      .insert({
        user_id: user.id,
        file_name: originalFileName,
        file_type: normalizedFileType,
        storage_path: storagePath,
        extracted_text: extractedText,
      })
      .select()
      .single();

    if (dbError) {
      await admin.storage.from("user-files").remove([storagePath]).catch(() => {});

      return Response.json({ error: dbError.message }, { status: 500 });
    }

    return Response.json({
      success: true,
      file: savedFile,
    });
  } catch (error) {
    return Response.json(
      { error: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}
