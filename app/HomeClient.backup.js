"use client";

import ReactMarkdown from "react-markdown";
import { useEffect, useRef, useState } from "react";
import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { getPlanLabel, getPlanPolicy } from "@/data/virtus-plan-policy";

export default function HomeClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [lastMessage, setLastMessage] = useState("");
  const [conversation, setConversation] = useState([]);
const [streamingReply, setStreamingReply] = useState("");
const [loading, setLoading] = useState(false);
  const [recentConversations, setRecentConversations] = useState([]);
  const [activeChatId, setActiveChatId] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [accountAccess, setAccountAccess] = useState(null);
  const [guestAccess, setGuestAccess] = useState(null);
const abortControllerRef = useRef(null);
const [editingIndex, setEditingIndex] = useState(null);
const isEditing = editingIndex !== null;
const [regenerating, setRegenerating] = useState(false);
const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
const [showPlanOverlay, setShowPlanOverlay] = useState(false);
const [paymentSyncing, setPaymentSyncing] = useState(false);
useEffect(() => {
  if (!regenerating) return;
  if (!message.trim()) return;
  if (loading) return;

  sendMessage();
  setRegenerating(false);
}, [regenerating, message, loading]);
const cancelEdit = () => {
  setEditingIndex(null);
  setMessage("");
};
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const currentAccess = isAuthenticated ? accountAccess : guestAccess;
   const currentDailyMessageLimit = currentAccess?.dailyMessageLimit;
  const paymentSuccess = searchParams.get("success") === "true";
  const currentDailyMessagesUsed = currentAccess?.dailyMessagesUsed ?? 0;

  const isDailyLimitReached =
    currentDailyMessageLimit !== null &&
    currentDailyMessageLimit !== undefined &&
    currentDailyMessagesUsed >= currentDailyMessageLimit;
  const isTrialGuestExpired =
    !isAuthenticated &&
    currentAccess?.plan === "trial_guest" &&
    currentAccess?.planStatus === "expired";

    const currentPlanKey = currentAccess?.plan ?? "trial_guest";
   const fallbackPlanPolicy = getPlanPolicy(currentPlanKey);
  const displayPlanLabel =
    currentAccess?.label ?? fallbackPlanPolicy.label;
  const displayUpgradeLabel =
    currentAccess?.upgradeLabel ?? fallbackPlanPolicy.upgradeLabel;
  const shouldShowUpgradePrompt =
    currentAccess?.nextPlan !== null &&
    currentAccess?.nextPlan !== undefined
      ? !!currentAccess.nextPlan
      : !!displayUpgradeLabel;
        const planOverlayStorageKey = isAuthenticated
  ? `virtus_seen_plan_overlay_${currentUser?.email || "account"}`
  : `virtus_seen_plan_overlay_guest`;

  useEffect(() => {
    if (!paymentSuccess) return;
    if (!isAuthenticated) return;

    let cancelled = false;

    async function refreshPaidAccount() {
      setPaymentSyncing(true);

      try {
        const authRes = await fetch("/api/auth/me", { cache: "no-store" });
        const authData = await authRes.json();

        if (cancelled) return;

        setIsAuthenticated(!!authData.isAuthenticated);
        setCurrentUser(authData.user || null);
        setAccountAccess(authData.access || null);
      } catch (error) {
      } finally {
        if (!cancelled) {
          setPaymentSyncing(false);
        }
      }
    }

    refreshPaidAccount();

    return () => {
      cancelled = true;
    };
  }, [paymentSuccess, isAuthenticated]);

  function getGuestSidebarTitle(plan) {
  return plan ? getPlanLabel(plan) : "Guest Session";
}

function getGuestSidebarChatId(plan, fallbackChatId) {
  return fallbackChatId;
}
function getGuestSidebarItem(plan, fallbackChatId) {
  return {
    id: getGuestSidebarChatId(plan, fallbackChatId),
    title: getGuestSidebarTitle(plan),
  };
}
function getGuestSidebarRecentConversations(plan, fallbackChatId) {
  const storedGuestChatsRaw = localStorage.getItem("virtus_guest_recent_chats");

  try {
    const parsedGuestChats = storedGuestChatsRaw
      ? JSON.parse(storedGuestChatsRaw)
      : [];

    if (Array.isArray(parsedGuestChats) && parsedGuestChats.length > 0) {
      return parsedGuestChats;
    }
  } catch {
    localStorage.removeItem("virtus_guest_recent_chats");
  }

  const guestSidebarChatId = getGuestSidebarChatId(plan, fallbackChatId);
  return [getGuestSidebarItem(plan, guestSidebarChatId)];
}
function getStoredGuestAccess() {
  const storedGuestAccessRaw = localStorage.getItem("virtus_guest_access");

  try {
    const parsedGuestAccess = storedGuestAccessRaw
      ? JSON.parse(storedGuestAccessRaw)
      : null;

        if (!parsedGuestAccess) {
      return null;
    }

    if (parsedGuestAccess.plan !== "trial_guest") {
      localStorage.removeItem("virtus_guest_access");
      return null;
    }

    return parsedGuestAccess;
  } catch {
    localStorage.removeItem("virtus_guest_access");
    return null;
  }
}

function normalizeGuestAccess(access) {
    if (!access) {
    return null;
  }

  if (access.plan !== "trial_guest") {
    localStorage.removeItem("virtus_guest_access");
    return null;
  }

  return access;
}

function getPlanCapabilityCard(plan) {
  if (plan === "trial_guest") {
    return {
      title: "Trial Guest",
      subtitle: "You are testing the stronger Virtus experience.",
      bullets: [
        "Strong premium-style feel for a limited trial",
        "Can guide reflection, planning, and pattern awareness",
        "Keeps continuity during the trial period",
        "After trial end, create an account to continue",
      ],
    };
  }

  if (plan === "free") {
    return {
      title: "Free",
      subtitle: "A lighter Virtus layer for everyday use.",
      bullets: [
        "Clear and useful answers",
        "Light awareness and challenge",
        "Basic saved-chat continuity",
        "Good for normal daily support",
      ],
    };
  }

  if (plan === "plus") {
    return {
      title: "Plus",
      subtitle: "A stronger personal coaching layer.",
      bullets: [
        "Stronger pattern detection and thought awareness",
        "More direct coaching-style guidance",
        "Stronger personal continuity",
        "Better support for reflection, planning, and decisions",
      ],
    };
  }

  return {
    title: "Premium / Virtus Prime",
    subtitle: "The strongest Virtus layer.",
    bullets: [
      "Deepest personalization and continuity",
      "Strongest cognitive discipline and correction",
      "Strategic guidance and project continuity",
      "Highest support depth across personal and project work",
    ],
  };
}
    useEffect(() => {
    const storedTrialUsed = localStorage.getItem("virtus_trial_used") === "true";
    const parsedGuestAccess = getStoredGuestAccess();
    const normalizedGuestAccess = normalizeGuestAccess(parsedGuestAccess);

    if (storedTrialUsed && !normalizedGuestAccess) {
      setGuestAccess({
        plan: "trial_guest",
        planStatus: "expired",
        trialStartedAt: null,
        trialEndsAt: null,
      });

      const lockedChatId =
        localStorage.getItem("virtus_chat_id") || crypto.randomUUID();

      localStorage.setItem("virtus_chat_id", lockedChatId);
      setActiveChatId(lockedChatId);
      return;
    }

    const guestId =
      localStorage.getItem("virtus_guest_id") || crypto.randomUUID();

    localStorage.setItem("virtus_guest_id", guestId);
setShowPlanOverlay(localStorage.getItem(planOverlayStorageKey) !== "true");
    setGuestAccess(normalizedGuestAccess);

    const savedChatId = getGuestSidebarChatId(
      normalizedGuestAccess?.plan,
      localStorage.getItem("virtus_chat_id") || crypto.randomUUID()
    );

    localStorage.setItem("virtus_chat_id", savedChatId);
    setActiveChatId(savedChatId);
  }, []);

  useEffect(() => {
    let mounted = true;

        async function loadAuthAndSidebar() {
      try {
        const authRes = await fetch("/api/auth/me", { cache: "no-store" });
const authData = await authRes.json();

if (!mounted) return;

const loggedIn = !!authData.isAuthenticated;

setIsAuthenticated(loggedIn);
setCurrentUser(authData.user || null);
setAccountAccess(authData.access || null);
        if (loggedIn) {
                    const sessionsRes = await fetch("/api/chat-sessions", { cache: "no-store" });
          const sessionsData = await sessionsRes.json();

          if (!mounted) return;

          setRecentConversations(
            (sessionsData.sessions || []).map((item) => ({
              id: item.id,
              title: item.title || "New chat",
            }))
          );
                                       } else {
          const guestId =
            localStorage.getItem("virtus_guest_id") || crypto.randomUUID();

          localStorage.setItem("virtus_guest_id", guestId);

          const fallbackChatId =
            localStorage.getItem("virtus_chat_id") || crypto.randomUUID();

          localStorage.setItem("virtus_chat_id", fallbackChatId);

          const storedGuestAccess = getStoredGuestAccess();
          setGuestAccess(normalizeGuestAccess(storedGuestAccess));

          try {
            const guestConversationsRes = await fetch("/api/conversations", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                guestId,
                chatId: fallbackChatId,
              }),
            });

            const guestConversationsData = await guestConversationsRes.json();

            if (!mounted) return;

            if (guestConversationsData.access) {
              localStorage.setItem(
                "virtus_guest_access",
                JSON.stringify(guestConversationsData.access)
              );
              setGuestAccess(
                normalizeGuestAccess(guestConversationsData.access)
              );

              if (
                guestConversationsData.access.plan === "trial_guest" &&
                guestConversationsData.access.planStatus === "expired"
              ) {
                localStorage.setItem("virtus_trial_used", "true");
              }

              setRecentConversations(
                getGuestSidebarRecentConversations(
                  guestConversationsData.access.plan,
                  fallbackChatId
                )
              );
            } else {
              const guestPlan = storedGuestAccess?.plan;

              setRecentConversations(
                getGuestSidebarRecentConversations(
                  guestPlan,
                  fallbackChatId
                )
              );
            }
          } catch (guestLoadError) {
            const guestPlan = storedGuestAccess?.plan;

            setRecentConversations(
              getGuestSidebarRecentConversations(
                guestPlan,
                fallbackChatId
              )
            );
          }
        }
      } catch (error) {
        if (!mounted) return;

        setIsAuthenticated(false);
        setCurrentUser(null);

                       const storedGuestAccess = getStoredGuestAccess();

                const guestPlan = storedGuestAccess?.plan;
                setGuestAccess(normalizeGuestAccess(storedGuestAccess));
        
                setRecentConversations(
  getGuestSidebarRecentConversations(
    guestPlan,
    localStorage.getItem("virtus_chat_id") ||
      localStorage.getItem("virtus_guest_id") ||
      crypto.randomUUID()
  )
);
      }
    }

    loadAuthAndSidebar();

    return () => {
      mounted = false;
    };
    }, [isAuthenticated]);

  useEffect(() => {
  if (!shouldAutoScroll) return;
  if (!messagesEndRef.current) return;

  messagesEndRef.current.scrollIntoView({
    behavior: loading ? "auto" : "smooth",
    block: "end",
  });
}, [conversation, loading, shouldAutoScroll]);
useEffect(() => {
  const container = scrollContainerRef.current;
  if (!container) return;

  const handleScroll = () => {
    if (!loading) return;

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    if (distanceFromBottom > 120) {
      setShouldAutoScroll(false);
    }
  };

  container.addEventListener("scroll", handleScroll);

  return () => {
    container.removeEventListener("scroll", handleScroll);
  };
}, [loading]);
  useEffect(() => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    textarea.style.height = "0px";

    const newHeight = Math.min(textarea.scrollHeight, 160);
    textarea.style.height = `${newHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > 160 ? "auto" : "hidden";
  }, [message]);
    async function handleLogout() {
    try {
            await fetch("/api/auth/signout", {
        method: "POST",
      });
    } catch (error) {
      console.error("LOGOUT ERROR:", error);
    }

    setIsAuthenticated(false);
    setCurrentUser(null);
    setAccountAccess(null);
    setConversation([]);

    const storedGuestAccess = getStoredGuestAccess();
    const normalizedGuestAccess = normalizeGuestAccess(storedGuestAccess);

    setGuestAccess(normalizedGuestAccess);

    const guestId =
      localStorage.getItem("virtus_guest_id") || crypto.randomUUID();

    localStorage.setItem("virtus_guest_id", guestId);

    const nextGuestChatId =
      localStorage.getItem("virtus_chat_id") || crypto.randomUUID();

    localStorage.setItem("virtus_chat_id", nextGuestChatId);
    setActiveChatId(nextGuestChatId);

    setRecentConversations(
      getGuestSidebarRecentConversations(
        normalizedGuestAccess?.plan,
        nextGuestChatId
      )
    );

    router.refresh();
    router.push("/");
  }

  async function sendMessage() {
    if (!message.trim()) return;
    setConversation((prev) => {
  const cleaned = [...prev];

  while (
    cleaned.length > 0 &&
    cleaned[cleaned.length - 1]?.role === "assistant" &&
    !cleaned[cleaned.length - 1]?.text?.trim()
  ) {
    cleaned.pop();
  }

  return [
    ...cleaned,
    { role: "user", text: message },
    { role: "assistant", text: "" },
  ];
});
    const userMessage = message;

setLastMessage(userMessage);
setLoading(true);
setShouldAutoScroll(true);
abortControllerRef.current = new AbortController();
setReply("");
setStreamingReply("");

    try {
      let guestId = null;

      if (!isAuthenticated) {
        guestId = localStorage.getItem("virtus_guest_id") || crypto.randomUUID();
        localStorage.setItem("virtus_guest_id", guestId);
      }
const res = await fetch("/api/chat", {
  method: "POST",
    headers: {
    "Content-Type": "application/json",
  },
  cache: "no-store",
    signal: abortControllerRef.current.signal,
  body: JSON.stringify({
    message: userMessage,
    chatId: activeChatId,
    ...(isAuthenticated ? {} : { guestId }),
  }),
});

let data = null;
const contentType = res.headers.get("content-type") || "";

if (contentType.includes("application/json")) {
  const parsedJson = await res.json();
  data = parsedJson;
} else {
  const reader = res.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    throw new Error("No response body");
  }

  const processStreamPart = (part) => {
    const line = part.trim();

    if (!line.startsWith("data: ")) return;

    const jsonText = line.slice(6).trim();
    if (!jsonText) return;

    const parsed = JSON.parse(jsonText);

    if (parsed.type === "delta") {
      setStreamingReply((prev) => {
        const nextReply = prev + (parsed.delta || "");

        setConversation((prevConversation) => {
          const nextConversation = [...prevConversation];
          if (nextConversation.length > 0) {
            nextConversation[nextConversation.length - 1] = {
              role: "assistant",
              text: nextReply,
            };
          }
          return nextConversation;
        });

        return nextReply;
      });
    }

    if (parsed.type === "done") {
      data = parsed;
    }

    if (parsed.type === "error") {
      throw new Error(parsed.error || "Streaming failed");
    }
  };

  let done = false;
  let bufferedText = "";

  while (!done) {
    const result = await reader.read();
    done = result.done;

    if (!result.value) continue;

    bufferedText += decoder.decode(result.value, { stream: true });

    const parts = bufferedText.split("\n\n");
    bufferedText = parts.pop() || "";

    for (const part of parts) {
      processStreamPart(part);
    }
  }

  if (bufferedText.trim()) {
    processStreamPart(bufferedText);
  }
}


const assistantReply = data?.reply || "";
             if (data.access) {
        if (isAuthenticated) {
          setAccountAccess(data.access);
        } else {
          localStorage.setItem("virtus_guest_access", JSON.stringify(data.access));
          setGuestAccess(normalizeGuestAccess(data.access));

          if (
            data.access.plan === "trial_guest" &&
            data.access.planStatus === "expired"
          ) {
            localStorage.setItem("virtus_trial_used", "true");
          }

          const resolvedChatId = getGuestSidebarChatId(
            data.access.plan,
            activeChatId
          );

          localStorage.setItem("virtus_chat_id", resolvedChatId);
          setActiveChatId(resolvedChatId);
        }
      }

      if (assistantReply) {
  setReply(assistantReply);
  setStreamingReply(assistantReply);

  setConversation((prev) => {
    const next = [...prev];
    if (next.length > 0) {
      next[next.length - 1] = {
        role: "assistant",
        text: assistantReply,
      };
    }
    return next;
  });

                if (activeChatId) {
          setRecentConversations((prev) => {
            const resolvedPlan =
              !isAuthenticated && data.access ? data.access.plan : guestAccess?.plan;

            const resolvedSidebarChatId =
              !isAuthenticated
                ? getGuestSidebarChatId(resolvedPlan, activeChatId)
                : activeChatId;

            const newItem = !isAuthenticated
              ? {
                  id: resolvedSidebarChatId,
                  title: message.trim().slice(0, 60) || "New chat",
                }
              : {
                  id: resolvedSidebarChatId,
                  title: message.trim().slice(0, 60) || "New chat",
                };

            const nextRecentConversations = [
              newItem,
              ...prev.filter((item) => item.id !== resolvedSidebarChatId),
            ];

                        if (!isAuthenticated) {
              const guestOnlyRecentConversations = nextRecentConversations.filter(
                (item) => item?.id
              );

              localStorage.setItem(
                "virtus_guest_recent_chats",
                JSON.stringify(guestOnlyRecentConversations)
              );

              return guestOnlyRecentConversations;
            }

            return nextRecentConversations;
          });
        }

        setMessage("");
setStreamingReply("");
      } else if (data.error) {
        setReply(data.error);
      } else {
        setReply("No reply received.");
      }
        } catch (error) {
  if (error?.name === "AbortError") {
  abortControllerRef.current = null;
  setReply("");
  setStreamingReply("");
  setConversation((prev) => {
  const next = [...prev];

  if (next.length > 0 && next[next.length - 1]?.role === "assistant") {
    next.pop();
  }

  if (next.length > 0 && next[next.length - 1]?.role === "user") {
    next.pop();
  }

  return next;
});
  setLoading(false);
  return;
}
}

    abortControllerRef.current = null;
setLoading(false);
  }

  return (
   <main
  className="h-screen overflow-hidden bg-black text-white"
  onClick={() => {
    if (!showPlanOverlay) return;
    setShowPlanOverlay(false);
    localStorage.setItem(planOverlayStorageKey, "true");
  }}
>
      <div className="flex h-full">
        <aside className="w-72 bg-zinc-950 border-r border-zinc-800 flex h-full flex-col">
          <div className="px-4 py-5 border-b border-zinc-800 flex justify-center">
            <div className="relative h-60 w-60 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
              <Image
                src="/virtus-logo.png"
                alt="Virtus AI logo"
                fill
                className="object-cover"
                sizes="240px"
              />
            </div>
          </div>

                    <div className="flex-1 p-3 overflow-y-auto no-scrollbar">
            <button
             onClick={() => {
  const newChatId = getGuestSidebarChatId(
    guestAccess?.plan,
    crypto.randomUUID()
  );

  localStorage.setItem("virtus_chat_id", newChatId);
  setActiveChatId(newChatId);
  setConversation([]);

        if (!isAuthenticated) {
      const existingGuestChatsRaw = localStorage.getItem("virtus_guest_recent_chats");

      let existingGuestChats = [];
      try {
        existingGuestChats = existingGuestChatsRaw
          ? JSON.parse(existingGuestChatsRaw)
          : [];
      } catch {
        localStorage.removeItem("virtus_guest_recent_chats");
      }

      const nextGuestChats = [
        {
          id: newChatId,
          title: "New chat",
        },
        ...existingGuestChats.filter((item) => item.id !== newChatId),
      ];

      localStorage.setItem(
        "virtus_guest_recent_chats",
        JSON.stringify(nextGuestChats)
      );

      setRecentConversations(nextGuestChats);
    }
}}
             className="w-full rounded-xl border border-zinc-900 bg-zinc-950/60 px-4 py-3 text-left text-sm text-zinc-200 hover:bg-zinc-900"
            >
              + New chat
            </button>

            <div className="mt-6">
              <p className="px-2 text-[11px] font-medium uppercase tracking-wide text-zinc-500 mb-2">
                Recent
              </p>

              <div className="space-y-2">
                {recentConversations.length === 0 ? (
                  <div className="rounded-xl px-3 py-2 text-sm text-zinc-400 bg-zinc-900/60 border border-zinc-800">
                    Recent conversations will appear here
                  </div>
                ) : (
                  recentConversations.map((item) => (
                    <button
                      key={item.id}
                      onClick={async () => {
                        const guestId =
                          localStorage.getItem("virtus_guest_id") ||
                          crypto.randomUUID();

                        localStorage.setItem("virtus_guest_id", guestId);
                        setLoading(true);

                        try {
                          const res = await fetch("/api/conversations", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
        chatId: getGuestSidebarChatId(guestAccess?.plan, item.id),
    ...(isAuthenticated ? {} : { guestId }),
  }),
                          });

                          const data = await res.json();

if (data.access) {
  if (isAuthenticated) {
    setAccountAccess(data.access);
  } else {
    localStorage.setItem("virtus_guest_access", JSON.stringify(data.access));
    setGuestAccess(normalizeGuestAccess(data.access));

    if (
      data.access.plan === "trial_guest" &&
      data.access.planStatus === "expired"
    ) {
      localStorage.setItem("virtus_trial_used", "true");
    }
  }
}

const resolvedPlan = !isAuthenticated
  ? data.access?.plan ?? guestAccess?.plan
  : null;

const resolvedChatId = !isAuthenticated
  ? getGuestSidebarChatId(resolvedPlan, item.id)
  : item.id;

if (data.conversation) {
  setConversation(data.conversation);
  setActiveChatId(resolvedChatId);
  localStorage.setItem("virtus_chat_id", resolvedChatId);

  if (!isAuthenticated) {
  setRecentConversations(
    getGuestSidebarRecentConversations(resolvedPlan, resolvedChatId)
  );
}
} else {
  setConversation([]);

  if (!isAuthenticated) {
  setRecentConversations(
    getGuestSidebarRecentConversations(resolvedPlan, resolvedChatId)
  );
}
}
                        } catch (error) {
                          setConversation([]);
                        }

                        setLoading(false);
                      }}
                     className="w-full rounded-xl px-3 py-2 text-left text-sm text-zinc-200 bg-zinc-950/40 border border-zinc-900 hover:bg-zinc-900/80"
                    >
                      {item.title}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

                    <div className="border-t border-zinc-800 p-3">
                                    {isAuthenticated ? (
                            <div className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-950 bg-black/30 px-3 py-3 text-white transition hover:border-zinc-800 hover:bg-zinc-950/50">
              <Link
                  href="/account"
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-xl hover:bg-zinc-800/60 px-1 py-1 transition"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-700 text-sm font-semibold text-white">
                    V
                  </div>

                  <div className="min-w-0 text-left">
                    <p className="text-sm font-medium text-white">Account</p>
                    <p className="text-xs text-zinc-400 truncate">
                      {currentUser?.email?.split("@")[0] || "You are signed in"}
                    </p>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-xl border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800"
                >
                  Log out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                                               className="flex items-center gap-3 rounded-2xl border border-zinc-950 bg-black/30 px-3 py-3 text-white transition hover:border-zinc-800 hover:bg-zinc-950/50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-700 text-sm font-semibold text-white">
                  V
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">Log in</p>
                  <p className="text-xs text-zinc-400">Access your account</p>
                </div>
              </Link>
            )}
          </div>
        </aside>

        <section className="relative flex-1 flex justify-center bg-black">
          <div className="w-full max-w-4xl h-full flex flex-col">
            {showPlanOverlay && (
  <div
    className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 px-6"
    onClick={() => {
      setShowPlanOverlay(false);
      localStorage.setItem(planOverlayStorageKey, "true");
    }}
  >
    <div
      className="w-full max-w-5xl rounded-3xl border border-zinc-800 bg-zinc-950/95 p-6"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-6">
        <p className="text-xs uppercase tracking-wide text-zinc-500">
          Virtus AI Plans
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">
          Choose the level of Virtus you want to understand
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          Click outside this panel to continue.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            title: "Trial Guest",
            subtitle: "Premium-style trial access",
            bullets: [
              "Strong guided experience during the trial",
              "Can support reflection, planning, and awareness work",
              "Keeps continuity during the trial period",
              "Ends after the trial and then requires account continuation",
            ],
          },
          {
            title: "Free",
            subtitle: "Light Virtus layer",
            bullets: [
              "Clear and useful help",
              "Lighter awareness and challenge",
              "Basic saved-chat continuity",
              "Best for normal daily support",
            ],
          },
          {
            title: "Plus",
            subtitle: "Stronger personal coaching layer",
            bullets: [
              "More direct coaching-style support",
              "Stronger pattern and thought awareness",
              "Better personal continuity",
              "Better for reflection, planning, and decisions",
            ],
          },
          {
            title: "Premium / Virtus Prime",
            subtitle: "Strongest Virtus layer",
            bullets: [
              "Deepest personalization",
              "Strongest guidance and correction",
              "Strategic and project continuity",
              "Highest support depth",
            ],
          },
        ].map((card) => (
          <div
            key={card.title}
            className="rounded-2xl border border-zinc-800 bg-black/30 p-4"
          >
            <h3 className="text-lg font-semibold text-white">{card.title}</h3>
            <p className="mt-1 text-sm text-zinc-400">{card.subtitle}</p>

            <div className="mt-4 space-y-2">
              {card.bullets.map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-300"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
)}
            <div className="px-6 py-4 border-b border-zinc-800">
  <div className="flex items-center justify-between gap-4">
    <p className="text-sm text-zinc-300">Virtus</p>

                <div className="text-right">
      <Link href="/upgrade" className="text-xs text-zinc-400 hover:text-zinc-200 transition">
        Plan: {displayPlanLabel}
      </Link>

      {isTrialGuestExpired && (
        <p className="text-xs text-amber-400 mt-1">
          Trial ended. Create an account to continue.
        </p>
      )}

      {shouldShowUpgradePrompt && (
        <Link
          href={
            isTrialGuestExpired
              ? "/upgrade"
              : isAuthenticated
              ? "/upgrade"
              : "/login"
          }
          className="inline-block text-xs text-zinc-500 mt-1 hover:text-zinc-300 transition"
        >
          {isTrialGuestExpired ? "Create account to continue" : displayUpgradeLabel}
        </Link>
      )}
    </div>
  </div>
</div>

            <div
  ref={scrollContainerRef}
  className="flex-1 overflow-y-auto px-6 py-6 min-h-0 no-scrollbar"
>
              {conversation.length > 0 || loading ? (
                <div className="space-y-4">
                  {conversation.map((item, index) => (
                    <div
                      key={index}
                                            className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                        item.role === "user"
                                                                              ? "ml-auto bg-black/30 border border-zinc-950 text-white transition hover:border-zinc-800 hover:bg-zinc-950/50"
                                                                              : "mr-auto bg-black/25 border border-zinc-950 text-gray-300 transition hover:border-zinc-800 hover:bg-zinc-950/45"
                      }`}
                    >
                      <div className="mb-1 flex items-center justify-between gap-3">
  <p className="text-xs text-zinc-400">
    {item.role === "user" ? "You" : "Virtus"}
  </p>

  <div className="flex items-center gap-3">
    {item.role === "user" &&
      index === conversation.length - 2 &&
      !loading && (
        <button
          type="button"
          onClick={() => {
            setMessage(item.text);
            setEditingIndex(index);

            setConversation((prev) => prev.slice(0, index));
          }}
          className="text-[11px] text-zinc-400 hover:text-zinc-200"
        >
          Edit
        </button>
      )}

    {item.role === "assistant" &&
      index === conversation.length - 1 &&
      index > 0 &&
      conversation[index - 1]?.role === "user" &&
      !loading && (
        <button
          type="button"
          onClick={() => {
            const lastUserMessage = conversation[index - 1]?.text || "";

            if (!lastUserMessage) return;

            setRegenerating(true);
            setMessage(lastUserMessage);
            setConversation((prev) => prev.slice(0, index));
          }}
          className="text-[11px] text-zinc-400 hover:text-zinc-200"
        >
          Regenerate
        </button>
      )}
  </div>
</div>

                     {item.role === "assistant" ? (
  item.text?.trim() ? (
    <ReactMarkdown
      components={{
        p: ({ children }) => (
          <p className="mb-2 last:mb-0 leading-7">
            {children}
          </p>
        ),
        ul: ({ children }) => (
          <ul className="list-disc pl-6 mb-3 space-y-1">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal pl-6 mb-3 space-y-1">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="leading-7">{children}</li>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold">
            {children}
          </strong>
        ),
        em: ({ children }) => (
          <em className="italic">{children}</em>
        ),
        code: ({ children }) => (
          <code className="px-1 py-0.5 rounded bg-black/20 text-sm">
            {children}
          </code>
        ),
        h1: ({ children }) => (
          <h1 className="text-xl font-bold mb-2">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-lg font-bold mb-2">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-base font-bold mb-2">
            {children}
          </h3>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 pl-4 italic opacity-90 mb-2">
            {children}
          </blockquote>
        ),
      }}
    >
      {item.text}
    </ReactMarkdown>
  ) : (
    <p className="text-gray-400">Thinking...</p>
  )
) : (
  <p className="whitespace-pre-wrap leading-7">
    {item.text}
  </p>
)}
                    </div>
                  ))}

                   {loading && conversation.length === 0 && (
                    <div className="max-w-[75%] rounded-2xl px-4 py-3 mr-auto bg-zinc-800/70 text-gray-300">
                      <p className="text-xs text-zinc-400 mb-1">Virtus</p>
                      <p className="text-gray-300">Thinking...</p>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
                            ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-zinc-500 text-base">Ask Virtus anything.</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-zinc-800">
                                          <div className="relative rounded-[28px] border border-zinc-950 bg-black/30 transition hover:border-zinc-800 hover:bg-zinc-950/50">
  {isEditing && (
    <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-2 text-xs text-zinc-400">
      <span>Editing last message</span>
      <button
        type="button"
        onClick={cancelEdit}
        className="text-zinc-400 hover:text-zinc-200"
      >
        Cancel
      </button>
    </div>
  )}
                <textarea
  ref={textareaRef}
 className="w-full min-h-[60px] max-h-40 resize-none overflow-y-auto no-scrollbar rounded-[28px] bg-transparent px-5 py-4 pr-28 text-gray-100 placeholder:text-zinc-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
    placeholder={
    isTrialGuestExpired
      ? "Your Trial Guest access has ended. Please create an account to continue."
      : isDailyLimitReached
      ? "Daily limit reached for your current plan"
      : "Message Virtus..."
  }
  value={message}
  disabled={loading || isDailyLimitReached || isTrialGuestExpired}
  onChange={(e) => setMessage(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }}
/>

                <div className="absolute bottom-3 right-3 flex items-center gap-3">
                  <button
                    type="button"
                    className="flex h-7 w-7 items-center justify-center text-white/80"
                    aria-label="Microphone"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-4 w-4"
                    >
                      <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <path d="M12 19v3" />
                    </svg>
                  </button>

                  <button
  disabled={isDailyLimitReached}
  onClick={() => {
    if (loading) {
  setShouldAutoScroll(false);
  abortControllerRef.current?.abort();
  return;
}

    sendMessage();
  }}
  className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black disabled:cursor-not-allowed disabled:opacity-50"
  aria-label={loading ? "Stop" : "Send"}
>
  {loading ? (
    <span className="text-xs font-semibold">■</span>
  ) : (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      className="h-5 w-5"
    >
      <path d="M12 19V5" />
      <path d="m5 12 7-7 7 7" />
    </svg>
  )}
</button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}