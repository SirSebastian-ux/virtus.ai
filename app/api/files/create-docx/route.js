import { createAdminClient } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";
import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";

export const runtime = "nodejs";

function makeSafeFileName(name) {
  return String(name || "virtus-document")
    .replace(/\.docx$/i, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 80);
}

function textToParagraphs(text) {
  const lines = String(text || "")
    .split("\n")
    .map((line) => line.trimEnd());

  return lines.map((line) => {
    if (!line.trim()) {
      return new Paragraph({ text: "" });
    }

    return new Paragraph({
      children: [
        new TextRun({
          text: line,
          size: 24,
        }),
      ],
      spacing: {
        after: 160,
      },
    });
  });
}

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

    const body = await req.json();

    const title = String(body.title || "Virtus Document").trim();
    const content = String(body.content || "").trim();
    const requestedFileName = String(
      body.fileName || title || "virtus-document"
    );

    if (!content) {
      return Response.json(
        { error: "Document content is required" },
        { status: 400 }
      );
    }

    const safeName = makeSafeFileName(requestedFileName);
    const fileName = `${safeName}.docx`;
    const fileType =
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: title,
              heading: HeadingLevel.TITLE,
              spacing: {
                after: 300,
              },
            }),
            ...textToParagraphs(content),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    const storagePath = `${user.id}/generated/${Date.now()}-${fileName}`;

    const { error: uploadError } = await admin.storage
      .from("user-files")
      .upload(storagePath, buffer, {
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
        extracted_text: `${title}\n\n${content}`,
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