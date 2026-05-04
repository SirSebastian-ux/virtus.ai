import { createAdminClient } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";
import pptxgen from "pptxgenjs";

export const runtime = "nodejs";

function makeSafeFileName(name) {
  return String(name || "virtus-presentation")
    .replace(/\.pptx$/i, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 80);
}

function cleanSlideText(text) {
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
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "")
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .trim();
}

function isWeakSlideLine(text) {
  const lower = cleanSlideText(text)
    .replace(/^#{1,6}\s*/, "")
    .toLowerCase();

  return (
    !lower ||
    lower === "title" ||
    lower === "slide title" ||
    lower === "proposal" ||
    lower === "short proposal" ||
    lower === "clean proposal" ||
    lower === "professional proposal" ||
    lower.startsWith("yes") ||
    lower.startsWith("here is") ||
    lower.startsWith("certainly") ||
    lower.startsWith("of course") ||
    lower.includes("based on the document") ||
    lower.includes("based on the file") ||
    lower.includes("based on module")
  );
}

function makeSlideTitleFromLine(line, fallback = "Key Focus") {
  const clean = cleanSlideText(line)
    .replace(/^#{1,6}\s*/, "")
    .replace(/^slide\s+\d+\s*:\s*/i, "")
    .replace(/^proposal:\s*/i, "")
    .replace(/^program:\s*/i, "")
    .replace(/^title:\s*/i, "")
    .trim();

  const lower = clean.toLowerCase();

  if (
    !clean ||
    clean.split(/\s+/).length > 12 ||
    lower === "title" ||
    lower === "slide title" ||
    lower === "proposal" ||
    lower === "short proposal"
  ) {
    return fallback;
  }

  return clean;
}

function splitLongTextIntoPoints(text) {
  const clean = cleanSlideText(text);

  return clean
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 20)
    .slice(0, 4);
}

function splitIntoSlideSections(content) {
  const lines = String(content || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !isWeakSlideLine(line));

  const sections = [];
  let current = null;

  for (const line of lines) {
    const isHeading =
      line.startsWith("# ") ||
      line.startsWith("## ") ||
      line.startsWith("### ");

    const cleanLine = cleanSlideText(line.replace(/^[-*]\s+/, ""));

    if (!cleanLine) continue;

    if (isHeading) {
      if (current && current.bullets.length > 0) {
        sections.push(current);
      }

      current = {
        title: makeSlideTitleFromLine(line),
        bullets: [],
      };

      continue;
    }

    const isLikelyTitle =
      cleanLine.split(/\s+/).length <= 8 &&
      (cleanLine.toLowerCase().includes("overview") ||
        cleanLine.toLowerCase().includes("objective") ||
        cleanLine.toLowerCase().includes("outcome") ||
        cleanLine.toLowerCase().includes("framework") ||
        cleanLine.toLowerCase().includes("benefit") ||
        cleanLine.toLowerCase().includes("implementation") ||
        cleanLine.toLowerCase().includes("next step"));

    if (isLikelyTitle) {
      if (current && current.bullets.length > 0) {
        sections.push(current);
      }

      current = {
        title: cleanLine,
        bullets: [],
      };

      continue;
    }

    if (!current) {
      current = {
        title: "Core Message",
        bullets: [],
      };
    }

    if (cleanLine.length > 180) {
      current.bullets.push(...splitLongTextIntoPoints(cleanLine));
    } else {
      current.bullets.push(cleanLine);
    }

    if (current.bullets.length >= 4) {
      sections.push(current);
      current = null;
    }
  }

  if (current && current.bullets.length > 0) {
    sections.push(current);
  }

  return sections
    .filter((section) => section.title && section.bullets.length > 0)
    .map((section, index) => {
      const titleLower = cleanSlideText(section.title).toLowerCase();

      const hasWeakTitle =
        titleLower === "title" ||
        titleLower === "slide title" ||
        /^slide\s+\d+\s*:\s*title$/i.test(titleLower) ||
        titleLower === "core message" ||
        titleLower === "key point" ||
        titleLower === "key focus";

      if (!hasWeakTitle) {
        return section;
      }

      const firstStrongBullet = section.bullets.find((bullet) => {
        const cleanBullet = cleanSlideText(bullet);
        const wordCount = cleanBullet.split(/\s+/).filter(Boolean).length;

        return wordCount >= 2 && wordCount <= 8;
      });

      if (firstStrongBullet) {
        return {
          ...section,
          title: cleanSlideText(firstStrongBullet)
            .replace(/^\d+\.\s*/, "")
            .replace(/^[-*]\s*/, ""),
          bullets: section.bullets.filter((bullet) => bullet !== firstStrongBullet),
        };
      }

      return {
        ...section,
        title: `Key Insight ${index + 1}`,
      };
    })
    .filter((section) => section.bullets.length > 0)
    .slice(0, 7);
}

async function createPptxBuffer({ title, content }) {
  const pptx = new pptxgen();

  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "Virtus AI";
  pptx.company = "Virtus AI";
  pptx.subject = title || "Virtus Presentation";
  pptx.title = title || "Virtus Presentation";
  pptx.lang = "en-US";
  pptx.theme = {
    headFontFace: "Aptos Display",
    bodyFontFace: "Aptos",
    lang: "en-US",
  };

  const safeTitle = cleanSlideText(title || "Virtus Presentation");
  const sections = splitIntoSlideSections(content);

  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: "09090B" };
  titleSlide.addText(safeTitle, {
    x: 0.7,
    y: 1.65,
    w: 11.9,
    h: 0.8,
    fontFace: "Aptos Display",
    fontSize: 34,
    bold: true,
    color: "E0F2FE",
    breakLine: false,
    fit: "shrink",
  });
  titleSlide.addText("Generated by Virtus AI", {
    x: 0.72,
    y: 2.55,
    w: 11.4,
    h: 0.35,
    fontSize: 14,
    color: "7DD3FC",
  });
  titleSlide.addShape(pptx.ShapeType.line, {
    x: 0.72,
    y: 3.05,
    w: 3.8,
    h: 0,
    line: { color: "0EA5E9", width: 2 },
  });

  const usableSections = sections.length
    ? sections
    : [
        {
          title: safeTitle,
          bullets: [cleanSlideText(content).slice(0, 350)],
        },
      ];

  usableSections.forEach((section, index) => {
    const slide = pptx.addSlide();
    slide.background = { color: "09090B" };

    slide.addText(
      cleanSlideText(section.title || `Section ${index + 1}`).replace(
        /^slide\s+\d+\s*:\s*/i,
        ""
      ),
      {
      x: 0.55,
      y: 0.45,
      w: 12.2,
      h: 0.55,
      fontFace: "Aptos Display",
      fontSize: 24,
      bold: true,
      color: "E0F2FE",
      fit: "shrink",
    }
    );

    slide.addShape(pptx.ShapeType.line, {
      x: 0.55,
      y: 1.12,
      w: 11.9,
      h: 0,
      line: { color: "0EA5E9", width: 1.3, transparency: 30 },
    });

    const bullets = section.bullets.length
      ? section.bullets.slice(0, 4)
      : ["Key idea to expand."];

    const bulletText = bullets
      .map((bullet) => {
        const cleanBullet = cleanSlideText(bullet);

        if (cleanBullet.length > 140) {
          return `• ${cleanBullet.slice(0, 137)}...`;
        }

        return `• ${cleanBullet}`;
      })
      .join("\n\n");

    slide.addText(bulletText, {
      x: 0.95,
      y: 1.65,
      w: 11.1,
      h: 4.55,
      fontFace: "Aptos",
      fontSize: 22,
      color: "F8FAFC",
      breakLine: false,
      fit: "shrink",
      margin: 0.05,
      valign: "mid",
    });

    slide.addText(`Virtus AI • ${index + 1}`, {
      x: 10.8,
      y: 6.9,
      w: 1.8,
      h: 0.25,
      fontSize: 9,
      color: "7DD3FC",
      align: "right",
    });
  });

  const buffer = await pptx.write({
    outputType: "nodebuffer",
  });

  return Buffer.from(buffer);
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

    const title = String(body.title || "Virtus Presentation").trim();
    const content = String(body.content || "").trim();
    const requestedFileName = String(
      body.fileName || title || "virtus-presentation"
    );

    if (!content) {
      return Response.json(
        { error: "Presentation content is required" },
        { status: 400 }
      );
    }

    const safeName = makeSafeFileName(requestedFileName);
    const fileName = `${safeName}.pptx`;
    const fileType =
      "application/vnd.openxmlformats-officedocument.presentationml.presentation";

    const buffer = await createPptxBuffer({
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