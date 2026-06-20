const PAYMENT_KEYWORDS = ["payment", "paid", "received", "cash", "bank", "transfer", "invoice"];
const URGENT_KEYWORDS = ["urgent", "blocked", "problem", "issue", "broken", "failed", "emergency"];
const DECISION_KEYWORDS = ["approval", "approve", "decision", "permission", "authorize"];
const TASK_KEYWORDS = ["follow up", "todo", "task", "need to", "must", "should", "pending"];

function splitSentences(text) {
  return String(text || "")
    .split(/[.!?\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function includesKeyword(text, keywords) {
  const lower = text.toLowerCase();
  return keywords.some((keyword) => lower.includes(keyword));
}

export function extractOperationsFromReport(rawReport) {
  const sentences = splitSentences(rawReport);

  const payments = [];
  const tasks = [];
  const urgentIssues = [];
  const decisions = [];

  for (const sentence of sentences) {
    if (includesKeyword(sentence, PAYMENT_KEYWORDS)) {
      payments.push({
        description: sentence,
        status: "pending_confirmation",
      });
    }

    if (includesKeyword(sentence, URGENT_KEYWORDS)) {
      urgentIssues.push({
        title: sentence.slice(0, 90),
        description: sentence,
        severity: "medium",
        status: "open",
      });
    }

    if (includesKeyword(sentence, DECISION_KEYWORDS)) {
      decisions.push({
        decisionType: "management_approval",
        title: sentence.slice(0, 90),
        description: sentence,
        status: "pending",
        priority: "normal",
      });
    }

    if (includesKeyword(sentence, TASK_KEYWORDS)) {
      tasks.push({
        title: sentence.slice(0, 90),
        description: sentence,
        status: "open",
        priority: "normal",
      });
    }
  }

  return {
    summary: [
      payments.length ? `${payments.length} payment item(s) detected` : null,
      tasks.length ? `${tasks.length} task item(s) detected` : null,
      urgentIssues.length ? `${urgentIssues.length} urgent issue(s) detected` : null,
      decisions.length ? `${decisions.length} decision item(s) detected` : null,
    ]
      .filter(Boolean)
      .join(". "),
    payments,
    tasks,
    urgentIssues,
    decisions,
  };
}
