import { createAdminClient } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";
import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";

export const runtime = "nodejs";

const MAX_GENERATED_CONTENT_CHARS = 60000;

const BOARD_DOCUMENT_TITLE = "EWS Academy";
const BOARD_DOCUMENT_SUBTITLE = "Board Summary Document";
const BOARD_DOCUMENT_VERSION = "Version 1.0";

function makeSafeFileName(name) {
  return String(name || "virtus-document")
    .replace(/\.docx$/i, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 80);
}

function cleanInlineText(text) {
  return String(text || "")
    .normalize("NFKC")
    .replace(/\uFEFF/g, "")
    .replace(/[\u201C\u201D\u2033]/g, '"')
    .replace(/[\u2018\u2019\u2032]/g, "'")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u2192/g, "->")
    .replace(/\u2190/g, "<-")
    .replace(/\u00A0/g, " ")
    .replace(/\u00E2\u20AC[\u0153\u009D]/g, '"')
    .replace(/\u00E2\u20AC[\u02DC\u2122]/g, "'")
    .replace(/\u00E2\u20AC[\u201C\u201D]/g, "-")
    .replace(/\u00E2\u20AC\u00A6/g, "...")
    .replace(/\u00E2\u2020\u2019/g, "->")
    .replace(/\u00E2\u2020\u0090/g, "<-")
    .replace(/`/g, "")
    .replace(/\s+$/gm, "")
    .trim();
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

function getDocumentSubtitle(text, title = "") {
  const titleClean = cleanInlineText(title).toLowerCase();

  return (
    String(text || "")
      .split("\n")
      .map((line) => cleanInlineText(line).replace(/^#{1,6}\s*/, "").trim())
      .find((line) => {
        const lower = line.toLowerCase();
        const wordCount = line.split(/\s+/).filter(Boolean).length;

        return (
          line &&
          lower !== titleClean &&
          wordCount <= 10 &&
          !/^[-*]\s+/.test(line) &&
          !/^\d+[.)]\s+/.test(line) &&
          !lower.startsWith("version ") &&
          !lower.startsWith("prepared for")
        );
      }) || ""
  );
}

function isBoardSectionHeading(trimmed) {
  if (!trimmed || /^[-*]\s+/.test(trimmed)) return false;

  const clean = cleanInlineText(trimmed)
    .replace(/^#{1,6}\s*/, "")
    .replace(/^\d+[.)]\s+/, "")
    .replace(/\*\*/g, "")
    .trim();

  if (!clean) return false;

  const lower = clean.toLowerCase();
  const wordCount = clean.split(/\s+/).filter(Boolean).length;

  if (lower.startsWith("version ")) return false;
  if (lower.startsWith("prepared for")) return false;
  if (/[.!?]$/.test(clean)) return false;

  return wordCount <= 7 && /^[A-Z]/.test(clean);
}

function textToParagraphs(text, title = "", subtitle = "") {
  const lines = String(text || "")
    .split("\n")
    .map((line) => line.trimEnd());

  const titleClean = cleanInlineText(title)
    .replace(/^#{1,6}\s*/, "")
    .replace(/\*\*/g, "")
    .toLowerCase();

  const subtitleClean = cleanInlineText(subtitle)
    .replace(/^#{1,6}\s*/, "")
    .replace(/\*\*/g, "")
    .toLowerCase();

  const fixedHeaderLines = new Set(
    [BOARD_DOCUMENT_TITLE, BOARD_DOCUMENT_SUBTITLE, BOARD_DOCUMENT_VERSION].map(
      (value) => cleanInlineText(value).toLowerCase()
    )
  );

  return lines
    .filter((line, index) => {
      const cleanLine = cleanInlineText(line)
        .replace(/^#{1,6}\s*/, "")
        .replace(/\*\*/g, "")
        .toLowerCase();

      const isFixedHeaderLine = index < 12 && fixedHeaderLines.has(cleanLine);

      const isDuplicateTitle =
        cleanLine === titleClean || (subtitleClean && cleanLine === subtitleClean);

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
        !isFixedHeaderLine &&
        !isDuplicateTitle &&
        !isGenericDocumentHeading &&
        !isConversationalOpening
      );
    })
    .map((line) => {
      const trimmed = line.trim();

      if (!trimmed || /^---+$/.test(trimmed)) {
        return new Paragraph({ text: "" });
      }

      if (trimmed.startsWith("# ")) {
        return new Paragraph({
          children: [
            new TextRun({
              text: cleanInlineText(trimmed.replace(/^#\s+/, "")),
              bold: true,
              size: 32,
              color: "0F172A",
            }),
          ],
          heading: HeadingLevel.HEADING_1,
          spacing: {
            before: 320,
            after: 160,
          },
        });
      }

      if (trimmed.startsWith("## ") || trimmed.startsWith("### ") || isBoardSectionHeading(trimmed)) {
        return new Paragraph({
          children: [
            new TextRun({
              text: cleanInlineText(trimmed.replace(/^#{2,3}\s+/, "")),
              bold: true,
              size: 28,
              color: "075985",
            }),
          ],
          heading: HeadingLevel.HEADING_2,
          spacing: {
            before: 260,
            after: 120,
          },
        });
      }

      if (/^[-*]\s+/.test(trimmed)) {
        return new Paragraph({
          children: markdownTextRuns(trimmed.replace(/^[-*]\s+/, ""), 23),
          bullet: {
            level: 0,
          },
          spacing: {
            after: 90,
          },
        });
      }

      return new Paragraph({
        children: markdownTextRuns(trimmed, 23),
        spacing: {
          after: 150,
        },
      });
    });
}

function createDocumentChildren(title, content) {
  const cleanTitle = cleanInlineText(title || "Virtus Document");
  const subtitle = cleanInlineText(getDocumentSubtitle(content, cleanTitle) || "Professional Document");
  const version = cleanInlineText(BOARD_DOCUMENT_VERSION);

  return [
    new Paragraph({
      children: [
        new TextRun({
          text: cleanTitle,
          bold: true,
          size: 46,
          color: "0F172A",
        }),
      ],
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: {
        before: 260,
        after: 80,
      },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: subtitle,
          bold: true,
          size: 28,
          color: "075985",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: {
        after: 70,
      },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: version,
          size: 22,
          color: "64748B",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: {
        after: 150,
      },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "____________________________________________",
          size: 12,
          color: "0EA5E9",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: {
        after: 340,
      },
    }),
    ...textToParagraphs(content, cleanTitle, subtitle),
  ];
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
    const fileName = `${safeName}.docx`;
    const fileType =
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 720,
                right: 900,
                bottom: 720,
                left: 900,
              },
            },
          },
          children: createDocumentChildren(title, content),
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

