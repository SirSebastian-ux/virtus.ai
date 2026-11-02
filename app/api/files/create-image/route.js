import { createAdminClient } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";
import OpenAI from "openai";
import { checkRateLimit, getRateLimitIdentity, rateLimitResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";

const MAX_IMAGE_CONTENT_CHARS = 10000;
const DAILY_IMAGE_GENERATION_LIMIT = 10;

function makeSafeFileName(name) {
  return String(name || "virtus-image")
    .replace(/\.(png|jpg|jpeg|webp)$/i, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 80);
}

function buildImagePrompt({ title, content }) {
  const source = String(content || "").trim();
  const request = source.split("CURRENT IMAGE REQUEST:").pop().trim();
  const context = source.includes("CURRENT IMAGE REQUEST:")
    ? source.slice(0, source.lastIndexOf("CURRENT IMAGE REQUEST:")).slice(-5000)
    : "";
  return `Create a polished, high-quality image that fulfills the user's actual request.

CURRENT REQUEST (highest priority):
${request}

RELEVANT CONVERSATION CONTEXT (use only to resolve the subject and intent):
${context}

Art direction:
- Translate the actual subject into a compelling, specific visual composition rather than a generic icon collage.
- Use appropriate visual language for the subject: editorial photography, premium illustration, conceptual art, or diagram as the request requires.
- Strong visual hierarchy, refined lighting, believable materials, precise anatomy, balanced negative space and coherent details.
- Avoid stock-style clip art, generic lightbulbs, targets, arrows, brains, and charts unless explicitly relevant.
- Use emerald, dark charcoal and restrained metallic gold only when the user requests Virtus branding; otherwise choose colors appropriate to the subject.
- If the user requests text, a poster, an infographic, or labels, include only the necessary accurate text. Otherwise avoid extraneous text.
- Do not add a logo or watermark unless explicitly requested.
- Deliver the actual requested visual, not an illustration of an AI assistant generating it.`.trim();
}

export async function POST(req) {
  const imageRateLimit = checkRateLimit({
    key: `file-create-image:${getRateLimitIdentity(req)}`,
    limit: 5,
    windowMs: 60_000,
  });

  if (!imageRateLimit.allowed) {
    return rateLimitResponse(imageRateLimit);
  }


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

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const { count: todayImageCount } = await admin
      .from("user_files")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("file_type", "image/png")
      .gte("created_at", todayStart.toISOString())
      .lt("created_at", tomorrowStart.toISOString());

    if ((todayImageCount ?? 0) >= DAILY_IMAGE_GENERATION_LIMIT) {
      return Response.json(
        { error: "Daily image generation limit reached. Please try again tomorrow." },
        { status: 429 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        { error: "OPENAI_API_KEY is missing" },
        { status: 500 }
      );
    }

    const body = await req.json();

    const title = String(body.title || "Virtus AI Image").trim();
    const content = String(body.content || "").trim();
    const requestedFileName = String(body.fileName || title || "virtus-image");

    if (!content) {
      return Response.json(
        { error: "Image content is required" },
        { status: 400 }
      );
    }

    if (content.length > MAX_IMAGE_CONTENT_CHARS) {
      return Response.json(
        { error: "Image request is too long. Please shorten it and try again." },
        { status: 400 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = buildImagePrompt({ title, content });

    const result = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024",
      quality: "high",
      output_format: "png",
      n: 1,
    });

    const imageBase64 = result?.data?.[0]?.b64_json;

    if (!imageBase64) {
      return Response.json(
        { error: "Image generation did not return image data" },
        { status: 500 }
      );
    }

    const buffer = Buffer.from(imageBase64, "base64");

    const safeName = makeSafeFileName(requestedFileName);
    const fileName = `${safeName}.png`;
    const fileType = "image/png";
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






