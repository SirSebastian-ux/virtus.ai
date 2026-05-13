import { createAdminClient } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";
import {
  PDFDocument,
  StandardFonts,
} from "pdf-lib";

export const runtime = "nodejs";

const MAX_GENERATED_CONTENT_CHARS = 60000;

function makeSafeFileName(name) {
  return String(name || "virtus-document")
    .replace(/\.pdf$/i, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 80);
}

function cleanPdfText(text) {
  return String(text || "")
    .normalize("NFKC")
    .replace(/\uFEFF/g, "")
    .replace(/[\u201C\u201D\u2033]/g, '"')
    .replace(/[\u2018\u2019\u2032]/g, "'")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u2192/g, "->")
    .replace(/\u2190/g, "<-")
    .replace(/\u2122/g, "TM")
    .replace(/\u00A9/g, "(c)")
    .replace(/\u00AE/g, "(R)")
    .replace(/\u00A0/g, " ")
    .replace(/\u00E2\u20AC[\u0153\u009D]/g, '"')
    .replace(/\u00E2\u20AC[\u02DC\u2122]/g, "'")
    .replace(/\u00E2\u20AC[\u201C\u201D]/g, "-")
    .replace(/\u00E2\u20AC\u00A6/g, "...")
    .replace(/\u00E2\u2020\u2019/g, "->")
    .replace(/\u00E2\u2020\u0090/g, "<-")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "");
}

function cleanGeneratedFileContent(text) {
  const doubleQuote = String.fromCharCode(34);

  const cleaned = String(text || "")
    .normalize("NFKC")
    .replace(/\uFEFF/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/This version is ready to place into a DOCX or PDF\./gi, "")
    .replace(/DOCX\/PDF content ready\. Click DOCX or PDF below to generate and save it\./gi, "")
    .replace(/PDF content ready\. Click PDF below to generate and save it\./gi, "")
    .replace(/Click PDF below to generate and save it\./gi, "")
    .replace(/\bwiil\b/gi, "will")
    .replace(new RegExp(`\\bone${doubleQuote}s\\b`, "g"), "one's")
    .replace(new RegExp(`\\bperson${doubleQuote}s\\b`, "g"), "person's")
    .replace(new RegExp(`\\bacademy${doubleQuote}s\\b`, "g"), "academy's")
    .replace(new RegExp(`\\bstudent${doubleQuote}s\\b`, "g"), "student's")
    .replace(new RegExp(`\\bchild${doubleQuote}s\\b`, "g"), "child's");

  const lines = cleaned.split("\n").filter((line, index) => {
    const value = line.trim();
    const lower = value.toLowerCase();

    if (!value) return true;

    if (/^(docx|pdf|pptx|image|\.\.\.)$/i.test(value)) return false;

    const openingWithoutName = lower.replace(/^sir sebastian,\s*/, "");

    const isChatStyleDocumentOpening =
      index < 12 &&
      (/^(here is|here's|below is|i prepared|i have prepared|i created|this is)\b/.test(
        openingWithoutName
      ) ||
        openingWithoutName.startsWith("good.")) &&
      (openingWithoutName.includes("document") ||
        openingWithoutName.includes("pdf") ||
        openingWithoutName.includes("docx") ||
        openingWithoutName.includes("board-ready") ||
        openingWithoutName.includes("proposal") ||
        openingWithoutName.includes("draft") ||
        openingWithoutName.includes("content") ||
        openingWithoutName.includes("version"));

    const isInterfaceInstruction =
      lower.includes("click pdf below to generate") ||
      lower.includes("click docx below to generate") ||
      lower.includes("pdf content ready") ||
      lower.includes("docx/pdf content ready");

    if (
      index < 12 &&
      (isChatStyleDocumentOpening ||
        isInterfaceInstruction ||
        lower === "prepared for ews academy foundational development")
    ) {
      return false;
    }

    return true;
  });

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
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
    const content = cleanGeneratedFileContent(body.content);
    const requestedFileName = String(
      body.fileName || title || "virtus-document"
    );

    if (!content) {
      return Response.json(
        { error: "Document content is required" },
        { status: 400 }
      );
    }

    if (content.length > MAX_GENERATED_CONTENT_CHARS) {
      return Response.json(
        { error: "Document content is too long. Please shorten it and try again." },
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
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

