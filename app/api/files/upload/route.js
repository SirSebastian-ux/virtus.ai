import { createAdminClient } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";
import { createRequire } from "module";
import mammoth from "mammoth";

const require = createRequire(import.meta.url);
export async function POST(req) {
  try {
   const supabase = await createClient();
    const admin = createAdminClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return Response.json({ error: "No file uploaded" }, { status: 400 });
    }

    const fileName = file.name || "uploaded-file";
    const fileType = file.type || "application/octet-stream";
   const bytes = await file.arrayBuffer();
const fileData = new Uint8Array(bytes);
let extractedText = "";

if (fileType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf")) {
  const pdfParse = require("pdf-parse/lib/pdf-parse.js");
  const pdfResult = await pdfParse(Buffer.from(bytes));
  extractedText = pdfResult.text || "";
}
if (
  fileType ===
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
) {
  const docxResult = await mammoth.extractRawText({
    buffer: Buffer.from(bytes),
  });

  extractedText = docxResult.value || "";
}

    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${user.id}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await admin.storage
      .from("user-files")
     .upload(storagePath, fileData, {
        contentType: fileType,
        upsert: false,
      });

    if (uploadError) {
      return Response.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicUrlData } = admin.storage
      .from("user-files")
      .getPublicUrl(storagePath);

    const { data: savedFile, error: dbError } = await admin
      .from("user_files")
  .insert({
  user_id: user.id,
  file_name: fileName,
  file_type: fileType,
  storage_path: storagePath,
  extracted_text: extractedText,
})
      .select()
      .single();

    if (dbError) {
      return Response.json({ error: dbError.message }, { status: 500 });
    }

    return Response.json({
      success: true,
      file: savedFile,
      publicUrl: publicUrlData.publicUrl,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}