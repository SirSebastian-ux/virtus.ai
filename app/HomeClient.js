"use client";

import SplashScreen from "./components/SplashScreen";
import ReactMarkdown from "react-markdown";
import { useEffect, useRef, useState } from "react";
import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { getPlanLabel, getPlanPolicy } from "@/data/virtus-plan-policy";
import { virtusPracticeCategories } from "@/data/virtus-practice-categories";

export default function HomeClient() {
const [showSplash, setShowSplash] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("");
const [uploadingFile, setUploadingFile] = useState(false);
const [uploadedFiles, setUploadedFiles] = useState([]);
const [showFileMenu, setShowFileMenu] = useState(false);
const [activeFile, setActiveFile] = useState(null);
const [activeFiles, setActiveFiles] = useState([]);
const [showDocumentLibrary, setShowDocumentLibrary] = useState(false);
const [confirmDeleteFileId, setConfirmDeleteFileId] = useState(null);
const [fileNotice, setFileNotice] = useState("");
const [imagePreviewFile, setImagePreviewFile] = useState(null);
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
const [editingText, setEditingText] = useState("");
const [copiedIndex, setCopiedIndex] = useState(null);
const [assistantFeedback, setAssistantFeedback] = useState({});
const isEditing = editingIndex !== null;
const [regenerating, setRegenerating] = useState(false);
const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
const [showPlanOverlay, setShowPlanOverlay] = useState(false);
const [paymentSyncing, setPaymentSyncing] = useState(false);
const [listening, setListening] = useState(false);
const recognitionRef = useRef(null);
const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(false);
const [speaking, setSpeaking] = useState(false);
const [availableVoices, setAvailableVoices] = useState([]);
const [selectedVoiceURI, setSelectedVoiceURI] = useState("");
const [openMessageMenuIndex, setOpenMessageMenuIndex] = useState(null);
const [showMobileMenu, setShowMobileMenu] = useState(false);
const [practiceOpen, setPracticeOpen] = useState(false);
const [isPracticeMode, setIsPracticeMode] = useState(null);
const mobileMenuTouchStartXRef = useRef(null);
const edgeSwipeStartRef = useRef(null);
const [voiceStyle, setVoiceStyle] = useState("default");
const speechRef = useRef(null);

const hasSpeechOutput = () => {
  if (typeof window === "undefined") return false;

  return (
    "speechSynthesis" in window &&
    "SpeechSynthesisUtterance" in window
  );
};

const cleanTextForSpeech = (text) => {
  return String(text || "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/[#*_>`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

const stopVirtusVoice = () => {
  if (!hasSpeechOutput()) return;

  window.speechSynthesis.cancel();
  speechRef.current = null;
  setSpeaking(false);
};

const getPreferredVoice = (styleOverride = voiceStyle) => {
  if (!availableVoices.length) return null;

  const englishVoices = availableVoices.filter((voice) =>
    voice.lang?.toLowerCase().startsWith("en")
  );

  const voicesToSearch =
    englishVoices.length > 0 ? englishVoices : availableVoices;

  if (styleOverride === "female") {
    return (
      voicesToSearch.find((voice) =>
        /female|woman|zira|aria|jenny|susan|samantha|victoria|karen|moira|tessa|serena|sonia/i.test(
          voice.name
        )
      ) || voicesToSearch[0]
    );
  }

  if (styleOverride === "male") {
    return (
      voicesToSearch.find((voice) =>
        /male|man|david|mark|guy|daniel|alex|fred|george|thomas|richard|ryan|aaron/i.test(
          voice.name
        )
      ) || voicesToSearch[0]
    );
  }

  if (selectedVoiceURI) {
    const manuallySelectedVoice = availableVoices.find(
      (voice) => voice.voiceURI === selectedVoiceURI
    );

    if (manuallySelectedVoice) {
      return manuallySelectedVoice;
    }
  }

  return voicesToSearch[0];
};

const speakVirtusReply = (text, styleOverride = voiceStyle) => {
  if (!hasSpeechOutput()) return;

  const cleanText = cleanTextForSpeech(text);

  if (!cleanText) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(cleanText);
  const selectedVoice = getPreferredVoice(styleOverride);

  if (selectedVoice) {
    utterance.voice = selectedVoice;
    utterance.lang = selectedVoice.lang || "en-US";
  } else {
    utterance.lang = "en-US";
  }

  utterance.rate = 0.93;
  utterance.pitch = styleOverride === "male" ? 0.9 : 1;
  utterance.volume = 1;

  utterance.onstart = () => {
    setSpeaking(true);
  };

  utterance.onend = () => {
    setSpeaking(false);
    speechRef.current = null;
  };

  utterance.onerror = () => {
    setSpeaking(false);
    speechRef.current = null;
  };

  speechRef.current = utterance;
  window.speechSynthesis.speak(utterance);
};

useEffect(() => {
setShowSplash(true);
sessionStorage.removeItem("virtus_splash_seen");
  const storedTrialUsed = localStorage.getItem("virtus_trial_used") === "true";
  if (typeof window === "undefined") return;

  if (!("speechSynthesis" in window)) return;

  const loadVoices = () => {
    const voices = window.speechSynthesis.getVoices();

    setAvailableVoices(voices);

    if (!selectedVoiceURI && voices.length > 0) {
      const preferredVoice =
        voices.find((voice) =>
          voice.lang?.toLowerCase().startsWith("en")
        ) || voices[0];

      setSelectedVoiceURI(preferredVoice.voiceURI);
    }
  };

  loadVoices();

  window.speechSynthesis.onvoiceschanged = loadVoices;

  return () => {
    window.speechSynthesis.cancel();
    window.speechSynthesis.onvoiceschanged = null;
  };
}, [selectedVoiceURI]);
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
const handleMicrophoneClick = () => {
  if (typeof window === "undefined") return;

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert("Voice input is not supported in this browser.");
    return;
  }

  if (listening && recognitionRef.current) {
  recognitionRef.current.abort();
  recognitionRef.current = null;
  setListening(false);
  return;
}

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = true;
  recognition.continuous = true;

  recognition.onstart = () => {
    setListening(true);
  };

  recognition.onresult = (event) => {
  let transcript = "";

  for (let i = 0; i < event.results.length; i += 1) {
    transcript += event.results[i][0].transcript;
  }

  setMessage(transcript.trim());
};

  recognition.onerror = () => {
    setListening(false);
  };

  recognition.onend = () => {
    setListening(false);
  };

  recognitionRef.current = recognition;
  recognition.start();
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

  const practicePlanRank = {
    guest: 0,
    trial_guest: 1,
    free: 1,
    plus: 2,
    premium: 3,
  };

  const getPracticePlanRank = (plan) => {
    return practicePlanRank[plan] ?? 0;
  };

  const isTrialGuestPracticeSample = (category) => {
    return (
      currentPlanKey === "trial_guest" &&
      !isTrialGuestExpired &&
      category.trialGuestSample === true
    );
  };

  const canUsePracticeCategory = (category) => {
    if (isTrialGuestExpired) return false;

    if (isTrialGuestPracticeSample(category)) {
      return true;
    }

    const requiredPlan = category.minimumPlan || "free";
    const currentRank = getPracticePlanRank(currentPlanKey);
    const requiredRank = getPracticePlanRank(requiredPlan);

    return currentRank >= requiredRank;
  };

  const getPracticeCategoryPrompt = (category) => {
    if (isTrialGuestPracticeSample(category)) {
      return category.trialGuestPrompt || category.prompt;
    }

    return category.prompt;
  };

  const getPracticeCategoryAccessLabel = (category, canUseCategory) => {
    const requiredPlan = category.minimumPlan || "free";

    if (isTrialGuestPracticeSample(category)) {
      return "Trial Sample";
    }

    if (requiredPlan === "free") {
      return "";
    }

    return canUseCategory ? requiredPlan : `Locked - ${requiredPlan}`;
  };

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

    if (Array.isArray(parsedGuestChats)) {
      const cleanGuestChats = parsedGuestChats.filter(
        (item) =>
          item?.id &&
          item?.title &&
          item.title.trim() !== "New chat"
      );

      localStorage.setItem(
        "virtus_guest_recent_chats",
        JSON.stringify(cleanGuestChats)
      );

      return cleanGuestChats;
    }
  } catch {
    localStorage.removeItem("virtus_guest_recent_chats");
  }

  localStorage.removeItem("virtus_guest_recent_chats");
  return [];
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
const newHeight = Math.min(textarea.scrollHeight, 288);
textarea.style.height = `${newHeight}px`;
textarea.style.overflowY = textarea.scrollHeight > 288 ? "auto" : "hidden";
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

async function loadUploadedFiles() {
  try {
    const response = await fetch("/api/files/list");
    const data = await response.json();

    if (!response.ok) {
      return;
    }

    setUploadedFiles(data.files || []);
  } catch {
    setUploadedFiles([]);
  }
}

async function handleDeleteFile(file) {
  if (!file?.id) return;


  try {
    const response = await fetch("/api/files/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileId: file.id,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "File delete failed.");
      return;
    }

    setUploadedFiles((currentFiles) =>
      currentFiles.filter((item) => item.id !== file.id)
    );

    setActiveFiles((currentFiles) =>
      currentFiles.filter((item) => item.id !== file.id)
    );

    if (activeFile?.id === file.id) {
      setActiveFile(null);
    }
  } catch (error) {
    alert(error.message || "File delete failed.");
  }
}

async function handleFileUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  setUploadingFile(true);

  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch("/api/files/upload", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      setFileNotice(
        data.error === "Not authenticated"
          ? "Sign in required to upload documents."
          : data.error || "File upload failed."
      );
      return;
    }

    setFileNotice("");
await loadUploadedFiles();

if (data.file?.id) {
  setActiveFile(data.file);
  setActiveFiles((currentFiles) => {
    const alreadyAttached = currentFiles.some(
      (item) => item.id === data.file.id
    );

    if (alreadyAttached) {
      return currentFiles;
    }

    return [...currentFiles, data.file];
  });
}

setShowDocumentLibrary(false);
setShowFileMenu(false);
setTimeout(() => {
  textareaRef.current?.focus();
}, 50);
  } catch (error) {
    setFileNotice(error.message || "File upload failed.");
  } finally {
    setUploadingFile(false);
    event.target.value = "";
  }
}

async function handleCreateDocxFile({ title, content, fileName }) {
  const cleanContent = String(content || "").trim();

  if (!cleanContent) {
    setFileNotice("There is no content to create a Word document from.");
    return;
  }

  setFileNotice("");

  try {
    const response = await fetch("/api/files/create-docx", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: title || "Virtus Document",
        content: cleanContent,
        fileName: fileName || title || "virtus-document",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setFileNotice(
        data.error === "Not authenticated"
          ? "Sign in required to create Word documents."
          : data.error || "Document creation failed."
      );
      return;
    }

    await loadUploadedFiles();

      if (data.file?.id) {
      window.location.href = `/api/files/download?fileId=${encodeURIComponent(
        data.file.id
      )}`;
    }

    setShowDocumentLibrary(false);
    setShowFileMenu(false);
  } catch (error) {
    setFileNotice(error.message || "Document creation failed.");
  }
}

async function handleCreatePdfFile({ title, content, fileName }) {
  const cleanContent = String(content || "").trim();

  if (!cleanContent) {
    setFileNotice("There is no content to create a PDF document from.");
    return;
  }

  setFileNotice("");

  try {
    const response = await fetch("/api/files/create-pdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: title || "Virtus Document",
        content: cleanContent,
        fileName: fileName || title || "virtus-document",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setFileNotice(
        data.error === "Not authenticated"
          ? "Sign in required to create PDF documents."
          : data.error || "PDF creation failed."
      );
      return;
    }

    await loadUploadedFiles();

    if (data.file?.id) {
      window.location.href = `/api/files/download?fileId=${encodeURIComponent(
        data.file.id
      )}`;
    }

    setShowDocumentLibrary(false);
    setShowFileMenu(false);
  } catch (error) {
    setFileNotice(error.message || "PDF creation failed.");
  }
}

async function handleCreatePptxFile({ title, content, fileName }) {
  const cleanContent = String(content || "").trim();

  if (!cleanContent) {
    setFileNotice("There is no content to create a PowerPoint presentation from.");
    return;
  }

  setFileNotice("");

  try {
    const response = await fetch("/api/files/create-pptx", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: title || "Virtus Presentation",
        content: cleanContent,
        fileName: fileName || title || "virtus-presentation",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setFileNotice(
        data.error === "Not authenticated"
          ? "Sign in required to create PowerPoint presentations."
          : data.error || "PowerPoint creation failed."
      );
      return;
    }

    await loadUploadedFiles();

    if (data.file?.id) {
      window.location.href = `/api/files/download?fileId=${encodeURIComponent(
        data.file.id
      )}`;
    }

    setShowDocumentLibrary(false);
    setShowFileMenu(false);
  } catch (error) {
    setFileNotice(error.message || "PowerPoint creation failed.");
  }
}


function isImageCreationRequest(text) {
  const clean = String(text || "").toLowerCase();

  if (/\b(do not|don't|dont|no)\s+(create|generate|make|draw)\b.{0,40}\b(image|picture|visual|illustration|photo)\b/i.test(clean)) {
    return false;
  }

  return /\b(create|generate|make|draw)\b.{0,60}\b(image|picture|visual|illustration|photo)\b/i.test(clean);
}

async function handleCreateImageFile({ title, content, fileName }) {
  const cleanContent = String(content || "").trim();

  if (!cleanContent) {
    setFileNotice("There is no content to create an image from.");
    return;
  }

  setFileNotice("");

  try {
    const response = await fetch("/api/files/create-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: title || "Virtus AI Image",
        content: cleanContent,
        fileName: fileName || title || "virtus-image",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setFileNotice(
        data.error === "Not authenticated"
          ? "Sign in required to create images."
          : data.error || "Image creation failed."
      );
      return;
    }

    await loadUploadedFiles();

    if (data.file?.id) {
      setConversation((prev) => {
        const next = [...prev];
        const lastIndex = next.length - 1;

        if (
          lastIndex >= 0 &&
          next[lastIndex]?.role === "assistant" &&
          !next[lastIndex]?.text?.trim()
        ) {
          next[lastIndex] = {
            role: "assistant",
            text: "",
            generatedImage: data.file,
          };

          return next;
        }

        return [
          ...next,
          {
            role: "assistant",
            text: "",
            generatedImage: data.file,
          },
        ];
      });
    }

    setShowDocumentLibrary(false);
    setShowFileMenu(false);
  } catch (error) {
    setFileNotice(error.message || "Image creation failed.");
  }
}
async function sendMessage() {
  if (!message.trim()) return;
  stopVirtusVoice();

  setEditingIndex(null);
  setEditingText("");

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
      {
        role: "user",
        text: message,
        attachedFiles: activeFiles.map((file) => ({
          id: file.id,
          file_name: file.file_name,
        })),
      },
      { role: "assistant", text: "" },
    ];
  });

const attachedFileText =
  activeFiles.length > 0
    ? `\n\nAttached documents:\n${activeFiles
        .map((file) => `${file.file_name}\nFile ID: ${file.id}`)
        .join("\n\n")}`
    : "";

const userMessage = `${message}${attachedFileText}`;
const shouldGenerateImageDirectly = isImageCreationRequest(message);

setMessage("");
setLastMessage(userMessage);
setActiveFile(null);
setActiveFiles([]);
setLoading(true);
  setShouldAutoScroll(true);
  abortControllerRef.current = new AbortController();
  setReply("");
  setStreamingReply("");

    try {
      if (shouldGenerateImageDirectly) {
        await handleCreateImageFile({
          title: getGeneratedDocumentTitle(message),
          content: message,
          fileName: getGeneratedDocumentTitle(message),
        });

        setLoading(false);
        setReply("");
        setStreamingReply("");
        setIsPracticeMode(null);
        return;
      }

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
  practiceMode: isPracticeMode,
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

            const newItemTitle = userMessage.includes("File ID:")
              ? "Executive File Studio"
              : userMessage.trim().slice(0, 60) || "New chat";

            const newItem = {
              id: resolvedSidebarChatId,
              title: newItemTitle,
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
setIsPracticeMode(null);
setActiveFile(null);
           } else if (data.error) {
        setReply(data.error);
        setConversation((prev) => {
          const next = [...prev];
          if (next.length > 0 && next[next.length - 1]?.role === "assistant") {
            next[next.length - 1] = {
              role: "assistant",
              text: data.error,
            };
          }
          return next;
        });
      } else {
        setReply("No reply received.");
        setConversation((prev) => {
          const next = [...prev];
          if (next.length > 0 && next[next.length - 1]?.role === "assistant") {
            next[next.length - 1] = {
              role: "assistant",
              text: "No reply received.",
            };
          }
          return next;
        });
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

  const errorMessage =
    error?.message || "Request failed. Please try again.";

  setReply(errorMessage);
  setStreamingReply("");
  setConversation((prev) => {
    const next = [...prev];

    if (next.length > 0 && next[next.length - 1]?.role === "assistant") {
      next[next.length - 1] = {
        role: "assistant",
        text: errorMessage,
      };
    }

    return next;
  });
  setEditingIndex(null);
}

    abortControllerRef.current = null;
setLoading(false);
  }

function getGeneratedDocumentTitle(text) {
  const rawLines = String(text || "").split("\n");

  const cleanedLines = rawLines
    .map((line) => {
      const original = line.trim();

      const clean = original
        .replace(/[#*_`]/g, "")
        .replace(/[ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÂ¢Ã¢â€šÂ¬Ã‚Â]/g, '"')
        .replace(/[ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢]/g, "'")
        .replace(/[ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â]/g, "-")
        .replace(/ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢/g, "TM")
        .trim();

      return {
        original,
        clean,
        lower: clean.toLowerCase(),
        wordCount: clean.split(/\s+/).filter(Boolean).length,
      };
    })
    .filter((line) => line.clean);

  const isGenericTitle = (line) => {
    const lower = line.lower;

    return (
      lower === "proposal" ||
      lower === "short proposal" ||
      lower === "clean proposal" ||
      lower === "professional proposal" ||
      lower === "leadership proposal" ||
      lower === "development proposal" ||
      lower === "training proposal"
    );
  };

  const isConversationalOpening = (line) => {
    return (
      line.lower.startsWith("yes") ||
      line.lower.startsWith("here is") ||
      line.lower.startsWith("certainly") ||
      line.lower.startsWith("of course") ||
      line.lower.includes("based on the document") ||
      line.lower.includes("based on the file") ||
      line.lower.includes("based on module")
    );
  };

  const realLines = cleanedLines.filter((line) => {
    return !isGenericTitle(line) && !isConversationalOpening(line);
  });

  const labeledTitle = realLines.find((line) => {
    return (
      line.wordCount <= 12 &&
      (line.lower.startsWith("proposal:") ||
        line.lower.startsWith("program:") ||
        line.lower.startsWith("title:"))
    );
  });

  if (labeledTitle?.clean) {
    return labeledTitle.clean
      .replace(/^proposal:\s*/i, "")
      .replace(/^program:\s*/i, "")
      .replace(/^title:\s*/i, "")
      .trim();
  }

  const markdownHeading = realLines.find((line) => {
    return (
      line.wordCount <= 12 &&
      (line.original.startsWith("# ") ||
        line.original.startsWith("## ") ||
        line.original.startsWith("### "))
    );
  });

  const specificProgramTitle = realLines.find((line) => {
    return (
      line.wordCount <= 12 &&
      (line.lower.includes("training") ||
        line.lower.includes("program") ||
        line.lower.includes("framework") ||
        line.lower.includes("response chain") ||
        line.lower.includes("decision architecture") ||
        line.lower.includes("awareness") ||
        line.lower.includes("stabilization"))
    );
  });

  const strongerTitle = realLines.find((line) => {
    return (
      line.wordCount <= 10 &&
      (line.lower.includes("report") ||
        line.lower.includes("plan") ||
        line.lower.includes("proposal"))
    );
  });

  return (
    labeledTitle?.clean ||
    markdownHeading?.clean ||
    specificProgramTitle?.clean ||
    strongerTitle?.clean ||
    realLines.find((line) => line.wordCount <= 10)?.clean ||
    "Virtus Document"
  );
}

const renderAssistantActions = (item, index) => {
  if (item.role !== "assistant" || !item.text?.trim() || loading) {
    return null;
  }

  const isLastAssistantAnswer =
    index === conversation.length - 1 &&
    index > 0 &&
    conversation[index - 1]?.role === "user";

  const iconClass =
    "flex h-7 w-7 items-center justify-center rounded-md text-sky-300/70 transition hover:bg-sky-950/30 hover:text-sky-200";

  return (
    <div className="relative flex items-center gap-3">
      <button
        type="button"
        title="Copy"
        onClick={() => {
          navigator.clipboard?.writeText(item.text || "");
          setCopiedIndex(index);

          setTimeout(() => {
            setCopiedIndex(null);
          }, 1200);
        }}
        className={iconClass}
        aria-label="Copy Virtus answer"
      >
        {copiedIndex === index ? (
          <span className="text-xs font-semibold text-sky-300">ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“</span>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-4 w-4"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )}
      </button>

      <button
        type="button"
        title="Good response"
        onClick={() => {
          setAssistantFeedback((prev) => ({
            ...prev,
            [index]: prev[index] === "like" ? null : "like",
          }));
        }}
        className={`${iconClass} ${
          assistantFeedback[index] === "like" ? "text-sky-200" : ""
        }`}
        aria-label="Like Virtus answer"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-4 w-4"
        >
          <path d="M7 10v11" />
          <path d="M15 6.5 14 10h5.5a2 2 0 0 1 1.95 2.45l-1.3 6A2 2 0 0 1 18.2 20H7" />
          <path d="M7 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3" />
          <path d="M15 6.5V4a2 2 0 0 0-2-2l-4 8" />
        </svg>
      </button>

      <button
        type="button"
        title="Poor response"
        onClick={() => {
          setAssistantFeedback((prev) => ({
            ...prev,
            [index]: prev[index] === "dislike" ? null : "dislike",
          }));
        }}
        className={`${iconClass} ${
          assistantFeedback[index] === "dislike" ? "text-sky-200" : ""
        }`}
        aria-label="Dislike Virtus answer"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-4 w-4"
        >
          <path d="M17 14V3" />
          <path d="M9 17.5 10 14H4.5a2 2 0 0 1-1.95-2.45l1.3-6A2 2 0 0 1 5.8 4H17" />
          <path d="M17 14h3a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-3" />
          <path d="M9 17.5V20a2 2 0 0 0 2 2l4-8" />
        </svg>
      </button>

      <button
        type="button"
        title="Add to project"
        onClick={() => {
          alert("Add to project will be connected soon.");
        }}
        className={iconClass}
        aria-label="Add Virtus answer to project"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-4 w-4"
        >
          <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
          <path d="M12 11v6" />
          <path d="M9 14h6" />
        </svg>
      </button>

       <button
        type="button"
        title="Create Word file"
        onClick={async () => {
          const documentTitle = getGeneratedDocumentTitle(item.text);

          await handleCreateDocxFile({
            title: documentTitle,
            content: item.text || "",
            fileName: documentTitle,
          });
        }}
        className={iconClass}
        aria-label="Create Word document from Virtus answer"
      >
        <span className="text-[10px] font-semibold tracking-wide">DOCX</span>
      </button>

      <button
        type="button"
        title="Create PDF file"
        onClick={async () => {
          const documentTitle = getGeneratedDocumentTitle(item.text);

          await handleCreatePdfFile({
            title: documentTitle,
            content: item.text || "",
            fileName: documentTitle,
          });
        }}
        className={iconClass}
        aria-label="Create PDF document from Virtus answer"
      >
        <span className="text-[10px] font-semibold tracking-wide">PDF</span>
      </button>

      <button
        type="button"
        title="Create PowerPoint file"
        onClick={async () => {
          const documentTitle = getGeneratedDocumentTitle(item.text);

          await handleCreatePptxFile({
            title: documentTitle,
            content: item.text || "",
            fileName: documentTitle,
          });
        }}
        className={iconClass}
        aria-label="Create PowerPoint presentation from Virtus answer"
      >
        <span className="text-[10px] font-semibold tracking-wide">PPTX</span>
      </button>

      <button
        type="button"
        title="Create image file"
        onClick={async () => {
          const documentTitle = getGeneratedDocumentTitle(item.text);

          const userImageRequest = conversation[index - 1]?.role === "user"
            ? conversation[index - 1]?.text || ""
            : item.text || "";

          await handleCreateImageFile({
            title: documentTitle,
            content: userImageRequest,
            fileName: documentTitle,
          });
        }}
        className={iconClass}
        aria-label="Create image from Virtus answer"
      >
        <span className="text-[10px] font-semibold tracking-wide">IMAGE</span>
      </button>

      {isLastAssistantAnswer && (
        <button
          type="button"
          title="Regenerate"
          onClick={() => {
            const lastUserMessage = conversation[index - 1]?.text || "";

            if (!lastUserMessage) return;

            stopVirtusVoice();
            setOpenMessageMenuIndex(null);
            setConversation((prev) => prev.slice(0, index - 1));
            setMessage(lastUserMessage);
            setRegenerating(true);
          }}
          className={iconClass}
          aria-label="Regenerate Virtus answer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-4 w-4"
          >
            <path d="M21 12a9 9 0 1 1-2.64-6.36" />
            <path d="M21 3v6h-6" />
          </svg>
        </button>
      )}

      <button
        type="button"
        title="More"
        onClick={() => {
          setOpenMessageMenuIndex(
            openMessageMenuIndex === index ? null : index
          );
        }}
        className={iconClass}
        aria-label="Open assistant menu"
      >
        <span className="text-lg leading-none">Ãƒâ€šÃ‚Â·Ãƒâ€šÃ‚Â·Ãƒâ€šÃ‚Â·</span>
      </button>

      {openMessageMenuIndex === index && (
        <div className="absolute right-0 top-8 z-30 w-52 rounded-2xl border border-sky-900/25 bg-zinc-950/95 p-2 text-sm text-sky-100 shadow-xl shadow-black/40 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => {
              setOpenMessageMenuIndex(null);
              speakVirtusReply(item.text || "");
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-sky-950/35"
          >
            <span>ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂÃ…Â </span>
            <span>{speaking ? "Restart read aloud" : "Read aloud"}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setVoiceStyle("male");
              setSelectedVoiceURI("");
              setOpenMessageMenuIndex(null);
              speakVirtusReply(item.text || "", "male");
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-sky-950/35"
          >
            <span>ÃƒÂ°Ã…Â¸Ã¢â‚¬â€Ã‚Â£ÃƒÂ¯Ã‚Â¸Ã‚Â</span>
            <span>Male voice</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setVoiceStyle("female");
              setSelectedVoiceURI("");
              setOpenMessageMenuIndex(null);
              speakVirtusReply(item.text || "", "female");
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-sky-950/35"
          >
            <span>ÃƒÂ°Ã…Â¸Ã…Â½Ã¢â€žÂ¢ÃƒÂ¯Ã‚Â¸Ã‚Â</span>
            <span>Female voice</span>
          </button>

          {speaking && (
            <>
              <div className="my-2 h-px bg-sky-900/20" />

              <button
                type="button"
                onClick={() => {
                  stopVirtusVoice();
                  setOpenMessageMenuIndex(null);
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-red-200 transition hover:bg-red-950/35"
              >
                <span>ÃƒÂ¢Ã¢â‚¬â€œÃ‚Â </span>
                <span>Stop reading</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

return (
<>
  {showSplash && (
    <SplashScreen onFinish={() => setShowSplash(false)} />
  )}

<main
  className="h-[100dvh] md:h-screen overflow-hidden bg-black text-white"
  onClick={() => {
    if (!showPlanOverlay) return;
    setShowPlanOverlay(false);
    localStorage.setItem(planOverlayStorageKey, "true");
  }}
  onTouchStart={(e) => {
    const x = e.touches[0].clientX;
    if (x < 20) {
      edgeSwipeStartRef.current = x;
    }
  }}
  onTouchEnd={(e) => {
    const startX = edgeSwipeStartRef.current;
    const endX = e.changedTouches[0].clientX;

    if (startX !== null && endX - startX > 60) {
      setShowMobileMenu(true);
    }

    edgeSwipeStartRef.current = null;
  }}
>

{imagePreviewFile && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 px-4 py-6 backdrop-blur-sm">
    <div className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-2xl border border-sky-900/40 bg-zinc-950/95 p-4 shadow-2xl shadow-sky-950/30">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-sky-100">Virtus image preview</p>
          <p className="max-w-md truncate text-xs text-zinc-500">{imagePreviewFile.file_name}</p>
        </div>
        <button
          type="button"
          onClick={() => setImagePreviewFile(null)}
          className="rounded-full border border-sky-900/40 px-3 py-1 text-xs text-sky-200 transition hover:bg-sky-950/60 hover:text-sky-50"
        >
          Close
        </button>
      </div>

      <div className="flex h-[70vh] items-center justify-center overflow-hidden rounded-xl border border-sky-900/25 bg-black">
        <img
          src={`/api/files/download?fileId=${encodeURIComponent(imagePreviewFile.id)}&preview=1`}
          alt={imagePreviewFile.file_name}
          className="h-full w-full object-contain"
        />
      </div>
    </div>
  </div>
)}

 <div className="flex h-full">
        <aside className="hidden md:flex md:w-72 bg-zinc-950 border-r border-zinc-800 h-full flex-col">
          <div className="px-4 pt-4 pb-3 border-b border-zinc-800 flex justify-center">
  <img
    src="/virtus-logo.png"
    alt="Virtus AI logo"
    className="block w-[190px] h-auto object-contain"
  />
</div>

                    <div className="flex-1 p-3 overflow-y-auto no-scrollbar">
            <button
onClick={() => {
  if (loading) {
    abortControllerRef.current?.abort();
  }

  stopVirtusVoice();
  abortControllerRef.current = null;

  const newChatId = getGuestSidebarChatId(
    guestAccess?.plan,
    crypto.randomUUID()
  );

  localStorage.setItem("virtus_chat_id", newChatId);
  setActiveChatId(newChatId);
  setConversation([]);
  setMessage("");
  setReply("");
  setStreamingReply("");
  setLoading(false);
  setRegenerating(false);
  setEditingIndex(null);
  setEditingText("");
  setIsPracticeMode(null);
  setShouldAutoScroll(true);

  if (!isAuthenticated) {
    // Do not save empty guest chats in Recent.
    // A chat should appear in Recent only after the user sends a message.
  }
}}
className="w-full rounded-2xl border border-sky-900/25 bg-zinc-950/35 px-4 py-3 text-left text-sm text-sky-100 shadow-sm shadow-sky-950/10 backdrop-blur-sm transition hover:border-sky-800/40 hover:bg-zinc-950/55"
            >
              + New chat
            </button>

            <button
              type="button"
              onClick={() => setPracticeOpen(!practiceOpen)}
              className="mt-3 w-full rounded-2xl border border-sky-900/25 bg-sky-950/20 px-4 py-3 text-left text-sm text-sky-100 shadow-sm shadow-sky-950/10 backdrop-blur-sm transition hover:border-sky-800/40 hover:bg-sky-950/35"
            >
              Practice
            </button>

            {practiceOpen && (
              <div className="mt-3 max-h-[420px] space-y-2 overflow-y-auto rounded-2xl border border-sky-900/20 bg-zinc-950/40 p-2 no-scrollbar">
                <p className="px-3 pt-2 text-[11px] font-medium uppercase tracking-[0.18em] text-sky-300/50">
                  Practice Categories
                </p>

                {virtusPracticeCategories.map((category) => {
                  const canUseCategory = canUsePracticeCategory(category);
                  const requiredPlan = category.minimumPlan || "free";
                  const accessLabel = getPracticeCategoryAccessLabel(
                    category,
                    canUseCategory
                  );
                  const categoryPrompt = getPracticeCategoryPrompt(category);

                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => {
                        if (!canUseCategory) {
                          setMessage(
                            `This practice category requires ${requiredPlan}. Please upgrade to unlock it.`
                          );
                          setPracticeOpen(false);
                          setIsPracticeMode(null);
                          return;
                        }

                        setMessage(categoryPrompt);
                        setPracticeOpen(false);
                        setIsPracticeMode(category.practiceMode);
                      }}
                      className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                        canUseCategory
                          ? "border-sky-900/10 bg-black/10 text-sky-100 hover:border-sky-800/30 hover:bg-sky-950/35"
                          : "border-zinc-800/70 bg-zinc-950/35 text-zinc-500 opacity-70 hover:border-sky-900/20 hover:bg-zinc-950/55"
                      }`}
                    >
                      <span className="block font-medium">
                        {category.title}
                      </span>

                      <span className="mt-0.5 block text-xs leading-5 text-zinc-500">
                        {category.description}
                      </span>

                      {accessLabel && (
                        <span className="mt-1 inline-flex rounded-full border border-sky-900/25 bg-sky-950/20 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-sky-300/70">
                          {accessLabel}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mt-6">
<p className="px-2 text-[11px] font-medium uppercase tracking-[0.18em] text-sky-300/50 mb-2">
  Recent
</p>

  <div className="space-y-2">
  {recentConversations.filter((item) => {
    const title = item?.title?.trim().toLowerCase() || "";

    return (
      item?.id &&
      title &&
      title !== "new chat" &&
      title !== "file workspace" &&
      title !== "executive file studio" &&
      !title.startsWith("uploaded file:")
    );
  }).length === 0 ? (
    <div className="rounded-xl px-3 py-2 text-sm text-zinc-400 bg-zinc-900/60 border border-zinc-800">
      Recent conversations will appear here
    </div>
  ) : (
    recentConversations
      .filter((item) => {
        const title = item?.title?.trim().toLowerCase() || "";

        return (
          item?.id &&
          title &&
          title !== "new chat" &&
          title !== "file workspace" &&
          title !== "executive file studio" &&
          !title.startsWith("uploaded file:")
        );
      })
      .map((item) => (
  
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
  } else {
    setRecentConversations((prev) => {
      const clickedItem = prev.find((chat) => chat.id === resolvedChatId) || {
        id: resolvedChatId,
        title: item.title || "New chat",
      };

      return [
        clickedItem,
        ...prev.filter((chat) => chat.id !== resolvedChatId),
      ];
    });
  }
} else {
  setConversation([]);

  if (!isAuthenticated) {
    setRecentConversations(
      getGuestSidebarRecentConversations(resolvedPlan, resolvedChatId)
    );
  } else {
    setRecentConversations((prev) => {
      const clickedItem = prev.find((chat) => chat.id === resolvedChatId) || {
        id: resolvedChatId,
        title: item.title || "New chat",
      };

      return [
        clickedItem,
        ...prev.filter((chat) => chat.id !== resolvedChatId),
      ];
    });
  }
}
                        } catch (error) {
                          setConversation([]);
                        }

                        setLoading(false);
                      }}
className="w-full rounded-2xl px-3 py-2 text-left text-sm text-zinc-200 bg-zinc-950/30 border border-sky-900/15 transition hover:border-sky-800/35 hover:bg-zinc-950/55"
                    >
                      {item.title}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

                    <div className="border-t border-zinc-800 p-3 space-y-3">
  {isAuthenticated ? (
    <>
      <div className="flex items-center justify-between gap-2 rounded-2xl border border-sky-900/25 bg-zinc-950/35 px-3 py-2 text-white shadow-sm shadow-sky-950/10 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => router.push("/account")}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-xl px-1 py-1 text-left transition hover:bg-sky-950/30"
          aria-label="Open account"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-sky-900/40 bg-sky-950/30 text-xs font-semibold text-sky-200">
            {(currentUser?.nickname || currentUser?.email || "S").charAt(0).toUpperCase()}
          </span>

          <span className="min-w-0">
            <span className="block text-sm font-medium leading-4 text-sky-200">Account</span>
            <span className="block truncate text-xs leading-4 text-zinc-400">
              {currentUser?.nickname || currentUser?.email?.split("@")[0] || "You are signed in"}
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="shrink-0 rounded-xl border border-sky-900/40 bg-sky-950/20 px-3 py-2 text-xs text-sky-200 transition hover:bg-sky-900/35"
        >
          Log out
        </button>
      </div>

    </>
  ) : (
<Link
  href="/login"
  className="flex items-center gap-3 rounded-2xl border border-sky-900/25 bg-zinc-950/35 px-3 py-3 text-white shadow-sm shadow-sky-950/10 backdrop-blur-sm transition hover:border-sky-800/40 hover:bg-zinc-950/55"
>
  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-sky-900/40 bg-sky-950/30 text-sm font-semibold text-sky-200 shadow-sm shadow-sky-950/20">
    V
  </div>

  <div className="min-w-0">
    <p className="text-sm font-medium text-sky-200">Log in</p>
    <p className="text-xs text-sky-300/60">Access your account</p>
  </div>
</Link>
  )}
</div>
        </aside>

<section
  className="relative flex-1 min-w-0 flex justify-center bg-black"
  onWheel={(e) => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollTop += e.deltaY;
  }}
>
          <div className="w-full max-w-6xl h-full flex flex-col">
            {showPlanOverlay && (
  <div
    className="absolute inset-0 z-20 flex items-start md:items-center justify-center overflow-y-auto md:overflow-hidden bg-black/70 px-3 py-4 md:px-6 md:py-0 no-scrollbar"
    onClick={() => {
      setShowPlanOverlay(false);
      localStorage.setItem(planOverlayStorageKey, "true");
    }}
  >
    <div
      className="w-full max-w-5xl rounded-3xl border border-zinc-800 bg-zinc-950/95 p-4 md:p-6"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-6">
        <p className="text-xs uppercase tracking-wide text-zinc-500">
          Virtus AI Plans
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">
          Choose the level of Virtus you want to understand
        </h2>
<div className="sticky top-0 z-30 mt-3 flex items-center justify-between gap-3 rounded-2xl border border-sky-900/25 bg-zinc-950/95 p-3 backdrop-blur-sm">
  <p className="text-sm text-zinc-400">
    Review your access level, then continue.
  </p>

  <button
    type="button"
    onClick={() => {
      setShowPlanOverlay(false);
      localStorage.setItem(planOverlayStorageKey, "true");
    }}
    className="shrink-0 rounded-full border border-sky-900/40 bg-sky-950/40 px-5 py-2 text-sm font-medium text-sky-100 transition hover:bg-sky-900/50"
  >
    Continue
  </button>
</div>
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
<div className="relative z-[9999] px-3 py-3 md:px-8 md:py-4 border-b border-sky-900/20 bg-zinc-950/20 backdrop-blur-sm">
  <div className="flex items-center justify-between gap-4">
<div className="md:hidden">
  <button
    type="button"
    onClick={() => setShowMobileMenu(true)}
    className="flex items-center gap-2 rounded-2xl border border-sky-900/20 bg-zinc-950/30 px-2 py-1.5 text-sky-200 shadow-sm shadow-sky-950/10 transition hover:border-sky-800/40 hover:bg-zinc-950/50"
    aria-label="Open Virtus menu"
  >
    <img
      src="/virtus-logo.png"
      alt="Virtus AI"
      className="h-7 w-auto object-contain"
    />
  </button>
</div>

<div className="hidden md:flex items-center">
  <img
    src="/virtus-logo.png"
    alt="Virtus AI"
    className="h-9 w-auto object-contain"
  />
</div>

    {showMobileMenu && (
      <div
        className="fixed inset-0 z-[99999] bg-black md:hidden"
        onClick={() => setShowMobileMenu(false)}
      >
        <div
          className="h-full w-full bg-black p-5 text-sm text-sky-100"
          onClick={(e) => e.stopPropagation()}
          onTouchStart={(e) => {
            mobileMenuTouchStartXRef.current = e.touches[0].clientX;
          }}
          onTouchEnd={(e) => {
            const startX = mobileMenuTouchStartXRef.current;
            const endX = e.changedTouches[0].clientX;

            if (startX !== null && startX - endX > 60) {
              setShowMobileMenu(false);
            }

            mobileMenuTouchStartXRef.current = null;
          }}
        >
          <div className="mb-5 flex items-center justify-between border-b border-sky-900/20 pb-4">
            <img
              src="/virtus-logo.png"
              alt="Virtus AI"
              className="h-10 w-auto object-contain"
            />

            <button
              type="button"
              onClick={() => setShowMobileMenu(false)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-sky-900/30 bg-sky-950/20 text-sky-200"
              aria-label="Close menu"
            >
              ÃƒÆ’Ã¢â‚¬â€
            </button>
          </div>

          <div className="space-y-2 pt-3">
            <button
              type="button"
              onClick={() => {
                const newChatId = getGuestSidebarChatId(
                  guestAccess?.plan,
                  crypto.randomUUID()
                );

                localStorage.setItem("virtus_chat_id", newChatId);
                setActiveChatId(newChatId);
                setConversation([]);
                setShowMobileMenu(false);
              }}
              className="w-full rounded-2xl px-3 py-3 text-left hover:bg-sky-950/35"
            >
              + New chat
            </button>

            <button
              type="button"
              onClick={() => setPracticeOpen(!practiceOpen)}
              className="w-full rounded-2xl px-3 py-3 text-left text-sky-100 hover:bg-sky-950/35"
            >
              Practice
            </button>

            {practiceOpen && (
              <div className="max-h-[360px] space-y-2 overflow-y-auto rounded-2xl border border-sky-900/20 bg-zinc-950/40 p-2 no-scrollbar">
                <p className="px-3 pt-2 text-[11px] font-medium uppercase tracking-[0.18em] text-sky-300/50">
                  Practice Categories
                </p>

                {virtusPracticeCategories.map((category) => {
                  const canUseCategory = canUsePracticeCategory(category);
                  const requiredPlan = category.minimumPlan || "free";
                  const accessLabel = getPracticeCategoryAccessLabel(
                    category,
                    canUseCategory
                  );
                  const categoryPrompt = getPracticeCategoryPrompt(category);

                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => {
                        if (!canUseCategory) {
                          setMessage(
                            `This practice category requires ${requiredPlan}. Please upgrade to unlock it.`
                          );
                          setPracticeOpen(false);
                          setShowMobileMenu(false);
                          setIsPracticeMode(null);
                          return;
                        }

                        setMessage(categoryPrompt);
                        setPracticeOpen(false);
                        setShowMobileMenu(false);
                        setIsPracticeMode(category.practiceMode);
                      }}
                      className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                        canUseCategory
                          ? "border-sky-900/10 bg-black/10 text-sky-100 hover:border-sky-800/30 hover:bg-sky-950/35"
                          : "border-zinc-800/70 bg-zinc-950/35 text-zinc-500 opacity-70 hover:border-sky-900/20 hover:bg-zinc-950/55"
                      }`}
                    >
                      <span className="block font-medium">
                        {category.title}
                      </span>

                      <span className="mt-0.5 block text-xs leading-5 text-zinc-500">
                        {category.description}
                      </span>

                      {accessLabel && (
                        <span className="mt-1 inline-flex rounded-full border border-sky-900/25 bg-sky-950/20 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-sky-300/70">
                          {accessLabel}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            <Link href="/account" onClick={() => setShowMobileMenu(false)} className="block rounded-2xl px-3 py-3 hover:bg-sky-950/35">
              Profile
            </Link>

            <Link href="/account/personalization" onClick={() => setShowMobileMenu(false)} className="block rounded-2xl px-3 py-3 hover:bg-sky-950/35">
              Personalization
            </Link>

            <Link href="/account/personalization/memory" onClick={() => setShowMobileMenu(false)} className="block rounded-2xl px-3 py-3 hover:bg-sky-950/35">
              Memory
            </Link>

            <Link href="/upgrade" onClick={() => setShowMobileMenu(false)} className="block rounded-2xl px-3 py-3 hover:bg-sky-950/35">
              Plan
            </Link>

            <div className="my-3 h-px bg-sky-900/20" />

            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => {
                  setShowMobileMenu(false);
                  handleLogout();
                }}
                className="w-full rounded-2xl px-3 py-3 text-left text-red-200 hover:bg-red-950/35"
              >
                Log out
              </button>
            ) : (
              <Link href="/login" onClick={() => setShowMobileMenu(false)} className="block rounded-2xl px-3 py-3 hover:bg-sky-950/35">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    )}

    <div className="text-right">
      <Link
        href="/upgrade"
        className="inline-flex items-center rounded-full border border-sky-900/25 bg-sky-950/20 px-3 py-1 text-xs text-sky-200 transition hover:border-sky-800/40 hover:bg-sky-950/35"
      >
        Plan: {displayPlanLabel}
      </Link>

      {isTrialGuestExpired && (
        <p className="mt-2 text-xs text-sky-300/70">
          Trial complete. Create an account to keep your continuity.
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
          className="inline-block text-xs text-sky-300/70 mt-2 hover:text-sky-200 transition"
        >
          {isTrialGuestExpired
            ? "Create account to continue"
            : !isAuthenticated && currentAccess?.plan === "trial_guest"
            ? "Keep your progress"
            : displayUpgradeLabel}
        </Link>
      )}
    </div>
  </div>
</div>
<div
  ref={scrollContainerRef}
  className={`flex-1 overflow-y-auto px-3 py-4 md:px-6 md:py-6 min-h-0 no-scrollbar ${
    showMobileMenu ? "opacity-0 pointer-events-none" : "opacity-100"
  }`}
>

              {conversation.length > 0 || loading ? (
                <div className="space-y-4">
                  {conversation.map((item, index) => (
                    <div
                      key={index}
className={`relative max-w-[92%] md:max-w-[75%] rounded-2xl px-4 py-3 break-words ${
item.role === "user" && !loading
  ? "mb-12"
  : ""
} ${
item.role === "user"
  ? "ml-auto bg-sky-950/20 border border-sky-900/25 text-white shadow-sm shadow-sky-950/10 transition hover:border-sky-800/40 hover:bg-sky-950/30"
  : "mr-auto bg-zinc-950/35 border border-zinc-800/60 text-gray-300 shadow-sm shadow-sky-950/5 transition hover:border-sky-900/30 hover:bg-zinc-950/50"
}`}
                    >
                      <div className="mb-1 flex items-center justify-between gap-3">
  <p className={`text-xs ${item.role === "user" ? "text-zinc-400" : "text-sky-300"}`}>
  {item.role === "user" ? "You" : "Virtus"}
</p>

  <div className="flex items-center gap-3">
{item.role === "user" &&
  !loading &&
  editingIndex !== index && (
   <div className="absolute -bottom-8 right-3 flex items-center gap-1 rounded-lg border border-sky-900/25 bg-zinc-950/35 p-0.5 shadow-sm shadow-sky-950/10 backdrop-blur-sm">
      <button
        type="button"
onClick={() => {
  navigator.clipboard?.writeText(item.text || "");
  setCopiedIndex(index);

  setTimeout(() => {
    setCopiedIndex(null);
  }, 1200);
}}
       className="flex h-6 w-6 items-center justify-center rounded-md text-sky-300/60 hover:bg-sky-950/30 hover:text-sky-200"
        aria-label="Copy message"
      >
   {copiedIndex === index ? (
  <span className="text-xs font-semibold">ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“</span>
) : (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className="h-3.5 w-3.5"
  >
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
)}
      </button>

      <button
        type="button"
onClick={() => {
  setShowDocumentLibrary(false);
  setShowFileMenu(false);
  setTimeout(() => {
    textareaRef.current?.focus();
  }, 50);
}}
        className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-950/20 text-sky-300/70 hover:bg-sky-900/35 hover:text-sky-100"
        aria-label="Edit message"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
         className="h-3.5 w-3.5"
        >
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
      </button>
    </div>
  )}

{renderAssistantActions(item, index)}

  </div>
</div>

                     {item.role === "assistant" ? (
  item.generatedImage?.id ? (
    <div className="overflow-hidden rounded-2xl border border-sky-900/35 bg-zinc-950/70 shadow-[0_0_30px_rgba(14,165,233,0.08)]">
      <div className="flex items-center justify-between gap-3 border-b border-sky-900/25 bg-zinc-950/80 px-3 py-2 sm:px-4">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-sky-300/80">
            Generated image
          </p>
          <p className="truncate text-xs text-zinc-400">
            {item.generatedImage.file_name || "Virtus image"}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setImagePreviewFile(item.generatedImage)}
            className="rounded-full border border-sky-700/45 bg-sky-950/30 px-3 py-1.5 text-[11px] font-medium text-sky-100 transition hover:border-sky-500/70 hover:bg-sky-900/45"
          >
            Open large
          </button>
          <button
            type="button"
            onClick={() => {
              window.location.href = `/api/files/download?fileId=${encodeURIComponent(
                item.generatedImage.id
              )}`;
            }}
            className="rounded-full border border-zinc-700/70 bg-zinc-900/50 px-3 py-1.5 text-[11px] font-medium text-zinc-300 transition hover:border-sky-700/60 hover:bg-sky-950/35 hover:text-sky-100"
          >
            Download
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setImagePreviewFile(item.generatedImage)}
        className="block w-full bg-black/30 p-2 transition hover:bg-sky-950/10"
        aria-label="Open generated image preview"
      >
        <img
          src={`/api/files/download?fileId=${encodeURIComponent(item.generatedImage.id)}&preview=1`}
          alt={item.generatedImage.file_name || "Virtus generated image"}
          className="mx-auto max-h-[440px] w-full rounded-xl object-contain"
        />
      </button>
    </div>
  ) : item.text?.trim() ? (
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
    <div className="flex items-center gap-2 text-gray-400">
      <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-sky-300" />
      <span className="animate-pulse">
        Virtus is forming the response...
      </span>
    </div>
  )
) : editingIndex === index ? (
  <div className="space-y-3">
    <textarea
      value={editingText}
      onChange={(e) => setEditingText(e.target.value)}
      className="w-full min-h-[90px] resize-y rounded-2xl border border-sky-900/25 bg-zinc-950/45 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-zinc-600 transition focus:border-sky-800/50 focus:bg-zinc-950/65 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      autoFocus
    />

    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={() => {
          setEditingIndex(null);
          setEditingText("");
        }}
        className="rounded-xl border border-sky-900/25 bg-zinc-950/35 px-3 py-1.5 text-xs text-sky-300/70 transition hover:bg-zinc-950/55"
      >
        Cancel
      </button>

      <button
        type="button"
        onClick={() => {
          const nextText = editingText.trim();

          if (!nextText) return;

         setConversation((prev) => prev.slice(0, index));

setMessage(nextText);
setEditingIndex(null);
setEditingText("");
setRegenerating(true);
        }}
        className="rounded-xl border border-sky-900/30 bg-sky-950/25 px-3 py-1.5 text-xs text-sky-100 transition hover:bg-sky-900/35"
      >
        Send
      </button>
    </div>
  </div>
) : (
  <div className="space-y-2">
    {item.attachedFiles?.length > 0 && (
      <div className="flex flex-wrap gap-2">
        {item.attachedFiles.map((file) => (
          <div
            key={file.id}
            className="inline-flex max-w-full items-center gap-2 rounded-full border border-sky-800/35 bg-sky-950/30 px-3 py-1.5 text-xs text-sky-100"
          >
            <span className="shrink-0 text-sky-300">ÃƒÂ°Ã…Â¸Ã¢â‚¬Å“Ã…Â½</span>
            <span className="max-w-[220px] truncate">
              {file.file_name}
            </span>
          </div>
        ))}
      </div>
    )}

    <p className="whitespace-pre-wrap leading-7">
      {String(item.text || "").replace(/\n?File ID:\s*[0-9a-fA-F-]{36}/g, "")}
    </p>
  </div>
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
<div className="h-full flex items-center justify-center px-6">
  <div className="rounded-3xl border border-sky-900/20 bg-zinc-950/25 px-8 py-6 text-center shadow-sm shadow-sky-950/10 backdrop-blur-sm">
    <p className="text-sm font-medium text-sky-200">Ask Virtus anything.</p>
    <p className="mt-2 text-xs text-zinc-500">
      Think clearly. Act deliberately. Build with discipline.
    </p>
  </div>
</div>
              )}
            </div>

<div
  className={`px-3 py-3 md:px-8 md:py-5 border-t border-zinc-900 ${
    showMobileMenu ? "opacity-0 pointer-events-none" : "opacity-100"
  }`}
>
  <div className="relative rounded-[30px] border border-sky-900/25 bg-zinc-950/35 shadow-sm shadow-sky-950/10 backdrop-blur-sm transition hover:border-sky-800/40 hover:bg-zinc-950/50">

<div className="absolute left-3 top-1/2 -translate-y-1/2">
  <button
    type="button"
    onClick={() => {
      setShowFileMenu((value) => !value);
      loadUploadedFiles();
    }}
    disabled={uploadingFile || loading}
    className="flex h-10 w-10 items-center justify-center rounded-full border border-sky-900/40 bg-sky-950/30 text-sky-200 transition hover:bg-sky-900/40 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {uploadingFile ? "ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦" : "+"}
  </button>

  <input
    id="virtus-file-upload"
    type="file"
    accept=".pdf,.doc,.docx,.ppt,.pptx"
    className="hidden"
    onChange={handleFileUpload}
    disabled={uploadingFile || loading}
  />
</div>
{showFileMenu && (
  <div
    onMouseLeave={() => {
      setShowFileMenu(false);
      setShowDocumentLibrary(false);
    }}
    onWheel={(event) => {
      event.stopPropagation();
    }}
    className="absolute bottom-14 left-0 z-40 max-h-[62vh] w-72 overflow-y-auto overscroll-contain rounded-2xl border border-sky-900/30 bg-zinc-950/95 p-3 text-sm text-sky-100 shadow-xl shadow-black/50 backdrop-blur-sm no-scrollbar"
  >
    <div className="mb-3 rounded-2xl border border-sky-900/20 bg-sky-950/15 px-3 py-2">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-sky-300/60">
        Executive File Studio
      </p>

      <p className="mt-1 text-xs leading-5 text-zinc-400">
        Upload, select, and use documents inside Virtus.
      </p>


    </div>

    <button
      type="button"
      onClick={() => document.getElementById("virtus-file-upload")?.click()}
      className="flex w-full items-center gap-3 rounded-xl border border-sky-900/20 bg-zinc-950/45 px-3 py-2 text-left transition hover:bg-sky-950/35"
    >
      <span>ÃƒÂ°Ã…Â¸Ã¢â‚¬Å“Ã…Â½</span>
      <span>Upload file</span>
    </button>

    <div className="my-3 h-px bg-sky-900/20" />

    <button
      type="button"
      onClick={() => {
        if (showDocumentLibrary) {
          setShowDocumentLibrary(false);
          setShowFileMenu(false);
        } else {
          setShowDocumentLibrary(true);
        }
      }}
      className="mb-2 flex w-full items-center justify-between rounded-xl border border-sky-900/20 bg-zinc-950/45 px-3 py-2 text-left transition hover:bg-sky-950/30"
    >
      <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-sky-300/60">
        Document Library
      </span>
      <span className="text-xs text-sky-300/70">
        {showDocumentLibrary ? "Close" : "Open"}
      </span>
    </button>

    {showDocumentLibrary && (() => {
      const cleanUploadedFiles = Array.from(
        new Map(
          (uploadedFiles || [])
            .filter((file) => file?.id && file?.file_name)
            .map((file) => [file.file_name.toLowerCase(), file])
        ).values()
      ).slice(0, 6);

      return cleanUploadedFiles.length === 0 ? (
        <p className="rounded-xl border border-zinc-800 bg-zinc-950/45 px-3 py-2 text-xs text-zinc-500">
          No uploaded files yet
        </p>
      ) : (
        cleanUploadedFiles.map((file) => {
          const isImageFile = String(file.file_type || "").startsWith("image/");
          const previewUrl = `/api/files/download?fileId=${encodeURIComponent(file.id)}&preview=1`;

          return (
          <div
            key={file.id}
            className={`w-full rounded-xl border px-3 py-2 transition ${
              activeFile?.id === file.id
                ? "border-sky-500/50 bg-sky-950/45"
                : "border-transparent hover:border-sky-900/25 hover:bg-sky-950/35"
            }`}
          >
            <button
              type="button"
              onClick={() => {
                setActiveFile(file);
                setActiveFiles((currentFiles) => {
                  const alreadyAttached = currentFiles.some(
                    (item) => item.id === file.id
                  );

                  if (alreadyAttached) {
                    return currentFiles;
                  }

                  return [...currentFiles, file];
                });
              }}
              className="w-full text-left"
            >
              <span className="block truncate text-sky-100">
                {file.file_name}
              </span>
              <span className="block text-[11px] text-zinc-500">
                Click to open this document for Virtus
              </span>
            </button>

            {isImageFile && (
              <div className="mt-2 overflow-hidden rounded-lg border border-sky-900/30 bg-black/40">
                <button
                  type="button"
                  onClick={() => setImagePreviewFile(file)}
                  className="block w-full"
                >
                  <img
                    src={previewUrl}
                    alt={file.file_name}
                    className="h-28 w-full object-cover"
                  />
                </button>
              </div>
            )}

            {activeFile?.id === file.id && (
              <div className="mt-3 rounded-xl border border-sky-900/25 bg-zinc-950/45 px-3 py-2">
                <p className="text-[11px] text-sky-200">
                  File attached to the message box.
                </p>

                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMessage("Review this document.");
                      setShowFileMenu(false);
                      textareaRef.current?.focus();
                    }}
                    className="rounded-lg border border-sky-700/40 bg-sky-950/35 px-3 py-1.5 text-xs text-sky-100 transition hover:bg-sky-900/45"
                  >
                    Open file
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = `/api/files/download?fileId=${encodeURIComponent(
                        file.id
                      )}`;
                    }}
                    className="rounded-lg border border-sky-900/30 px-3 py-1.5 text-xs text-sky-300 transition hover:bg-sky-950/45 hover:text-sky-100"
                  >
                    Download
                  </button>

                  {confirmDeleteFileId === file.id ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDeleteFile(file)}
                        className="rounded-lg border border-red-700/40 bg-red-950/30 px-3 py-1.5 text-xs text-red-100 transition hover:bg-red-900/40"
                      >
                        Confirm
                      </button>

                      <button
                        type="button"
                        onClick={() => setConfirmDeleteFileId(null)}
                        className="rounded-lg border border-sky-900/30 px-3 py-1.5 text-xs text-sky-300 transition hover:bg-sky-950/45 hover:text-sky-100"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteFileId(file.id)}
                      className="rounded-lg border border-red-900/30 px-3 py-1.5 text-xs text-red-300 transition hover:bg-red-950/30 hover:text-red-100"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
          );
        })
      );
    })()}
</div>
)}

{fileNotice && (
  <div className="ml-16 mt-3 max-w-[70%] rounded-2xl border border-sky-900/30 bg-zinc-950/70 px-4 py-3 text-sm text-sky-100 shadow-lg shadow-black/20">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="font-medium text-sky-200">File access notice</p>
        <p className="mt-1 text-xs leading-5 text-zinc-300">
          {fileNotice}
        </p>
      </div>

      <button
        type="button"
        onClick={() => setFileNotice("")}
        className="rounded-full border border-sky-900/30 px-2 py-0.5 text-xs text-sky-300 transition hover:bg-sky-950/45 hover:text-sky-100"
      >
        ÃƒÆ’Ã¢â‚¬â€
      </button>
    </div>
  </div>
)}

{activeFiles.length > 0 && (
  <div className="ml-16 mt-3 flex max-w-[70%] flex-wrap items-center gap-2 max-md:ml-2 max-md:max-w-[96%]">
    {activeFiles.map((file) => {
      const isImageFile = String(file.file_type || "").startsWith("image/");
      const previewUrl = `/api/files/download?fileId=${encodeURIComponent(file.id)}&preview=1`;

      return (
        <div
          key={file.id}
          className={`inline-flex max-w-[280px] items-center gap-2 rounded-2xl border px-2 py-1.5 text-xs text-sky-100 shadow-[0_0_18px_rgba(14,165,233,0.06)] md:max-w-[380px] ${
            isImageFile
              ? "border-sky-700/40 bg-zinc-950/75"
              : "border-sky-800/35 bg-sky-950/30"
          }`}
        >
          {isImageFile ? (
            <button
              type="button"
              onClick={() => setImagePreviewFile(file)}
              className="h-9 w-12 shrink-0 overflow-hidden rounded-xl border border-sky-900/35 bg-black/50"
              title="Preview image"
            >
              <img
                src={previewUrl}
                alt={file.file_name || "Attached image"}
                className="h-full w-full object-cover"
              />
            </button>
          ) : (
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-sky-800/40 bg-sky-950/45 text-[10px] font-semibold text-sky-300">
              FILE
            </span>
          )}

          <span className="min-w-0 truncate">
            {file.file_name}
          </span>

          <button
            type="button"
            onClick={() => {
              setActiveFiles((currentFiles) =>
                currentFiles.filter((item) => item.id !== file.id)
              );

              if (activeFile?.id === file.id) {
                setActiveFile(null);
              }
            }}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-sky-900/30 text-sky-300 transition hover:bg-sky-950/45 hover:text-sky-100"
            title="Remove attached file"
          >
            x
          </button>
        </div>
      );
    })}

    {activeFiles.length > 1 && (
      <button
        type="button"
        onClick={() => {
          setActiveFiles([]);
          setActiveFile(null);
        }}
        className="rounded-full border border-sky-900/30 bg-zinc-950/45 px-3 py-1.5 text-xs text-sky-300 transition hover:bg-sky-950/45 hover:text-sky-100"
      >
        Clear all
      </button>
    )}
  </div>
)}
<textarea
  ref={textareaRef}
className="w-full min-h-[64px] max-h-72 resize-none overflow-y-auto no-scrollbar rounded-[30px] bg-transparent px-14 py-4 pr-28 md:px-16 md:py-5 md:pr-36 text-gray-100 placeholder:text-zinc-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
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
    setEditingIndex(null);
  }
}}
/>

<div className="absolute bottom-3 right-3 flex items-center gap-3">

                 <button
  type="button"
  onClick={handleMicrophoneClick}
  className={`flex h-10 w-10 items-center justify-center rounded-full transition ${
    listening
      ? "bg-sky-950/60 text-sky-200"
      : "text-white/80 hover:bg-sky-950/30 hover:text-sky-200"
  }`}
  aria-label={listening ? "Stop voice input" : "Start voice input"}
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
  className={`flex h-12 w-12 items-center justify-center border border-sky-900/40 bg-sky-950/30 text-sky-200 transition hover:bg-sky-900/40 disabled:cursor-not-allowed disabled:opacity-50 ${
    loading ? "rounded-xl" : "rounded-full"
  }`}
  aria-label={loading ? "Stop" : "Send"}
>
  {loading ? (
    <div className="h-4 w-4 rounded-sm bg-sky-200" />
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
  </>
  );
}














