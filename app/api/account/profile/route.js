import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

const BLOCKED_PROFILE_FIELDS = new Set([
  "plan",
  "plan_status",
  "stripe_customer_id",
  "stripe_subscription_id",
  "subscription_status",
  "role",
  "is_admin",
  "admin",
  "user_id",
  "id",
]);

const TEXT_FIELD_LIMITS = {
  nickname: 80,
  occupation: 120,
  about: 1500,
  preferences: 1500,
  responseStyle: 80,
  customInstructions: 4000,
};

function hasOwn(body, key) {
  return Object.prototype.hasOwnProperty.call(body, key);
}

function createValidationError(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

function cleanTextField(body, key) {
  if (!hasOwn(body, key)) {
    return undefined;
  }

  const limit = TEXT_FIELD_LIMITS[key] || 500;
  const value = String(body?.[key] ?? "").trim();

  if (value.length > limit) {
    throw createValidationError(`${key} is too long. Maximum ${limit} characters.`);
  }

  return value;
}

function addTextField(update, body, bodyKey, dbKey) {
  const value = cleanTextField(body, bodyKey);

  if (value !== undefined) {
    update[dbKey] = value;
  }
}

function addBooleanField(update, body, bodyKey, dbKey) {
  if (!hasOwn(body, bodyKey)) {
    return;
  }

  if (typeof body?.[bodyKey] !== "boolean") {
    throw createValidationError(`${bodyKey} must be true or false.`);
  }

  update[dbKey] = body[bodyKey];
}

function getBlockedFields(body) {
  return Object.keys(body || {}).filter((key) => BLOCKED_PROFILE_FIELDS.has(key));
}

export async function POST(request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, error: "Invalid profile request." },
        { status: 400 }
      );
    }

    const blockedFields = getBlockedFields(body);

    if (blockedFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "This route cannot update billing, admin, or identity fields.",
          blockedFields,
        },
        { status: 400 }
      );
    }

    const profileUpdate = {};

    addTextField(profileUpdate, body, "nickname", "nickname");
    addTextField(profileUpdate, body, "occupation", "occupation");
    addTextField(profileUpdate, body, "about", "about");
    addTextField(profileUpdate, body, "preferences", "preferences");
    addTextField(profileUpdate, body, "responseStyle", "response_style");
    addTextField(profileUpdate, body, "customInstructions", "custom_instructions");

    addBooleanField(profileUpdate, body, "memoryEnabled", "memory_enabled");
    addBooleanField(profileUpdate, body, "chatHistoryEnabled", "chat_history_enabled");
    addBooleanField(profileUpdate, body, "recordHistoryEnabled", "record_history_enabled");

    if (Object.keys(profileUpdate).length === 0) {
      return NextResponse.json({
        success: true,
        updatedFields: [],
      });
    }

    const { error } = await supabase
      .from("profiles")
      .update(profileUpdate)
      .eq("id", user.id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      updatedFields: Object.keys(profileUpdate),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Something went wrong.",
      },
      { status: error.status || 500 }
    );
  }
}