/**
 * Private, account-owned organizational practice context.
 * Only the authenticated employee's own records are selected. Never use this
 * context for employer reports or for another organization's conversations.
 */
export async function loadOrgPracticeMemory({ db, userId, organizationId = null }) {
  if (!db || !userId) return "";
  const membership = db.from("virtus_organization_members")
    .select("organization_id")
    .eq("user_id", userId).eq("status", "active");
  const { data: memberships, error: membershipError } = organizationId
    ? await membership.eq("organization_id", organizationId).limit(1)
    : await membership.limit(20);
  if (membershipError || !memberships?.length) return "";
  const sections = [];
  for (const member of memberships) {
    const orgId = member.organization_id;
    const { data: org, error: orgError } = await db.from("virtus_organizations")
      .select("billing_status").eq("id", orgId).maybeSingle();
    if (orgError || !["active", "trialing"].includes(org?.billing_status)) continue;
    const [progressResult, draftsResult] = await Promise.all([
      db.from("virtus_org_learning_progress")
        .select("curriculum_type,module_number,exercise_number,completed_at")
        .eq("organization_id", orgId).eq("user_id", userId)
        .order("completed_at", { ascending: false }).limit(100),
      db.from("virtus_org_private_exercise_drafts")
        .select("exercise_key,title,responses,updated_at")
        .eq("organization_id", orgId).eq("user_id", userId)
        .order("updated_at", { ascending: false }).limit(100),
    ]);
    // Fail closed on incomplete retrieval. Never pretend that a partial result is complete.
    if (progressResult.error || draftsResult.error) continue;
    const progress = progressResult.data || [];
    const drafts = draftsResult.data || [];
    const draftMap = new Map(drafts.map(x => [x.exercise_key, x]));
    const lines = progress.map(x => {
      const key = x.curriculum_type + "-" + x.module_number + "-" + x.exercise_number;
      const draft = draftMap.get(key);
      const responses = Array.isArray(draft?.responses)
        ? draft.responses.map((v, i) => "reflection " + (i + 1) + ": " + String(v).slice(0, 900)).join("; ")
        : "No saved reflection available";
      return "- " + (draft?.title || key) + " [" + key + "], completed at " +
        (x.completed_at || "timestamp unavailable") + "; " + responses;
    });
    const completedKeys = new Set(progress.map(x => x.curriculum_type + "-" + x.module_number + "-" + x.exercise_number));
    const uncompleted = drafts.filter(x => !completedKeys.has(x.exercise_key))
      .map(x => "- " + x.title + " [" + x.exercise_key + "]: saved reflection only, NOT verified completed");
    sections.push("Organization " + orgId + ": " + progress.length +
      " stored completion records returned (up to 100).\n" + [...lines, ...uncompleted].join("\n"));
  }
  if (!sections.length) return "";
  return "# PRIVATE ORGANIZATIONAL PRACTICE MEMORY (authenticated employee only)\n" +
    "The records below were retrieved from the employee's organization-scoped database. " +
    "Completion means an exercise was marked complete; it does not prove real-world behavior or improvement. " +
    "Do not invent missing exercise names, responses, timestamps, or additional completions. " +
    "Do not expose these reflections to employer reporting.\n" + sections.join("\n\n");
}
