import { createAdminClient } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";
import OpenAI from "openai";

export const runtime = "nodejs";

function makeSafeFileName(name) {
  return String(name || "virtus-image")
    .replace(/\.(png|jpg|jpeg|webp)$/i, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 80);
}

function buildImagePrompt({ title, content }) {
  const cleanContent = String(content || "").trim();

  return `
Create an image based only on this user request:

${cleanContent}

Style rules:
- premium and professional
- clean dark background when appropriate
- sky-blue and subtle gold accents when appropriate
- modern Virtus AI visual style
- no clutter
- no childish style
- no horror or gore
- no distorted anatomy
- pure symbolic visual only
- no poster design
- no infographic labels
- no written headings
- no readable text of any kind
- no fake text
- no words
- no letters
- no numbers
- no titles
- no captions
- no logos
- no typography
- no labels inside the image
- do not write "Virtus"
- do not write "Virtus AI"
`.trim();
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

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = buildImagePrompt({ title, content });

    const result = await openai.images.generate({
      model: "gpt-image-1-mini",
      prompt,
      size: "1024x1024",
      quality: "low",
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
        extracted_text: `${title}\n\n${content}\n\nImage prompt:\n${prompt}`,
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


