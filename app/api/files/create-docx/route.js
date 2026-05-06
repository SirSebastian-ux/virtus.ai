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

function cleanInlineText(text) {
  return String(text || "")
    .replace(/[ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÂ¢Ã¢â€šÂ¬Ã‚Â]/g, '"')
    .replace(/[ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢]/g, "'")
    .replace(/[ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â]/g, "-")
    .replace(/ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢/g, "->")
    .replace(/ÃƒÂ¢Ã¢â‚¬Â Ã‚Â/g, "<-")
    .replace(/ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢/g, "TM")
    .replace(/Ãƒâ€šÃ‚Â©/g, "(c)")
    .replace(/Ãƒâ€šÃ‚Â®/g, "(R)")
    .replace(/`/g, "")
    .trim();
}

function markdownTextRuns(text, size = 24) {
  const cleanText = cleanInlineText(text);
  const parts = cleanText.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);

  return parts.map((part) => {
    const isBold = part.startsWith("**") && part.endsWith("**");
    const textValue = isBold ? part.replace(/\*\*/g, "") : part;

    return new TextRun({
      text: textValue,
      size,
      bold: isBold,
    });
  });
}

function textToParagraphs(text, title = "") {
  const lines = String(text || "")
    .split("\n")
    .map((line) => line.trimEnd());

  const titleClean = cleanInlineText(title)
    .replace(/^#{1,6}\s*/, "")
    .replace(/\*\*/g, "")
    .toLowerCase();

  return lines
    .filter((line, index) => {
      const cleanLine = cleanInlineText(line)
        .replace(/^#{1,6}\s*/, "")
        .replace(/\*\*/g, "")
        .toLowerCase();

        const isDuplicateTitle = cleanLine === titleClean;

      const isGenericDocumentHeading =
        index < 8 &&
        (cleanLine === "proposal" ||
          cleanLine === "short proposal" ||
          cleanLine === "clean proposal" ||
          cleanLine === "professional proposal" ||
          cleanLine === "leadership proposal" ||
          cleanLine === "development proposal" ||
          cleanLine === "training proposal");

      const isConversationalOpening =
        index < 4 &&
        (cleanLine.startsWith("yes") ||
          cleanLine.startsWith("here is") ||
          cleanLine.startsWith("certainly") ||
          cleanLine.startsWith("of course")) &&
        (cleanLine.includes("proposal") ||
          cleanLine.includes("document") ||
          cleanLine.includes("file") ||
          cleanLine.includes("module"));

      return (
        !isDuplicateTitle &&
        !isGenericDocumentHeading &&
        !isConversationalOpening
      );
    })
    .map((line) => {
      const trimmed = line.trim();

      if (!trimmed) {
        return new Paragraph({ text: "" });
      }

      if (/^---+$/.test(trimmed)) {
        return new Paragraph({ text: "" });
      }

      if (trimmed.startsWith("# ")) {
        return new Paragraph({
          text: cleanInlineText(trimmed.replace(/^#\s+/, "")),
          heading: HeadingLevel.HEADING_1,
          spacing: {
            before: 260,
            after: 160,
          },
        });
      }

      if (trimmed.startsWith("## ")) {
        return new Paragraph({
          text: cleanInlineText(trimmed.replace(/^##\s+/, "")),
          heading: HeadingLevel.HEADING_2,
          spacing: {
            before: 220,
            after: 140,
          },
        });
      }

      if (trimmed.startsWith("### ")) {
        return new Paragraph({
          text: cleanInlineText(trimmed.replace(/^###\s+/, "")),
          heading: HeadingLevel.HEADING_3,
          spacing: {
            before: 180,
            after: 120,
          },
        });
      }

      if (/^[-*]\s+/.test(trimmed)) {
        return new Paragraph({
          children: markdownTextRuns(`- ${trimmed.replace(/^[-*]\s+/, "")}`, 24),
          spacing: {
            after: 120,
          },
        });
      }

      return new Paragraph({
        children: markdownTextRuns(trimmed, 24),
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

    const { data: profile } = await admin
      .from("profiles")
      .select("plan, plan_status")
      .eq("id", user.id)
      .single();

    const currentPlan = profile?.plan ?? "free";
    const currentPlanStatus = profile?.plan_status ?? "active";
    const canCreateFiles =
      currentPlanStatus === "active" &&
      ["plus", "premium"].includes(currentPlan);

    if (!canCreateFiles) {
      return Response.json(
        {
          error:
            "File creation is available on Plus and Premium. Free accounts cannot create Word, PDF, PowerPoint, or image files.",
        },
        { status: 403 }
      );
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
               ...textToParagraphs(content, title),
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