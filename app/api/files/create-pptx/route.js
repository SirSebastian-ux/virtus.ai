import { createAdminClient } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";
import pptxgen from "pptxgenjs";
import OpenAI from "openai";

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
    .replace(/^slide\s+\d+\s*[-:\u2013\u2014]\s*/i, "")
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

    const isSlideNumberTitle = /^slide\s+\d+\s*[-:\u2013\u2014]\s*/i.test(cleanLine);

    if (isSlideNumberTitle) {
      if (current && current.bullets.length > 0) {
        sections.push(current);
      }

      current = {
        title: makeSlideTitleFromLine(cleanLine),
        bullets: [],
      };

      continue;
    }

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

function buildPresentationImagePrompt({ title, content }) {
  const cleanTitle = cleanSlideText(title || "Virtus Presentation");
  const cleanContent = cleanSlideText(content || "").slice(0, 1200);

  return `
Create one premium visual image for a professional PowerPoint presentation.

Presentation title:
${cleanTitle}

Presentation content:
${cleanContent}

Visual style:
- premium executive design
- dark black/zinc background
- sky-blue accents
- subtle gold accents only if appropriate
- abstract, symbolic, intelligent
- suitable for a leadership, psychology, mind discipline, or coaching presentation
- clean composition
- no clutter
- pure symbolic visual only
- no poster design
- no infographic labels
- no written headings
- no readable text of any kind
- no fake text
- no words
- no letters
- no numbers
- no logos
- no typography
- no captions
- no title inside the image
- no labels inside the image
`.trim();
}

async function generatePresentationImageData({ title, content }) {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const result = await openai.images.generate({
      model: "gpt-image-1-mini",
      prompt: buildPresentationImagePrompt({ title, content }),
      size: "1024x1024",
      quality: "low",
      output_format: "png",
      n: 1,
    });

    const imageBase64 = result?.data?.[0]?.b64_json;

    if (!imageBase64) {
      return null;
    }

    return `data:image/png;base64,${imageBase64}`;
  } catch (error) {
    console.error("PowerPoint image generation failed:", error);
    return null;
  }
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
  const presentationImageData = await generatePresentationImageData({
    title: safeTitle,
    content,
  });

  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: "09090B" };

  titleSlide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.33,
    h: 7.5,
    fill: { color: "09090B" },
    line: { color: "09090B", transparency: 100 },
  });

  titleSlide.addShape(pptx.ShapeType.rect, {
    x: 0.55,
    y: 0.55,
    w: 12.25,
    h: 6.4,
    fill: { color: "18181B", transparency: 12 },
    line: { color: "0EA5E9", transparency: 55, width: 1.1 },
    radius: 0.2,
  });

  titleSlide.addShape(pptx.ShapeType.rect, {
    x: 0.55,
    y: 0.55,
    w: 0.08,
    h: 6.4,
    fill: { color: "0EA5E9" },
    line: { color: "0EA5E9" },
  });

  titleSlide.addText("VIRTUS AI PRESENTATION", {
    x: 0.9,
    y: 0.95,
    w: 5.2,
    h: 0.3,
    fontFace: "Aptos",
    fontSize: 9,
    bold: true,
    color: "7DD3FC",
    charSpace: 1.8,
  });

  titleSlide.addText(safeTitle, {
    x: 0.9,
    y: 1.75,
    w: 7.15,
    h: 1.25,
    fontFace: "Aptos Display",
    fontSize: 32,
    bold: true,
    color: "E0F2FE",
    breakLine: false,
    fit: "shrink",
    margin: 0,
  });

  titleSlide.addText("Built for clarity, discipline, and executive communication.", {
    x: 0.92,
    y: 3.55,
    w: 7.0,
    h: 0.38,
    fontFace: "Aptos",
    fontSize: 15,
    color: "BAE6FD",
    fit: "shrink",
  });

  titleSlide.addShape(pptx.ShapeType.line, {
    x: 0.92,
    y: 4.05,
    w: 3.4,
    h: 0,
    line: { color: "0EA5E9", width: 2.2, transparency: 10 },
  });

  titleSlide.addText("Thought -> Awareness -> Emotion -> Behavior -> Communication", {
    x: 0.92,
    y: 6.25,
    w: 8.7,
    h: 0.3,
    fontFace: "Aptos",
    fontSize: 10,
    color: "7DD3FC",
    fit: "shrink",
  });

  if (presentationImageData) {
    titleSlide.addImage({
      data: presentationImageData,
      x: 8.6,
      y: 1.15,
      w: 3.35,
      h: 3.35,
    });

    titleSlide.addShape(pptx.ShapeType.rect, {
      x: 8.6,
      y: 1.15,
      w: 3.35,
      h: 3.35,
      fill: { color: "09090B", transparency: 100 },
      line: { color: "0EA5E9", transparency: 45, width: 1.1 },
      radius: 0.18,
    });
  }

  titleSlide.addText("Generated by Virtus AI", {
    x: 10.1,
    y: 6.25,
    w: 2.2,
    h: 0.3,
    fontFace: "Aptos",
    fontSize: 10,
    color: "A1A1AA",
    align: "right",
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
          return `- ${cleanBullet.slice(0, 137)}...`;
        }

        return `- ${cleanBullet}`;
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

    slide.addText(`Virtus AI | ${index + 1}`, {
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