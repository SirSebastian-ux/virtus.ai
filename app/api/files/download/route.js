import { createAdminClient } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";

function getSafeDownloadName(fileName) {
  return (fileName || "virtus-file").replace(/[\r\n"]/g, "_");
}

export async function GET(req) {
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

    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get("fileId");

    if (!fileId) {
      return Response.json({ error: "Missing fileId" }, { status: 400 });
    }

    const { data: file, error: fileError } = await admin
      .from("user_files")
      .select("id, user_id, file_name, file_type, storage_path")
      .eq("id", fileId)
      .eq("user_id", user.id)
      .single();

    if (fileError || !file) {
      return Response.json({ error: "File not found" }, { status: 404 });
    }

    const { data: fileData, error: downloadError } = await admin.storage
      .from("user-files")
      .download(file.storage_path);

    if (downloadError || !fileData) {
      return Response.json(
        { error: downloadError?.message || "Download failed" },
        { status: 500 }
      );
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const safeFileName = getSafeDownloadName(file.file_name);

    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": file.file_type || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${safeFileName}"`,
      },
    });
  } catch (error) {
    return Response.json(
      { error: error.message || "Download failed" },
      { status: 500 }
    );
  }
}