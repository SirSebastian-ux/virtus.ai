import { createAdminClient } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";
import {
  PDFDocument,
  StandardFonts,
} from "pdf-lib";

export const runtime = "nodejs";

function makeSafeFileName(name) {
  return String(name || "virtus-document")
    .replace(/\.pdf$/i, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 80);
}

function cleanPdfText(text) {
  return String(text || "")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2192/g, "->")
    .replace(/\u2190/g, "<-")
    .replace(/\u2122/g, "TM")
    .replace(/\u00A9/g, "(c)")
    .replace(/\u00AE/g, "(R)")
    .replace(/â€œ|â€/g, '"')
    .replace(/â€˜|â€™/g, "'")
    .replace(/â€“|â€”/g, "-")
    .replace(/â†’/g, "->")
    .replace(/â†/g, "<-")
    .replace(/â„¢/g, "TM")
    .replace(/Â©/g, "(c)")
    .replace(/Â®/g, "(R)")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "");
}

function cleanMarkdownLine(line) {
  return cleanPdfText(line)
    .replace(/^#{1,6}\s*/, "")
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .trim();
}

function wrapText(text, font, fontSize, maxWidth) {
  const words = cleanMarkdownLine(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, fontSize);

    if (width <= maxWidth) {
      line = testLine;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }

  if (line) lines.push(line);

  return lines;
}

function shouldSkipPdfLine({ line, index, title }) {
  const cleanLine = cleanMarkdownLine(line).toLowerCase();
  const titleClean = cleanMarkdownLine(title).toLowerCase();

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

  const isDivider = /^---+$/.test(cleanLine);

  return (
    isDuplicateTitle ||
    isGenericDocumentHeading ||
    isConversationalOpening ||
    isDivider
  );
}

async function createPdfBuffer({ title, content }) {
  const pdfDoc = await PDFDocument.create();

  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 56;
  const maxWidth = pageWidth - margin * 2;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  function addPageIfNeeded(requiredSpace = 24) {
    if (y < margin + requiredSpace) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
  }

  function drawWrappedText(text, options = {}) {
    const font = options.bold ? boldFont : regularFont;
    const fontSize = options.size || 11;
    const lineGap = options.lineGap || 16;
    const after = options.after || 8;
    const lines = wrapText(text, font, fontSize, maxWidth);

    for (const line of lines) {
      addPageIfNeeded(lineGap + after);

      page.drawText(line, {
        x: margin,
        y,
        size: fontSize,
        font,
        maxWidth,
      });

      y -= lineGap;
    }

    y -= after;
  }

  drawWrappedText(title || "Virtus Document", {
    bold: true,
    size: 20,
    lineGap: 24,
    after: 22,
  });

  const paragraphs = String(content || "").split("\n");

  paragraphs.forEach((paragraph, index) => {
    const originalLine = paragraph.trim();

    if (!originalLine) {
      y -= 8;
      return;
    }

    if (shouldSkipPdfLine({ line: originalLine, index, title })) {
      return;
    }

    const isHeading1 = originalLine.startsWith("# ");
    const isHeading2 = originalLine.startsWith("## ");
    const isHeading3 = originalLine.startsWith("### ");
    const isBullet = /^[-*]\s+/.test(originalLine);

    if (isHeading1) {
      drawWrappedText(originalLine, {
        bold: true,
        size: 15,
        lineGap: 19,
        after: 10,
      });
      return;
    }

    if (isHeading2 || isHeading3) {
      drawWrappedText(originalLine, {
        bold: true,
        size: 13,
        lineGap: 17,
        after: 8,
      });
      return;
    }

    if (isBullet) {
      drawWrappedText(`- ${originalLine.replace(/^[-*]\s+/, "")}`, {
        size: 11,
        lineGap: 16,
        after: 4,
      });
      return;
    }

    const hasBoldMarkdown = originalLine.includes("**");

    drawWrappedText(originalLine, {
      bold: hasBoldMarkdown,
      size: 11,
      lineGap: 16,
      after: 8,
    });
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
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
    const fileName = `${safeName}.pdf`;
    const fileType = "application/pdf";

    const buffer = await createPdfBuffer({
      title,
      content,
    });

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