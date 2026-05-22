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
const [confirmDialog, setConfirmDialog] = useState(null);
const [fileNotice, setFileNotice] = useState("");
const [creatingFileType, setCreatingFileType] = useState("");
const creatingFileLockRef = useRef("");
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
const [captureListening, setCaptureListening] = useState(false);
const [captureTranscribing, setCaptureTranscribing] = useState(false);
const [captureRecordingSeconds, setCaptureRecordingSeconds] = useState(0);
const [captureVoiceLanguage, setCaptureVoiceLanguage] = useState("en-US");
const recognitionRef = useRef(null);
const captureRecognitionRef = useRef(null);
const captureVoiceShouldContinueRef = useRef(false);
const captureVoiceBaseRef = useRef("");
const captureVoiceCommittedRef = useRef("");
const captureVoiceRestartTimerRef = useRef(null);
const captureMediaRecorderRef = useRef(null);
const captureMediaStreamRef = useRef(null);
const captureAudioChunksRef = useRef([]);
const captureAudioBlobRef = useRef(null);
const captureRecordingTimerRef = useRef(null);
const speechBaseMessageRef = useRef("");
const speechFinalTranscriptRef = useRef("");
const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(false);
const [speaking, setSpeaking] = useState(false);
const [availableVoices, setAvailableVoices] = useState([]);
const [selectedVoiceURI, setSelectedVoiceURI] = useState("");
const [openMessageMenuIndex, setOpenMessageMenuIndex] = useState(null);
const [showMobileMenu, setShowMobileMenu] = useState(false);
const [practiceOpen, setPracticeOpen] = useState(false);
const [searchOpen, setSearchOpen] = useState(false);
const [captureOpen, setCaptureOpen] = useState(false);
const [captureNotes, setCaptureNotes] = useState([]);
const [loadingCaptureNotes, setLoadingCaptureNotes] = useState(false);
const [savingCaptureNote, setSavingCaptureNote] = useState(false);
const [captureTitle, setCaptureTitle] = useState("");
const [captureType, setCaptureType] = useState("General Note");
const [captureContent, setCaptureContent] = useState("");
const [activeCaptureNote, setActiveCaptureNote] = useState(null);
const [captureNotice, setCaptureNotice] = useState("");
const [captureMobilePicker, setCaptureMobilePicker] = useState(null);
const [projectsOpen, setProjectsOpen] = useState(false);
const [projectSpaces, setProjectSpaces] = useState([]);
const [projectChats, setProjectChats] = useState({});
const [projectStorageReady, setProjectStorageReady] = useState(false);
const [activeProject, setActiveProject] = useState(null);
const [projectHomeOpen, setProjectHomeOpen] = useState(false);
const [newProjectTitle, setNewProjectTitle] = useState("");
const [showProjectInput, setShowProjectInput] = useState(false);
const [chatSearchQuery, setChatSearchQuery] = useState("");
const [isPracticeMode, setIsPracticeMode] = useState(null);
const [showGuidedPractice, setShowGuidedPractice] = useState(false);
const [guidedPracticeStep, setGuidedPracticeStep] = useState(0);
const [guidedPracticeAnswers, setGuidedPracticeAnswers] = useState({});
const [guidedPracticeHistory, setGuidedPracticeHistory] = useState([]);
const [loadingGuidedPracticeHistory, setLoadingGuidedPracticeHistory] = useState(false);

const captureNoteTypes = [
  "General Note",
  "Meeting Note",
  "Client Note",
  "Project Note",
  "Business Idea",
  "Personal Reflection",
  "Spiritual Reflection",
  "Task / Action",
  "Coaching Insight",
  "Voice Transcript",
];

const guidedPracticeAreaQuestion = {
  id: "area",
  label: "What area is this about?",
  type: "choice",
  options: ["Mind", "Emotion", "Relationship", "Work", "Leadership", "Family", "Spiritual", "Business"],
};

const guidedPracticeDefaultQuestions = [
  {
    id: "whatHappened",
    label: "What happened?",
    type: "text",
    placeholder: "Write a short description of what happened...",
  },
  {
    id: "biggestChallenge",
    label: "What is the biggest challenge right now?",
    type: "choice",
    options: ["Overthinking", "Fear", "Anger", "Lack of discipline", "Confusion", "Conflict", "Procrastination", "Burnout"],
  },
  {
    id: "strongestThought",
    label: "What thought is strongest in your mind?",
    type: "text",
    placeholder: "Write the strongest thought you are noticing...",
  },
  {
    id: "strongestEmotion",
    label: "What emotion is strongest?",
    type: "choice",
    options: ["Anxiety", "Pressure", "Sadness", "Frustration", "Shame", "Anger", "Fear", "Numbness"],
  },
  {
    id: "intensity",
    label: "How intense is it from 1 to 10?",
    type: "choice",
    options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
  },
  {
    id: "reactionToAvoid",
    label: "What reaction do you want to avoid?",
    type: "choice",
    options: ["Arguing", "Avoiding", "Shutting down", "Overreacting", "Procrastinating", "Giving up", "Negative thinking"],
  },
  {
    id: "desiredBehavior",
    label: "What behavior do you want instead?",
    type: "choice",
    options: ["Calm response", "Focus", "Courage", "Discipline", "Better communication", "Leadership", "Action"],
  },
  {
    id: "desiredResult",
    label: "What result do you want to create?",
    type: "choice_with_optional_text",
    options: ["Calm", "Clarity", "Courage", "Discipline", "Better communication", "Decision", "Emotional control", "Spiritual alignment"],
    placeholder: "Optional: add more detail about the result you want...",
  },
  {
    id: "practiceDepth",
    label: "How deep do you want the practice?",
    type: "choice",
    options: ["Quick reset - 3 minutes", "Standard practice - 5 to 10 minutes", "Deep reflection - 10 to 15 minutes", "Strategic coaching - advanced"],
  },
];

const guidedPracticeQuestionSets = {
  Relationship: [
    {
      id: "whatHappened",
      label: "What happened between you and the other person?",
      type: "text",
      placeholder: "Describe the relational moment, conflict, distance, rejection, misunderstanding, or emotional change...",
    },
    {
      id: "biggestChallenge",
      label: "What is the biggest relationship challenge right now?",
      type: "choice",
      options: ["Feeling rejected", "Feeling misunderstood", "Emotional distance", "Trust issue", "Conflict", "Confusion", "Fear of losing connection", "Difficulty communicating"],
    },
    {
      id: "strongestThought",
      label: "What relationship meaning did your mind attach to this?",
      type: "text",
      placeholder: "Example: I am not wanted, something is wrong, I am not important, we are disconnected...",
    },
    {
      id: "strongestEmotion",
      label: "What relational emotion is strongest?",
      type: "choice",
      options: ["Hurt", "Sadness", "Rejection", "Fear", "Anger", "Confusion", "Loneliness", "Numbness"],
    },
    {
      id: "intensity",
      label: "How intense did this feel in the relationship from 1 to 10?",
      type: "choice",
      options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
    },
    {
      id: "reactionToAvoid",
      label: "What relationship reaction do you want to avoid?",
      type: "choice",
      options: ["Shutting down", "Becoming cold", "Arguing", "Blaming", "Chasing reassurance", "Withdrawing affection", "Giving up", "Silent resentment"],
    },
    {
      id: "desiredBehavior",
      label: "What mature relationship behavior do you want instead?",
      type: "choice",
      options: ["Calm presence", "Honest communication", "Emotional self-control", "Patience", "Repair conversation", "Clear boundary", "Compassion", "Listening first"],
    },
    {
      id: "desiredResult",
      label: "What relationship result do you want to create?",
      type: "choice_with_optional_text",
      options: ["Clarity", "Repair", "Emotional safety", "Better communication", "Understanding", "Reconnection", "Respect", "Peace"],
      placeholder: "Optional: explain what repair, clarity, or reconnection would look like...",
    },
    {
      id: "practiceDepth",
      label: "How deep do you want this relationship practice?",
      type: "choice",
      options: ["Quick reset - 3 minutes", "Standard practice - 5 to 10 minutes", "Deep relationship reflection - 10 to 15 minutes", "Strategic relationship coaching - advanced"],
    },
  ],
};

const selectedGuidedPracticeArea =
  getGuidedPracticeAnswerText(guidedPracticeAnswers.area) || "";

const guidedPracticeQuestions = [
  guidedPracticeAreaQuestion,
  ...(guidedPracticeQuestionSets[selectedGuidedPracticeArea] ||
    guidedPracticeDefaultQuestions),
];
const mobileMenuTouchStartXRef = useRef(null);
const edgeSwipeStartRef = useRef(null);
const [voiceStyle, setVoiceStyle] = useState("default");
const speechRef = useRef(null);

useEffect(() => {
  function syncVirtusAppearance() {
    const savedAppearance = localStorage.getItem("virtus_appearance");
    const nextAppearance = savedAppearance === "light" ? "light" : "dark";

    document.documentElement.setAttribute(
      "data-virtus-appearance",
      nextAppearance
    );
  }

  syncVirtusAppearance();

  window.addEventListener("storage", syncVirtusAppearance);
  window.addEventListener("focus", syncVirtusAppearance);

  return () => {
    window.removeEventListener("storage", syncVirtusAppearance);
    window.removeEventListener("focus", syncVirtusAppearance);
  };
}, []);

useEffect(() => {
  if (typeof window === "undefined") return;

  const hasOpenMobilePanel =
    showMobileMenu || projectsOpen || practiceOpen || searchOpen || captureOpen;

  if (!hasOpenMobilePanel) return;

  window.history.pushState({ virtusPanelOpen: true }, "");

  const closePanelsOnBack = () => {
    setShowMobileMenu(false);
    setProjectsOpen(false);
    setPracticeOpen(false);
    setSearchOpen(false);
    setCaptureOpen(false);
    setShowProjectInput(false);
  };

  window.addEventListener("popstate", closePanelsOnBack);

  return () => {
    window.removeEventListener("popstate", closePanelsOnBack);
  };
}, [showMobileMenu, projectsOpen, practiceOpen, searchOpen, captureOpen, projectHomeOpen]);

useEffect(() => {
  if (!practiceOpen || !isAuthenticated) return;

  loadGuidedPracticeHistory();
}, [practiceOpen, isAuthenticated]);

useEffect(() => {
  if (!captureOpen) return;

  if (!isAuthenticated) {
    setCaptureNotes([]);
    return;
  }

  loadCaptureNotes();
}, [captureOpen, isAuthenticated]);

useEffect(() => {
  if (typeof window === "undefined") return;

  try {
    const savedDraft = localStorage.getItem("virtus_capture_draft_v1");
    if (!savedDraft) return;

    const draft = JSON.parse(savedDraft);
    const draftTitle = typeof draft?.title === "string" ? draft.title : "";
    const draftType = typeof draft?.noteType === "string" ? draft.noteType : "General Note";
    const draftContent = typeof draft?.content === "string" ? draft.content : "";
    const draftLanguage =
      typeof draft?.voiceLanguage === "string" ? draft.voiceLanguage : "en-US";

    if (!draftTitle.trim() && !draftContent.trim()) return;

    setCaptureTitle((current) => current || draftTitle);
    setCaptureType(draftType || "General Note");
    setCaptureContent((current) => current || draftContent);
    setCaptureVoiceLanguage(draftLanguage || "en-US");
    setCaptureNotice("Unsaved Capture draft restored.");
  } catch {
    localStorage.removeItem("virtus_capture_draft_v1");
  }
}, []);

useEffect(() => {
  if (typeof window === "undefined") return;

  const timeoutId = setTimeout(() => {
    const hasDraft = captureTitle.trim() || captureContent.trim();

    if (!hasDraft) {
      localStorage.removeItem("virtus_capture_draft_v1");
      return;
    }

    localStorage.setItem(
      "virtus_capture_draft_v1",
      JSON.stringify({
        title: captureTitle,
        noteType: captureType,
        content: captureContent,
        voiceLanguage: captureVoiceLanguage,
        updatedAt: new Date().toISOString(),
      })
    );
  }, 1200);

  return () => clearTimeout(timeoutId);
}, [captureTitle, captureType, captureContent, captureVoiceLanguage]);
function getProjectStoragePrefix() {
  if (typeof window === "undefined") return null;

  if (isAuthenticated) {
    if (!currentUser?.email) return null;

    return `virtus_projects_account_${currentUser.email.toLowerCase()}`;
  }

  const guestId =
    localStorage.getItem("virtus_guest_id") || crypto.randomUUID();

  localStorage.setItem("virtus_guest_id", guestId);

  return `virtus_projects_guest_${guestId}`;
}

useEffect(() => {
  if (typeof window === "undefined") return;

  let cancelled = false;

  function loadLocalProjectState() {
    const storagePrefix = getProjectStoragePrefix();

    if (!storagePrefix) return;

    try {
      const savedProjects = JSON.parse(
        localStorage.getItem(`${storagePrefix}_spaces`) || "[]"
      );

      const savedProjectChats = JSON.parse(
        localStorage.getItem(`${storagePrefix}_chats`) || "{}"
      );

      setProjectSpaces(Array.isArray(savedProjects) ? savedProjects : []);

      if (
        savedProjectChats &&
        typeof savedProjectChats === "object" &&
        !Array.isArray(savedProjectChats)
      ) {
        setProjectChats(savedProjectChats);
      } else {
        setProjectChats({});
      }

      // Do not auto-open the last project on refresh.
      // A project page should appear only after the user clicks that project.
      setActiveProject(null);
      setProjectHomeOpen(false);
    } catch {
      setProjectSpaces([]);
      setProjectChats({});
      setActiveProject(null);
      setProjectHomeOpen(false);
    }
  }

  async function loadProjectSpaces() {
    setProjectStorageReady(false);

    if (isAuthenticated) {
      try {
        const response = await fetch("/api/project-spaces", {
          cache: "no-store",
        });

        const data = await response.json();

        if (cancelled) return;

        if (!response.ok) {
          loadLocalProjectState();
          return;
        }

        setProjectSpaces(Array.isArray(data.projects) ? data.projects : []);

        const storagePrefix = getProjectStoragePrefix();

        if (storagePrefix) {
          try {
            const savedProjectChats = JSON.parse(
              localStorage.getItem(`${storagePrefix}_chats`) || "{}"
            );

            if (
              savedProjectChats &&
              typeof savedProjectChats === "object" &&
              !Array.isArray(savedProjectChats)
            ) {
              setProjectChats(savedProjectChats);
            } else {
              setProjectChats({});
            }
          } catch {
            setProjectChats({});
          }
        }

        setActiveProject(null);
        setProjectHomeOpen(false);
        return;
      } catch {
        if (cancelled) return;
        loadLocalProjectState();
        return;
      } finally {
        if (!cancelled) {
          setProjectStorageReady(true);
        }
      }
    }

    loadLocalProjectState();

    if (!cancelled) {
      setProjectStorageReady(true);
    }
  }

  loadProjectSpaces();

  return () => {
    cancelled = true;
  };
}, [isAuthenticated, currentUser?.email]);

useEffect(() => {
  if (typeof window === "undefined") return;
  if (!projectStorageReady) return;

  const storagePrefix = getProjectStoragePrefix();

  if (!storagePrefix) return;

  localStorage.setItem(
    `${storagePrefix}_spaces`,
    JSON.stringify(projectSpaces)
  );

  localStorage.setItem(
    `${storagePrefix}_chats`,
    JSON.stringify(projectChats)
  );

  if (activeProject?.id && activeProject?.title) {
    localStorage.setItem(
      `${storagePrefix}_active`,
      JSON.stringify(activeProject)
    );
  } else {
    localStorage.removeItem(`${storagePrefix}_active`);
  }
}, [
  projectSpaces,
  projectChats,
  activeProject,
  projectStorageReady,
  isAuthenticated,
  currentUser?.email,
]);


function beginFileCreation(type) {
  if (creatingFileLockRef.current) return false;

  creatingFileLockRef.current = type;
  setCreatingFileType(type);
  setFileNotice(`Creating ${type}... Please wait.`);
  return true;
}

function endFileCreation() {
  creatingFileLockRef.current = "";
  setCreatingFileType("");
}

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
async function handlePastedImage(file) {
  if (!file || !String(file.type || "").startsWith("image/")) return;

  try {
    setUploadingFile(true);

    const extension = file.type?.split("/")[1] || "png";
    const safeFile = new File(
      [file],
      `pasted-image-${Date.now()}.${extension}`,
      { type: file.type || "image/png" }
    );

    const formData = new FormData();
    formData.append("file", safeFile);

    const response = await fetch("/api/files/upload", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      setFileNotice(data.error || "Image paste upload failed.");
      return;
    }

    await loadUploadedFiles();

    if (data.file?.id) {
      setActiveFile(data.file);
      setActiveFiles((currentFiles) => {
        if (currentFiles.some((item) => item.id === data.file.id)) {
          return currentFiles;
        }

        return [...currentFiles, data.file];
      });
    }

    setFileNotice("");
    textareaRef.current?.focus();
  } catch (error) {
    setFileNotice(error.message || "Image paste upload failed.");
  } finally {
    setUploadingFile(false);
  }
}
useEffect(() => {
  const handlePaste = (event) => {
    const imageItem = Array.from(event.clipboardData?.items || []).find(
      (item) => item.type && item.type.startsWith("image/")
    );

    if (!imageItem) return;

    const file = imageItem.getAsFile();
    if (!file) return;

    event.preventDefault();
    handlePastedImage(file);
  };

  window.addEventListener("paste", handlePaste);

  return () => {
    window.removeEventListener("paste", handlePaste);
  };
}, []);
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

  const cleanSpeechText = (text) =>
    String(text || "")
      .replace(/\s+/g, " ")
      .trim();

  const removeRepeatedSpeechBuildUp = (text) => {
    const clean = cleanSpeechText(text);
    const words = clean.split(" ").filter(Boolean);

    for (let size = Math.floor(words.length / 2); size >= 3; size -= 1) {
      const first = words.slice(0, size).join(" ");
      const last = words.slice(size, size * 2).join(" ");

      if (first && first === last) {
        return words.slice(size).join(" ");
      }
    }

    return clean;
  };

  if (listening && recognitionRef.current) {
    recognitionRef.current.stop();
    recognitionRef.current = null;
    setListening(false);
    return;
  }

  if (recognitionRef.current) {
    recognitionRef.current.stop();
    recognitionRef.current = null;
  }

  const startingMessage = cleanSpeechText(message);
  let committedTranscript = "";
  let lastFinalTranscript = "";

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = true;
  recognition.continuous = false;

  recognition.onstart = () => {
    setListening(true);
  };

  recognition.onresult = (event) => {
    let interimTranscript = "";

    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const transcript = getBestSpeechTranscript(event.results[i]);

      if (!transcript) continue;

      if (event.results[i].isFinal) {
        const cleanedFinal = removeRepeatedSpeechBuildUp(transcript);

        if (
          cleanedFinal &&
          cleanedFinal !== lastFinalTranscript &&
          !committedTranscript.endsWith(cleanedFinal)
        ) {
          committedTranscript = cleanSpeechText(
            `${committedTranscript} ${cleanedFinal}`
          );
          lastFinalTranscript = cleanedFinal;
        }
      } else {
        interimTranscript = removeRepeatedSpeechBuildUp(transcript);
      }
    }

    const displayText = cleanSpeechText(
      `${startingMessage} ${committedTranscript} ${interimTranscript}`
    );

    setMessage(displayText);
  };

  recognition.onerror = () => {
    setListening(false);
    recognitionRef.current = null;
  };

  recognition.onend = () => {
    setListening(false);
    recognitionRef.current = null;

    const finalText = cleanSpeechText(`${startingMessage} ${committedTranscript}`);

    setMessage(finalText);
  };

  recognitionRef.current = recognition;
  recognition.start();
};

const formatCaptureRecordingTime = (totalSeconds) => {
  const safeSeconds = Math.max(0, Number(totalSeconds) || 0);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const getCaptureTranscriptionLanguageCode = () => {
  const language = String(captureVoiceLanguage || "en-US").toLowerCase();

  if (language.startsWith("pt")) return "pt";
  if (language.startsWith("ro")) return "ro";
  if (language.startsWith("el")) return "el";
  return "en";
};

const transcribeCaptureAudioChunks = async (audioChunks, mimeType) => {
  const usableChunks = (audioChunks || []).filter(
    (chunk) => chunk && chunk.size > 0
  );

  if (!usableChunks.length) {
    setCaptureNotice("No audio was captured. Please try again.");
    return;
  }

  setCaptureTranscribing(true);
  setCaptureNotice(`Transcribing 1 of ${usableChunks.length} audio parts...`);

  const transcriptParts = [];

  try {
    for (let index = 0; index < usableChunks.length; index += 1) {
      const chunk = usableChunks[index];
      const extension = mimeType?.includes("mp4") ? "mp4" : "webm";
      const audioFile = new File(
        [chunk],
        `virtus-capture-${index + 1}.${extension}`,
        {
          type: mimeType || chunk.type || "audio/webm",
        }
      );

      const formData = new FormData();
      formData.append("audio", audioFile);
      formData.append("language", getCaptureTranscriptionLanguageCode());

      setCaptureNotice(
        `Transcribing ${index + 1} of ${usableChunks.length} audio parts...`
      );

      const response = await fetch("/api/capture/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || "Could not transcribe audio.");
      }

      const text = String(data?.text || "").trim();

      if (text) {
        transcriptParts.push(text);
      }
    }

    const transcript = transcriptParts.join("\n\n").trim();

    if (!transcript) {
      setCaptureNotice("Audio was captured, but no clear speech was detected.");
      return;
    }

    setCaptureContent((current) => {
      const existing = String(current || "").trim();

      if (!existing) return transcript;

      return `${existing}\n\n${transcript}`.trim();
    });

    setCaptureNotice("Transcription complete. Review and save the note.");
  } catch (error) {
    console.error("Capture transcription failed:", error);
    setCaptureNotice(
      error?.message || "Transcription failed. Please try again."
    );
  } finally {
    setCaptureTranscribing(false);
  }
};
const getSupportedCaptureMimeType = () => {
  if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
    return "";
  }

  const supportedTypes = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
  ];

  return (
    supportedTypes.find((type) => MediaRecorder.isTypeSupported(type)) || ""
  );
};

const stopCaptureVoiceEngine = () => {
  captureVoiceShouldContinueRef.current = false;

  if (captureVoiceRestartTimerRef.current) {
    clearTimeout(captureVoiceRestartTimerRef.current);
    captureVoiceRestartTimerRef.current = null;
  }

  if (captureRecordingTimerRef.current) {
    clearInterval(captureRecordingTimerRef.current);
    captureRecordingTimerRef.current = null;
  }

  if (captureRecognitionRef.current) {
    try {
      captureRecognitionRef.current.stop();
    } catch {}

    captureRecognitionRef.current = null;
  }

  if (
    captureMediaRecorderRef.current &&
    captureMediaRecorderRef.current.state !== "inactive"
  ) {
    try {
      captureMediaRecorderRef.current.stop();
    } catch {}
  }

  captureMediaStreamRef.current?.getTracks?.().forEach((track) => {
    try {
      track.stop();
    } catch {}
  });

  captureMediaStreamRef.current = null;
  setCaptureListening(false);
};

const handleCaptureMicrophoneClick = async () => {
  if (typeof window === "undefined") return;

  if (
    captureListening ||
    (captureMediaRecorderRef.current &&
      captureMediaRecorderRef.current.state !== "inactive")
  ) {
    stopCaptureVoiceEngine();
    setCaptureNotice("Voice recording stopped. Audio is being prepared.");
    return;
  }

  if (!window.isSecureContext) {
    setCaptureNotice(
      "Microphone recording needs HTTPS or localhost. If you are testing from a phone using a local IP address, the browser may block recording."
    );
    return;
  }

  if (!navigator?.mediaDevices?.getUserMedia) {
    setCaptureNotice("Voice recording is not supported in this browser.");
    return;
  }

  if (typeof MediaRecorder === "undefined") {
    setCaptureNotice("MediaRecorder is not available in this browser.");
    return;
  }

  if (recognitionRef.current) {
    try {
      recognitionRef.current.stop();
    } catch {}

    recognitionRef.current = null;
    setListening(false);
  }

  try {
    setCaptureNotice("Requesting microphone permission...");

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    setCaptureNotice("Microphone permission accepted. Preparing recorder...");

    const mimeType = getSupportedCaptureMimeType();
    const recorderOptions = mimeType ? { mimeType } : {};
    const recorder = new MediaRecorder(stream, recorderOptions);

    captureMediaStreamRef.current = stream;
    captureMediaRecorderRef.current = recorder;
    setCaptureNotice(`Recorder ready: ${mimeType || "browser default audio format"}`);
    captureAudioChunksRef.current = [];
    captureAudioBlobRef.current = null;
    captureVoiceShouldContinueRef.current = true;
    setCaptureRecordingSeconds(0);

    if (!captureTitle.trim()) {
      setCaptureTitle(`Voice Capture ${new Date().toLocaleString()}`);
    }

    if (captureType === "General Note") {
      setCaptureType("Voice Transcript");
    }

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        captureAudioChunksRef.current.push(event.data);
        setCaptureNotice(
          `Audio chunk captured: ${captureAudioChunksRef.current.length}`
        );
      }
    };

    recorder.onerror = () => {
      stopCaptureVoiceEngine();
      setCaptureNotice("Voice recording had a problem. Please try again.");
    };

    recorder.onstop = () => {
      const audioChunks = captureAudioChunksRef.current || [];
      const audioBlob = new Blob(audioChunks, {
        type: mimeType || "audio/webm",
      });

      captureAudioBlobRef.current = audioBlob;
      captureMediaRecorderRef.current = null;

      if (captureRecordingTimerRef.current) {
        clearInterval(captureRecordingTimerRef.current);
        captureRecordingTimerRef.current = null;
      }
      captureVoiceShouldContinueRef.current = false;

      stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });

      captureMediaStreamRef.current = null;
      setCaptureListening(false);

      if (audioBlob.size > 0) {
        setCaptureNotice(`Recording stopped. Audio size: ${audioBlob.size} bytes.`);
        transcribeCaptureAudioChunks(audioChunks, mimeType || "audio/webm");
      } else {
        setCaptureNotice("No audio was captured. Please try again.");
      }
    };

    recorder.onstart = () => {

      if (captureRecordingTimerRef.current) {
        clearInterval(captureRecordingTimerRef.current);
      }

      captureRecordingTimerRef.current = setInterval(() => {
        setCaptureRecordingSeconds((seconds) => seconds + 1);
      }, 1000);

      setCaptureListening(true);
      setCaptureNotice(
        "Recording now. Speak naturally. The transcript will appear after you press Stop Recording."
      );
    };

    recorder.start(30000);
  } catch (error) {
    stopCaptureVoiceEngine();

    if (error?.name === "NotAllowedError") {
      setCaptureNotice("Microphone permission was blocked.");
      return;
    }

    setCaptureNotice("Could not start voice recording on this device.");
  }
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

    const currentPlanKey = currentAccess?.plan ?? "guest";
  const currentProjectScope =
    currentAccess?.projectScope || getPlanPolicy(currentPlanKey).projectScope || {
      canUseProjects: false,
      maxProjects: 0,
    };

  const currentProjectLimit = currentProjectScope?.maxProjects;
  const isProjectLimitReached =
    currentProjectScope?.canUseProjects === false ||
    (typeof currentProjectLimit === "number" &&
      projectSpaces.length >= currentProjectLimit);

  function getProjectLimitMessage() {
    if (currentProjectLimit === null) {
      return "";
    }

    if (currentPlanKey === "trial_guest") {
      return "Trial Guest includes 1 project sample. Create a free account or upgrade to continue with more projects.";
    }

    if (currentPlanKey === "free") {
      return "Free includes up to 3 projects. Upgrade to Plus for 5 projects or Premium / Virtus Prime for unlimited projects.";
    }

    if (currentPlanKey === "plus") {
      return "Plus includes up to 5 projects. Upgrade to Premium / Virtus Prime for unlimited projects.";
    }

    return "Your current plan has reached its project limit.";
  }

  function canStartNewProject() {
    if (!isProjectLimitReached) {
      return true;
    }

    const limitMessage = getProjectLimitMessage();

    if (limitMessage) {
      setMessage(limitMessage);
    }

    setShowProjectInput(false);
    return false;
  }
  const canCreateFiles =
    !isTrialGuestExpired &&
    ["trial_guest", "plus", "premium"].includes(currentPlanKey);

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
    const pickRandomPrompt = (prompts) => {
      if (!Array.isArray(prompts) || prompts.length === 0) {
        return null;
      }

      const randomIndex = Math.floor(Math.random() * prompts.length);
      return prompts[randomIndex];
    };

    if (isTrialGuestPracticeSample(category)) {
      return (
        pickRandomPrompt(category.trialGuestPrompts) ||
        category.trialGuestPrompt ||
        pickRandomPrompt(category.prompts) ||
        category.prompt ||
        `I want to practice ${category.title}. Start with one simple exercise.`
      );
    }

    return (
      pickRandomPrompt(category.prompts) ||
      category.prompt ||
      `I want to practice ${category.title}. Start with one simple exercise.`
    );
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

  const getLockedPracticeCategoryMessage = (category, requiredPlan) => {
    if (isTrialGuestExpired) {
      return "Your Trial Guest access has ended. Create a free account or choose Plus or Premium to continue using Virtus Practice.";
    }

    const practiceName = category?.title || "This practice";

    const categoryMessages = {
      "mind-discipline":
        "Mind Discipline is a Plus practice because it trains thought observation, awareness before emotion, and disciplined action. Upgrade to Plus to unlock deeper cognitive training.",
      "anxiety-support":
        "Anxiety Support is a Plus practice because it uses deeper thought clarity, grounding, and calmer interpretation. Upgrade to Plus to unlock this guided support.",
      "leadership-skills":
        "Leadership Skills is a Plus practice because it trains responsibility, decision quality, and communication under pressure. Upgrade to Plus to unlock leadership practice.",
      "emotional-intelligence":
        "Emotional Intelligence is a Plus practice because it trains emotional awareness, regulation, empathy, and mature response. Upgrade to Plus to unlock this category.",
      "relationships":
        "Relationships is a Plus practice because it supports emotional maturity, boundaries, repair, and clear communication. Upgrade to Plus to unlock relationship practice.",
      "habit-recovery-support":
        "Habit & Recovery Support is a Plus practice because it works with triggers, urges, pattern interruption, and replacement action. Upgrade to Plus to unlock this discipline path.",
      "spirituality":
        "Spirituality is a Plus practice because it supports inner truth, alignment, meaning, humility, and disciplined action. Upgrade to Plus to unlock deeper spiritual reflection.",
      "marriage-preparation":
        "Preparation for Marriage is a Plus practice because it works with values, expectations, communication, commitment, and conflict readiness. Upgrade to Plus to unlock this path.",

      "assertive-communication":
        "Assertive Communication is a Premium / Virtus Prime practice because it uses stronger message control, respectful firmness, and emotional discipline. Upgrade to Virtus Prime to unlock it.",
      "decision-clarity":
        "Decision Clarity is a Premium / Virtus Prime practice because it uses deeper strategic reasoning, consequence mapping, and executive decision structure. Upgrade to Virtus Prime to unlock it.",
      "communication-discipline":
        "Communication Discipline is a Premium / Virtus Prime practice because it trains precise speech, timing, restraint, and message control. Upgrade to Virtus Prime to unlock it.",
      "conflict-control":
        "Conflict Control is a Premium / Virtus Prime practice because it works with de-escalation, boundaries, responsibility, and calm repair under pressure. Upgrade to Virtus Prime to unlock it.",
      "focus-procrastination":
        "Focus & Procrastination is a Premium / Virtus Prime practice because it trains attention control, resistance awareness, task clarity, and immediate disciplined action. Upgrade to Virtus Prime to unlock it.",
      "resilience-training":
        "Resilience Training is a Premium / Virtus Prime practice because it supports strength under pressure, recovery, meaning, and forward movement. Upgrade to Virtus Prime to unlock it.",
      "executive-training":
        "Executive Training is a Premium / Virtus Prime practice because it uses strategic thinking, decision architecture, accountability, and high-pressure leadership communication. Upgrade to Virtus Prime to unlock it.",
    };

    if (categoryMessages[category?.id]) {
      return categoryMessages[category.id];
    }

    if (requiredPlan === "plus") {
      return `${practiceName} is a Plus practice. Plus unlocks deeper coaching categories for emotional discipline, habits, relationships, leadership, and self-mastery.`;
    }

    if (requiredPlan === "premium") {
      return `${practiceName} is a Premium / Virtus Prime practice. Premium unlocks the deepest strategic, leadership, project, transformation, and executive practices.`;
    }

    return "Create a free account to unlock this practice category.";
  };

  const guidedPracticeTotalSteps = guidedPracticeQuestions.length;
  const currentGuidedPracticeQuestion =
    guidedPracticeQuestions[guidedPracticeStep] || guidedPracticeQuestions[0];

  function updateGuidedPracticeAnswer(questionId, value, extra = {}) {
    setGuidedPracticeAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...(prev[questionId] || {}),
        value,
        ...extra,
      },
    }));
  }

  function getGuidedPracticeAnswerText(answer) {
    if (!answer) return "";

    if (typeof answer === "string") {
      return answer.trim();
    }

    const rawValue = answer.value;
    const value = Array.isArray(rawValue)
      ? rawValue.filter(Boolean).join(", ")
      : String(rawValue || "").trim();

    const detail = String(answer.detail || "").trim();

    if (value && detail) {
      return `${value} - ${detail}`;
    }

    return value || detail;
  }
  function isGuidedPracticeAnswerReady(question) {
    if (!question) return false;

    const answer = guidedPracticeAnswers[question.id];

    return getGuidedPracticeAnswerText(answer).trim().length > 0;
  }

  function resetGuidedPracticeFlow() {
    setShowGuidedPractice(false);
    setGuidedPracticeStep(0);
    setGuidedPracticeAnswers({});
  }

  async function loadGuidedPracticeHistory() {
    if (!isAuthenticated) {
      setGuidedPracticeHistory([]);
      return;
    }

    try {
      setLoadingGuidedPracticeHistory(true);

      const res = await fetch("/api/guided-practices", {
        cache: "no-store",
      });

      const data = await res.json();

      setGuidedPracticeHistory(Array.isArray(data.practices) ? data.practices : []);
    } catch (error) {
      setGuidedPracticeHistory([]);
    } finally {
      setLoadingGuidedPracticeHistory(false);
    }
  }

  async function openGuidedPracticeChat(item) {
    if (!item?.id) return;

    abortControllerRef.current?.abort();
    stopVirtusVoice();
    abortControllerRef.current = null;

    setShouldAutoScroll(true);
    setMessage("");
    setReply("");
    setStreamingReply("");
    setEditingIndex(null);
    setEditingText("");
    setIsPracticeMode(null);
    setActiveProject(null);
    setProjectHomeOpen(false);
    setLoading(true);

    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatId: item.id,
        }),
      });

      const data = await res.json();

      if (data.access) {
        setAccountAccess(data.access);
      }

      setConversation(data.conversation || []);
      setActiveChatId(item.id);
      localStorage.setItem("virtus_chat_id", item.id);
      setPracticeOpen(false);
      setShowMobileMenu(false);
    } catch (error) {
      setConversation([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteGuidedPractice(item) {
    if (!item?.id) return;

    const confirmed = await askVirtusConfirm("Delete this guided practice?");
    if (!confirmed) return;

    const guestId =
      localStorage.getItem("virtus_guest_id") || crypto.randomUUID();

    localStorage.setItem("virtus_guest_id", guestId);

    try {
      const response = await fetch("/api/conversations", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatId: item.id,
          ...(isAuthenticated ? {} : { guestId }),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Guided practice delete failed.");
        return;
      }

      setGuidedPracticeHistory((currentHistory) =>
        currentHistory.filter((savedPractice) => savedPractice.id !== item.id)
      );

      if (activeChatId === item.id) {
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
        setIsPracticeMode(null);
        setLoading(false);
      }
    } catch (error) {
      alert(error.message || "Guided practice delete failed.");
    }
  }

  function buildGuidedPracticePrompt() {
    const answer = (id) =>
      getGuidedPracticeAnswerText(guidedPracticeAnswers[id]) || "Not answered";

    const selectedArea = answer("area");

    const categoryGuidance = {
      Mind:
        "This is a Mind practice. Focus on thought observation, mental discipline, interpretation, attention, and conscious choice.",
      Emotion:
        "This is an Emotion practice. Focus on emotional activation, nervous system response, regulation, emotional honesty, and mature correction.",
      Relationship:
        "This is a Relationship practice. Focus on attachment meaning, emotional safety, rejection sensitivity, connection, boundaries, repair, and communication.",
      Work:
        "This is a Work practice. Focus on pressure, responsibility, productivity, professional response, priorities, and disciplined action.",
      Leadership:
        "This is a Leadership practice. Focus on responsibility, decision quality, emotional control under pressure, influence, and communication maturity.",
      Family:
        "This is a Family practice. Focus on family roles, emotional patterns, expectations, respect, patience, boundaries, and repair.",
      Spiritual:
        "This is a Spiritual practice. Focus on truth, humility, alignment, meaning, conscience, inner correction, and disciplined action before God.",
      Business:
        "This is a Business practice. Focus on clarity, strategy, decision-making, execution, responsibility, communication, and measurable action.",
    };

    const selectedCategoryGuidance =
      categoryGuidance[selectedArea] ||
      "Use the selected area as the main lens for the entire practice.";

    return [
      "Create a personalized Guided Practice Assessment from my answers.",
      "",
      `Primary practice category: ${selectedArea}`,
      "",
      "Important instruction:",
      `Treat "${selectedArea}" as the main category lens for the entire answer.`,
      selectedCategoryGuidance,
      "Do not give a generic practice. Make every section specific to this category and to the real situation described by the user.",
      "If the user selected multiple answers for any question, analyze the relationship between those answers. Identify the dominant pattern, secondary signals, and the most useful exercise direction.",
      "",
      "Use the Virtus framework:",
      "Thought -> Awareness -> Emotion -> Behavior -> Communication",
      "",
      "My answers:",
      `1. Area: ${answer("area")}`,
      `2. What happened: ${answer("whatHappened")}`,
      `3. Biggest challenge: ${answer("biggestChallenge")}`,
      `4. Strongest thought: ${answer("strongestThought")}`,
      `5. Strongest emotion: ${answer("strongestEmotion")}`,
      `6. Intensity: ${answer("intensity")}`,
      `7. Reaction to avoid: ${answer("reactionToAvoid")}`,
      `8. Desired behavior: ${answer("desiredBehavior")}`,
      `9. Desired result: ${answer("desiredResult")}`,
      `10. Practice depth: ${answer("practiceDepth")}`,
      "",
      `Please create a ${selectedArea}-specific practice with:`,
      "- a clear reflection through the selected category",
      "- the hidden thought pattern connected to this category",
      "- an awareness question",
      "- an emotional correction",
      "- a behavior practice",
      "- a communication practice if relevant",
      "- one practical action step",
      "- one short follow-up challenge",
      "",
      "Make the answer wise, precise, human, and directly connected to the user's selected area.",
    ].join("\n");
  }
  async function handleCreateGuidedPractice() {
    const guidedPrompt = buildGuidedPracticePrompt();
    const guidedChatId = crypto.randomUUID();
    const guidedPracticeArea =
      getGuidedPracticeAnswerText(guidedPracticeAnswers.area) || "General";
    const guidedPracticeTitle = `Guided Practice - ${guidedPracticeArea}`;

    setPracticeOpen(false);
    setShowMobileMenu(false);
    setShowGuidedPractice(false);
    setGuidedPracticeStep(0);
    setGuidedPracticeAnswers({});
    setIsPracticeMode("guided-practice-assessment");
    setActiveProject(null);
    setProjectHomeOpen(false);
    setActiveChatId(guidedChatId);
    localStorage.setItem("virtus_chat_id", guidedChatId);
    setConversation([]);
    setMessage("");
    setReply("");
    setStreamingReply("");
    setRecentConversations((prev) =>
      prev.filter((item) => {
        const title = String(item?.title || "").toLowerCase();
        return (
          !title.startsWith("create a personalized guided") &&
          !title.startsWith("guided practice -")
        );
      })
    );

    await sendMessage(guidedPrompt, "guided-practice-assessment", {
      chatId: guidedChatId,
      startFreshChat: true,
      hideFromRecent: true,
      hideFromSidebar: true,
      forceNoProject: true,
      sessionTitle: guidedPracticeTitle,
    });
  }

  function resetCaptureEditor() {
    stopCaptureVoiceEngine();
    captureVoiceBaseRef.current = "";
    captureVoiceCommittedRef.current = "";

    if (typeof window !== "undefined") {
      localStorage.removeItem("virtus_capture_draft_v1");
    }

    setActiveCaptureNote(null);
    setCaptureTitle("");
    setCaptureType("General Note");
    setCaptureContent("");
    setCaptureNotice("");
  }

  function formatCaptureDate(value) {
    if (!value) return "Saved capture";

    try {
      return new Date(value).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Saved capture";
    }
  }

  async function loadCaptureNotes() {
    if (!isAuthenticated) {
      setCaptureNotes([]);
      return;
    }

    try {
      setLoadingCaptureNotes(true);

      const res = await fetch("/api/capture-notes", {
        method: "GET",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        setCaptureNotice(data.error || "Capture notes could not be loaded.");
        return;
      }

      setCaptureNotes(Array.isArray(data.notes) ? data.notes : []);
    } catch (error) {
      setCaptureNotice(error.message || "Capture notes could not be loaded.");
    } finally {
      setLoadingCaptureNotes(false);
    }
  }

  function openCaptureNote(note) {
    if (!note) return;

    setActiveCaptureNote(note);
    setCaptureTitle(note.title || "");
    setCaptureType(note.noteType || "General Note");
    setCaptureContent(note.content || "");
    setCaptureNotice("");
  }

  async function handleSaveCaptureNote() {
    if (!isAuthenticated) {
      setCaptureNotice("Please sign in to save Virtus Capture notes.");
      return;
    }

    const cleanContent = captureContent.trim();
    const cleanTitle = captureTitle.trim() || "Untitled Capture";

    if (!cleanContent) {
      setCaptureNotice("Write something before saving the capture.");
      return;
    }

    try {
      stopCaptureVoiceEngine();
      setSavingCaptureNote(true);
      setCaptureNotice("");

      const isUpdating = Boolean(activeCaptureNote?.id);

      const res = await fetch("/api/capture-notes", {
        method: isUpdating ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: activeCaptureNote?.id,
          title: cleanTitle,
          noteType: captureType,
          content: cleanContent,
          source: "text",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setCaptureNotice(data.error || "Capture note could not be saved.");
        return;
      }

      const savedNote = data.note;

      setCaptureNotes((currentNotes) => {
        const withoutSaved = currentNotes.filter((note) => note.id !== savedNote.id);
        return [savedNote, ...withoutSaved];
      });

      if (typeof window !== "undefined") {
        localStorage.removeItem("virtus_capture_draft_v1");
      }

      setActiveCaptureNote(null);
      setCaptureTitle("");
      setCaptureType("General Note");
      setCaptureContent("");
      setCaptureNotice(isUpdating ? "Capture updated and cleared." : "Capture saved and cleared.");
    } catch (error) {
      setCaptureNotice(error.message || "Capture note could not be saved.");
    } finally {
      setSavingCaptureNote(false);
    }
  }

  async function handleDeleteCaptureNote(note) {
    if (!note?.id) return;

    const confirmed = await askVirtusConfirm("Delete this capture note?");
    if (!confirmed) return;

    try {
      const res = await fetch("/api/capture-notes", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: note.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        setCaptureNotice(data.error || "Capture note delete failed.");
        return;
      }

      setCaptureNotes((currentNotes) =>
        currentNotes.filter((savedNote) => savedNote.id !== note.id)
      );

      if (activeCaptureNote?.id === note.id) {
        resetCaptureEditor();
      }

      setCaptureNotice("Capture deleted.");
    } catch (error) {
      setCaptureNotice(error.message || "Capture note delete failed.");
    }
  }

  function buildCaptureChatPrompt(note) {
    const noteTitle = note?.title || "Untitled Capture";
    const noteType = note?.noteType || "General Note";
    const noteContent = note?.content || "";

    return [
      "Organize this Virtus Capture note.",
      "",
      "Use the Virtus framework:",
      "Thought -> Awareness -> Emotion -> Behavior -> Communication",
      "",
      `Note type: ${noteType}`,
      `Note title: ${noteTitle}`,
      "",
      "Raw note:",
      noteContent,
      "",
      "Before organizing:",
      "- lightly correct obvious speech-to-text mistakes",
      "- keep the original meaning",
      "- do not invent facts",
      "- if a word is unclear, mark it as unclear instead of guessing",
      "",
      "Please create:",
      "- a corrected version of the note",
      "- a clean summary",
      "- key points",
      "- hidden thought or meaning if relevant",
      "- emotional signals if relevant",
      "- decisions mentioned",
      "- tasks or action steps",
      "- communication points if relevant",
      "- suggested memory, if useful",
      "- one recommended next step",
      "",
      "Important:",
      "Do not say you remembered or saved anything unless there is a real memory save action.",
      "Only write suggested memory as a recommendation.",
      "Do not turn every note into therapy.",
      "If it is a business note, organize it like business intelligence.",
      "If it is a meeting note, organize it like meeting minutes and action items.",
      "If it is a personal reflection, use the Virtus framework.",
      "If it is a spiritual reflection, focus on truth, alignment, humility, and disciplined action.",
      "If it is a client note, keep it professional and structured.",
    ].join("\n");
  }

  function openCaptureNoteInChat(note) {
    if (!note) return;

    setMessage(buildCaptureChatPrompt(note));
    setCaptureOpen(false);
    setSearchOpen(false);
    setProjectsOpen(false);
    setPracticeOpen(false);
    setShowMobileMenu(false);
    setActiveProject(null);
    setProjectHomeOpen(false);
    setIsPracticeMode(null);
    setShouldAutoScroll(true);

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  }

  const captureVoiceLanguageOptions = [
    { value: "en-US", label: "English" },
    { value: "pt-PT", label: "Portuguese" },
    { value: "pt-BR", label: "Portuguese Brazil" },
    { value: "ro-RO", label: "Romanian" },
    { value: "el-GR", label: "Greek" },
  ];

  function getCaptureVoiceLanguageLabel(value) {
    return (
      captureVoiceLanguageOptions.find((option) => option.value === value)?.label ||
      "English"
    );
  }

  function getCaptureMobilePickerTitle() {
    if (captureMobilePicker === "noteType") return "Select note type";
    if (captureMobilePicker === "language") return "Select voice language";
    return "";
  }

  function getCaptureMobilePickerOptions() {
    if (captureMobilePicker === "noteType") {
      return captureNoteTypes.map((type) => ({ value: type, label: type }));
    }

    if (captureMobilePicker === "language") {
      return captureVoiceLanguageOptions;
    }

    return [];
  }

  function getCaptureMobilePickerValue() {
    if (captureMobilePicker === "noteType") return captureType;
    if (captureMobilePicker === "language") return captureVoiceLanguage;
    return "";
  }

  function handleCaptureMobilePickerSelect(value) {
    if (captureMobilePicker === "noteType") {
      setCaptureType(value);
    }

    if (captureMobilePicker === "language") {
      setCaptureVoiceLanguage(value);
    }

    setCaptureMobilePicker(null);
  }

  function renderCaptureMobilePicker() {
    if (!captureMobilePicker) return null;

    const options = getCaptureMobilePickerOptions();
    const currentValue = getCaptureMobilePickerValue();

    return (
      <div className="fixed inset-0 z-[90] flex items-end bg-black/70 px-3 pb-4 pt-20 backdrop-blur-sm md:hidden">
        <div className="max-h-[72dvh] w-full overflow-hidden rounded-3xl border border-sky-800/35 bg-zinc-950 shadow-[0_24px_80px_rgba(2,132,199,0.25)]">
          <div className="flex items-center justify-between border-b border-sky-900/25 px-4 py-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300/65">
                Virtus Capture
              </p>
              <p className="mt-1 text-base font-semibold text-zinc-100">
                {getCaptureMobilePickerTitle()}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setCaptureMobilePicker(null)}
              className="rounded-full border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-sm text-zinc-300"
            >
              Close
            </button>
          </div>

          <div className="max-h-[58dvh] overflow-y-auto p-2 [scrollbar-color:rgba(56,189,248,0.45)_rgba(9,9,11,0.75)] [scrollbar-width:thin]">
            {options.map((option) => {
              const selected = option.value === currentValue;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleCaptureMobilePickerSelect(option.value)}
                  className={`mb-1 flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-left text-base transition ${
                    selected
                      ? "border-sky-500/45 bg-sky-950/45 text-sky-100 shadow-[0_0_24px_rgba(14,165,233,0.18)]"
                      : "border-zinc-800/70 bg-zinc-950/60 text-zinc-200 hover:border-sky-800/40"
                  }`}
                >
                  <span>{option.label}</span>
                  <span
                    className={`ml-3 flex h-6 w-6 items-center justify-center rounded-full border ${
                      selected
                        ? "border-sky-300 bg-sky-400/20 text-sky-100"
                        : "border-zinc-600 text-zinc-500"
                    }`}
                  >
                    {selected ? "?" : ""}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
  function renderCapturePanel() {
    return (
      <div className="mt-3 max-h-[calc(100dvh-220px)] space-y-3 overflow-y-auto overscroll-contain rounded-2xl border border-sky-900/20 bg-zinc-950/55 p-3 pb-24 shadow-[0_18px_60px_rgba(2,132,199,0.12)] [scrollbar-color:rgba(56,189,248,0.45)_rgba(9,9,11,0.75)] [scrollbar-width:thin] md:max-h-[520px]">
        {renderCaptureMobilePicker()}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300/60">
            Virtus Capture
          </p>
          <p className="mt-1 text-sm leading-6 text-zinc-300">
            Capture thoughts, meetings, ideas, and reflections without mixing them into Recent chats.
          </p>
        </div>

        {!isAuthenticated ? (
          <div className="rounded-2xl border border-sky-900/20 bg-zinc-950/50 p-3 text-sm leading-6 text-zinc-300">
            Sign in to save Capture notes securely to your account.
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <input
                value={captureTitle}
                onChange={(event) => setCaptureTitle(event.target.value)}
                placeholder="Note title..."
                className="w-full rounded-xl border border-sky-900/25 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-sky-600/50"
              />

              <select
                value={captureType}
                onChange={(event) => setCaptureType(event.target.value)}
                className="w-full rounded-xl border border-sky-900/25 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-sky-600/50 [&>option]:bg-zinc-950 [&>option]:text-zinc-100"
              >
                {captureNoteTypes.map((type) => (
                  <option key={type} value={type} className="bg-zinc-950 text-zinc-100">
                    {type}
                  </option>
                ))}
              </select>

              <textarea
                value={captureContent}
                onChange={(event) => setCaptureContent(event.target.value)}
                placeholder="Write the raw thought, meeting note, idea, reflection, or task here..."
                rows={7}
                className="w-full resize-none rounded-xl border border-sky-900/25 bg-zinc-950/70 px-3 py-2 text-sm leading-6 text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-sky-600/50"
              />

              <div className="rounded-xl border border-sky-900/20 bg-zinc-950/45 p-2">
                <div className="mb-2">
                  <select
                    value={captureVoiceLanguage}
                    onChange={(event) => setCaptureVoiceLanguage(event.target.value)}
                    disabled={captureListening || captureTranscribing}
                    className="w-full rounded-xl border border-sky-900/25 bg-zinc-950/70 px-3 py-2 text-xs text-zinc-100 outline-none focus:border-sky-600/50 disabled:opacity-60 [&>option]:bg-zinc-950 [&>option]:text-zinc-100"
                  >
                    <option value="en-US" className="bg-zinc-950 text-zinc-100">English</option>
                    <option value="pt-PT" className="bg-zinc-950 text-zinc-100">Portuguese</option>
                    <option value="pt-BR" className="bg-zinc-950 text-zinc-100">Portuguese Brazil</option>
                    <option value="ro-RO" className="bg-zinc-950 text-zinc-100">Romanian</option>
                    <option value="el-GR" className="bg-zinc-950 text-zinc-100">Greek</option>
                  </select>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCaptureMicrophoneClick}
                    disabled={captureTranscribing}
                    className={`rounded-xl border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      captureListening
                        ? "border-red-500/40 bg-red-950/25 text-red-100 hover:bg-red-950/35"
                        : "border-sky-700/30 bg-sky-950/30 text-sky-100 hover:border-sky-500/50 hover:bg-sky-900/25"
                    }`}
                  >
                    {captureTranscribing ? "Transcribing..." : captureListening ? "Stop Recording" : "Start Recording"}
                  </button>

                  <span className="text-xs leading-5 text-zinc-500">
                    {captureTranscribing
                      ? "Transcribing now. The text will appear inside the note."
                      : captureListening
                        ? `Recording ${formatCaptureRecordingTime(captureRecordingSeconds)} - transcript appears after Stop.`
                        : "Records audio first, then transcribes cleanly after Stop."}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleSaveCaptureNote}
                disabled={savingCaptureNote}
                className="rounded-xl border border-sky-700/30 bg-sky-950/35 px-3 py-2 text-sm font-medium text-sky-100 transition hover:border-sky-500/50 hover:bg-sky-900/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingCaptureNote
                  ? "Saving..."
                  : activeCaptureNote?.id
                    ? "Update Note"
                    : "Save Note"}
              </button>

              <button
                type="button"
                onClick={resetCaptureEditor}
                className="rounded-xl border border-zinc-800 bg-zinc-950/45 px-3 py-2 text-sm text-zinc-300 transition hover:border-sky-800/40 hover:text-sky-100"
              >
                Clear
              </button>
            </div>

            {captureNotice && (
              <p className="rounded-xl border border-sky-900/20 bg-sky-950/15 px-3 py-2 text-xs leading-5 text-sky-100/80">
                {captureNotice}
              </p>
            )}

            <div className="pt-2">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300/55">
                  Saved Captures
                </p>
                <button
                  type="button"
                  onClick={loadCaptureNotes}
                  className="text-xs text-sky-200/70 transition hover:text-sky-100"
                >
                  Refresh
                </button>
              </div>

              {loadingCaptureNotes ? (
                <p className="rounded-xl border border-zinc-800/60 bg-zinc-950/35 px-3 py-2 text-sm text-zinc-400">
                  Loading captures...
                </p>
              ) : captureNotes.length === 0 ? (
                <p className="rounded-xl border border-zinc-800/60 bg-zinc-950/35 px-3 py-2 text-sm text-zinc-500">
                  Your saved Capture notes will appear here.
                </p>
              ) : (
                <div className="space-y-2">
                  {captureNotes.map((note) => (
                    <div
                      key={note.id}
                      className="group flex items-start justify-between gap-2 rounded-xl border border-zinc-800/70 bg-zinc-950/35 p-3 transition hover:border-sky-800/40 hover:bg-zinc-950/60"
                    >
                      <button
                        type="button"
                        onClick={() => openCaptureNoteInChat(note)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <span className="block truncate text-sm font-medium text-zinc-100">
                          {note.title || "Untitled Capture"}
                        </span>
                        <span className="mt-1 block text-xs text-zinc-500">
                          {note.noteType || "General Note"} - {formatCaptureDate(note.createdAt)} - Open in chat
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openCaptureNote(note)}
                        className="rounded-lg border border-sky-900/20 px-2 py-1 text-xs text-sky-200/70 transition hover:border-sky-700/40 hover:bg-sky-950/25 hover:text-sky-100"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteCaptureNote(note)}
                        aria-label="Delete capture note"
                        title="Delete"
                        className="rounded-lg border border-transparent px-2 py-1 text-xs text-zinc-500 opacity-80 transition hover:border-red-500/30 hover:bg-red-950/20 hover:text-red-200 group-hover:opacity-100"
                      >
                        ?
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  function renderGuidedPracticeAssessment() {
    const isReviewStep = guidedPracticeStep >= guidedPracticeTotalSteps;
    const question = currentGuidedPracticeQuestion;
    const currentAnswer = question
      ? guidedPracticeAnswers[question.id] || {}
      : {};
    const currentValue = Array.isArray(currentAnswer.value)
      ? currentAnswer.value.join(", ")
      : String(currentAnswer.value || "");
    const currentDetail = String(currentAnswer.detail || "");
    const multiSelectQuestionIds = [
      "biggestChallenge",
      "strongestEmotion",
      "reactionToAvoid",
      "desiredBehavior",
      "desiredResult",
    ];
    const maxSelections =
      question && multiSelectQuestionIds.includes(question.id) ? 3 : 1;
    const currentValues = Array.isArray(currentAnswer.value)
      ? currentAnswer.value
      : currentValue
        ? [currentValue]
        : [];
    const currentAnswerValueForUpdate = Array.isArray(currentAnswer.value)
      ? currentAnswer.value
      : currentValue;
    const selectionLabel =
      maxSelections > 1 ? `Choose up to ${maxSelections}` : "";
    const canMoveNext =
      isReviewStep || isGuidedPracticeAnswerReady(question);

    return (
      <div className="mb-3 rounded-2xl border border-sky-900/25 bg-zinc-950/45 p-3 shadow-sm shadow-sky-950/20">
        {!showGuidedPractice ? (
          <div className="space-y-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300/70">
                Guided Practice Assessment
              </p>
              <h3 className="mt-1 text-sm font-semibold text-sky-100">
                Create a personalized practice
              </h3>
              <p className="mt-1 text-xs leading-5 text-zinc-400">
                Answer 10 smart coaching questions and Virtus will create a practice using Thought &rarr; Awareness &rarr; Emotion &rarr; Behavior &rarr; Communication.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setGuidedPracticeAnswers({});
                setShowGuidedPractice(true);
                setGuidedPracticeStep(0);
              }}
              className="w-full rounded-xl border border-sky-800/35 bg-sky-950/35 px-3 py-2 text-sm font-medium text-sky-100 transition hover:border-sky-600/50 hover:bg-sky-900/35"
            >
              Start Guided Practice
            </button>

            <div className="rounded-xl border border-sky-900/15 bg-black/20 p-2">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-300/55">
                  Old Guided Practices
                </p>

                <button
                  type="button"
                  onClick={loadGuidedPracticeHistory}
                  className="text-[11px] text-zinc-500 transition hover:text-sky-300"
                >
                  Refresh
                </button>
              </div>

              {loadingGuidedPracticeHistory ? (
                <p className="px-1 py-1 text-xs text-zinc-500">
                  Loading guided practices...
                </p>
              ) : guidedPracticeHistory.length === 0 ? (
                <p className="px-1 py-1 text-xs leading-5 text-zinc-500">
                  Your saved guided practices will appear here.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {guidedPracticeHistory.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="group flex items-center gap-2 rounded-xl border border-sky-900/15 bg-zinc-950/35 pr-2 text-zinc-300 transition hover:border-sky-800/35 hover:bg-sky-950/25"
                    >
                      <button
                        type="button"
                        onClick={() => openGuidedPracticeChat(item)}
                        className="min-w-0 flex-1 px-3 py-2 text-left text-xs"
                      >
                        <span className="block truncate font-medium text-sky-100">
                          {item.title || "Guided Practice"}
                        </span>
                        <span className="mt-0.5 block text-[10px] text-zinc-500">
                          {item.created_at
                            ? new Date(item.created_at).toLocaleDateString()
                            : "Saved practice"}
                        </span>
                      </button>

                      <button
                        type="button"
                        aria-label="Delete guided practice"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDeleteGuidedPractice(item);
                        }}
                        className="group relative flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-zinc-500 opacity-70 transition hover:bg-red-950/30 hover:text-red-200 group-hover:opacity-100"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="h-3.5 w-3.5"
                        >
                          <circle cx="5" cy="12" r="1.5" />
                          <circle cx="12" cy="12" r="1.5" />
                          <circle cx="19" cy="12" r="1.5" />
                        </svg>

                        <span className="pointer-events-none absolute left-1/2 top-[calc(100%+8px)] z-50 -translate-x-1/2 whitespace-nowrap rounded-xl border border-sky-900/35 bg-zinc-950/95 px-3 py-1 text-xs font-medium text-sky-100 opacity-0 shadow-lg shadow-sky-950/30 backdrop-blur-sm transition group-hover:opacity-100">
                          Delete
                        </span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : isReviewStep ? (
          <div className="space-y-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300/70">
                Review
              </p>
              <h3 className="mt-1 text-sm font-semibold text-sky-100">
                Ready to create your practice
              </h3>
              <p className="mt-1 text-xs leading-5 text-zinc-400">
                Virtus will use your answers to create a focused practice.
              </p>
            </div>

            <div className="max-h-48 space-y-2 overflow-y-auto rounded-xl border border-sky-900/15 bg-black/20 p-2 no-scrollbar">
              {guidedPracticeQuestions.map((item, index) => (
                <div key={item.id} className="text-xs leading-5">
                  <span className="text-sky-300/70">
                    {index + 1}. {item.label}
                  </span>
                  <span className="block text-zinc-300">
                    {getGuidedPracticeAnswerText(guidedPracticeAnswers[item.id]) || "Not answered"}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setGuidedPracticeStep(guidedPracticeTotalSteps - 1)}
                className="flex-1 rounded-xl border border-zinc-800/80 px-3 py-2 text-sm text-zinc-300 transition hover:border-sky-900/35 hover:bg-zinc-900/70"
              >
                Back
              </button>

              <button
                type="button"
                onClick={handleCreateGuidedPractice}
                className="flex-1 rounded-xl border border-sky-700/45 bg-sky-950/45 px-3 py-2 text-sm font-medium text-sky-100 transition hover:border-sky-500/60 hover:bg-sky-900/45"
              >
                Create My Practice
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300/70">
                  Question {guidedPracticeStep + 1} of {guidedPracticeTotalSteps}
                </p>

                <button
                  type="button"
                  onClick={resetGuidedPracticeFlow}
                  className="text-xs text-zinc-500 transition hover:text-sky-300"
                >
                  Close
                </button>
              </div>

              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-900">
                <div
                  className="h-full rounded-full bg-sky-500/70 transition-all"
                  style={{
                    width: `${((guidedPracticeStep + 1) / guidedPracticeTotalSteps) * 100}%`,
                  }}
                />
              </div>

              <h3 className="mt-3 text-sm font-semibold text-sky-100">
                {question.label}
              </h3>

              {selectionLabel && (
                <p className="mt-1 text-xs text-sky-300/60">
                  {selectionLabel}
                </p>
              )}
            </div>

            {question.type === "text" && (
              <textarea
                value={currentValue}
                onChange={(e) =>
                  updateGuidedPracticeAnswer(question.id, e.target.value)
                }
                rows={3}
                placeholder={question.placeholder || "Write your answer..."}
                className="w-full resize-none rounded-xl border border-sky-900/25 bg-black/25 px-3 py-2 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-sky-700/50"
              />
            )}

            {(question.type === "choice" ||
              question.type === "choice_with_optional_text") && (
              <div className="grid grid-cols-2 gap-2">
                {question.options.map((option) => {
                  const selected = currentValues.includes(option);

                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        const nextValue =
                          maxSelections > 1
                            ? selected
                              ? currentValues.filter((item) => item !== option)
                              : currentValues.length >= maxSelections
                                ? currentValues
                                : [...currentValues, option]
                            : option;

                        updateGuidedPracticeAnswer(question.id, nextValue, {
                          detail: currentDetail,
                        });
                      }}
                      className={`rounded-xl border px-3 py-2 text-left text-xs transition ${
                        selected
                          ? "border-sky-500/60 bg-sky-950/55 text-sky-100"
                          : "border-zinc-800/80 bg-zinc-950/35 text-zinc-300 hover:border-sky-800/40 hover:bg-sky-950/20"
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            )}

            {question.type === "choice_with_optional_text" && (
              <textarea
                value={currentDetail}
                onChange={(e) =>
                  updateGuidedPracticeAnswer(question.id, currentAnswerValueForUpdate, {
                    detail: e.target.value,
                  })
                }
                rows={2}
                placeholder={question.placeholder || "Optional detail..."}
                className="w-full resize-none rounded-xl border border-sky-900/25 bg-black/25 px-3 py-2 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-sky-700/50"
              />
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  guidedPracticeStep === 0
                    ? resetGuidedPracticeFlow()
                    : setGuidedPracticeStep((prev) => Math.max(prev - 1, 0))
                }
                className="flex-1 rounded-xl border border-zinc-800/80 px-3 py-2 text-sm text-zinc-300 transition hover:border-sky-900/35 hover:bg-zinc-900/70"
              >
                {guidedPracticeStep === 0 ? "Cancel" : "Back"}
              </button>

              <button
                type="button"
                disabled={!canMoveNext}
                onClick={() =>
                  guidedPracticeStep >= guidedPracticeTotalSteps - 1
                    ? setGuidedPracticeStep(guidedPracticeTotalSteps)
                    : setGuidedPracticeStep((prev) => prev + 1)
                }
                className="flex-1 rounded-xl border border-sky-700/45 bg-sky-950/45 px-3 py-2 text-sm font-medium text-sky-100 transition hover:border-sky-500/60 hover:bg-sky-900/45 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {guidedPracticeStep >= guidedPracticeTotalSteps - 1
                  ? "Review"
                  : "Next"}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
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
      subtitle: "3-day premium-style sample.",
      bullets: [
        "A strong preview of the deeper Virtus experience",
        "Good for reflection, planning, and pattern awareness",
        "Keeps short-term continuity during the trial",
        "After the trial, create an account to keep using Virtus",
      ],
    };
  }

  if (plan === "free") {
    return {
      title: "Free",
      subtitle: "$0 entry account.",
      bullets: [
        "Saved chats for basic continuity",
        "Light guidance for practical questions and daily reflection",
        "Standard usage for simple support",
        "Best for trying Virtus before upgrading",
      ],
    };
  }

  if (plan === "plus") {
    return {
      title: "Plus",
      subtitle: "$19/month or $15.99/month yearly.",
      bullets: [
        "Stronger personal coaching and emotional support",
        "Better memory and continuity across chats",
        "More guided help with decisions, habits, and self-discipline",
        "Includes support for up to 3 project spaces",
      ],
    };
  }

  return {
    title: "Premium / Virtus Prime",
    subtitle: "$49/month or $44.99/month yearly.",
    bullets: [
      "Deepest strategic and executive guidance",
      "Strongest personalization, correction, and continuity",
      "Best for leadership, coaching, projects, and long-term transformation",
      "Includes advanced support for up to 50 project spaces",
    ],
  };
}
    useEffect(() => {
    const storedTrialUsed = localStorage.getItem("virtus_trial_used") === "true";
    const parsedGuestAccess = getStoredGuestAccess();
    const normalizedGuestAccess = normalizeGuestAccess(parsedGuestAccess);

    const existingGuestId = localStorage.getItem("virtus_guest_id");

    setShowPlanOverlay(
      !!existingGuestId && localStorage.getItem(planOverlayStorageKey) !== "true"
    );
    setGuestAccess(existingGuestId ? normalizedGuestAccess : null);

    const savedChatId = getGuestSidebarChatId(
      existingGuestId ? normalizedGuestAccess?.plan : null,
      existingGuestId ? localStorage.getItem("virtus_chat_id") || crypto.randomUUID() : crypto.randomUUID()
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

function askVirtusConfirm(message) {
  return new Promise((resolve) => {
    setConfirmDialog({
      message,
      resolve,
    });
  });
}

async function saveProjectSpaceToApi(project) {
  if (!isAuthenticated || !project?.id || !project?.title) return;

  try {
    await fetch("/api/project-spaces", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ project }),
    });
  } catch {
    // Keep local UI stable even if project sync fails temporarily.
  }
}

async function deleteProjectSpaceFromApi(projectId) {
  if (!isAuthenticated || !projectId) return;

  try {
    await fetch("/api/project-spaces", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ projectId }),
    });
  } catch {
    // Keep local UI cleanup stable even if remote delete fails temporarily.
  }
}

function upsertProjectSpaceState(project) {
  if (!project?.id) return;

  setProjectSpaces((prev) => [
    project,
    ...prev.filter((savedProject) => savedProject.id !== project.id),
  ]);
}
async function handleDeleteProject(project) {
  if (!project?.id) return;

  const confirmed = await askVirtusConfirm("Delete this project?");
  if (!confirmed) return;

  await deleteProjectSpaceFromApi(project.id);

  const guestId =
    localStorage.getItem("virtus_guest_id") || crypto.randomUUID();

  localStorage.setItem("virtus_guest_id", guestId);

  const projectChatIds = [
    project.chatId,
    ...(projectChats[project.id] || []).map((item) => item.chatId),
  ].filter(Boolean);

  const uniqueProjectChatIds = [...new Set(projectChatIds)];

  for (const chatId of uniqueProjectChatIds) {
    try {
      await fetch("/api/conversations", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatId,
          ...(isAuthenticated ? {} : { guestId }),
        }),
      });
    } catch {
      // Keep the UI cleanup stable even if one saved chat delete fails.
    }
  }

  setProjectSpaces((currentProjects) =>
    currentProjects.filter((item) => item.id !== project.id)
  );

  setProjectChats((currentProjectChats) => {
    const nextProjectChats = { ...currentProjectChats };
    delete nextProjectChats[project.id];
    return nextProjectChats;
  });

  if (activeProject?.id === project.id) {
    const newChatId = getGuestSidebarChatId(
      guestAccess?.plan,
      crypto.randomUUID()
    );

    setActiveProject(null);
    setProjectHomeOpen(false);
    setActiveChatId(newChatId);
    localStorage.setItem("virtus_chat_id", newChatId);
    setConversation([]);
    setMessage("");
    setReply("");
    setStreamingReply("");
    setEditingIndex(null);
    setEditingText("");
    setIsPracticeMode(null);
  }
}
async function handleDeleteChat(chatId, options = {}) {
  if (!chatId) return;

  if (!options.skipConfirm) {
    const confirmed = await askVirtusConfirm("Delete this chat?");
    if (!confirmed) return;
  }

  const guestId =
    localStorage.getItem("virtus_guest_id") || crypto.randomUUID();

  localStorage.setItem("virtus_guest_id", guestId);

  try {
    const response = await fetch("/api/conversations", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chatId,
        ...(isAuthenticated ? {} : { guestId }),
      }),
    });

    const data = await response.json();


    if (!response.ok) {
      alert(data.error || "Chat delete failed.");
      return;
    }

    if (options.projectId) {
      const removeDeletedChat = (chats) =>
        (Array.isArray(chats) ? chats : []).filter(
          (item) => item.chatId !== chatId
        );

      const sourceProject =
        activeProject?.id === options.projectId
          ? activeProject
          : projectSpaces.find((project) => project.id === options.projectId);

      const updatedProject = sourceProject
        ? {
            ...sourceProject,
            chats: removeDeletedChat(sourceProject.chats),
          }
        : null;

      setProjectChats((currentProjectChats) => ({
        ...currentProjectChats,
        [options.projectId]: removeDeletedChat(currentProjectChats[options.projectId]),
      }));

      if (updatedProject) {
        setActiveProject((currentActiveProject) =>
          currentActiveProject?.id === options.projectId
            ? updatedProject
            : currentActiveProject
        );

        setProjectSpaces((currentProjects) =>
          currentProjects.map((project) =>
            project.id === options.projectId ? updatedProject : project
          )
        );

        void saveProjectSpaceToApi(updatedProject);
      }
    } else {
      setRecentConversations((currentChats) =>
        currentChats.filter((item) => item.id !== chatId)
      );

      if (!isAuthenticated) {
        try {
          const storedGuestChats = JSON.parse(
            localStorage.getItem("virtus_guest_recent_chats") || "[]"
          );

          if (Array.isArray(storedGuestChats)) {
            localStorage.setItem(
              "virtus_guest_recent_chats",
              JSON.stringify(storedGuestChats.filter((item) => item.id !== chatId))
            );
          }
        } catch {
          localStorage.removeItem("virtus_guest_recent_chats");
        }
      }
    }

    if (activeChatId === chatId) {
      const newChatId = getGuestSidebarChatId(
        guestAccess?.plan,
        crypto.randomUUID()
      );

      localStorage.setItem("virtus_chat_id", newChatId);
      setActiveChatId(newChatId);
      setActiveProject(null);
      setProjectHomeOpen(false);
      setConversation([]);
      setMessage("");
      setReply("");
      setStreamingReply("");
      setLoading(false);
    }
  } catch (error) {
    alert(error.message || "Chat delete failed.");
  }
}

async function handleFileUpload(event) {
  const files = Array.from(event.target.files || []);
  if (files.length === 0) return;

  setUploadingFile(true);

  let successCount = 0;
  let lastUploadedFile = null;
  const uploadedFilesForChat = [];
  const failedFiles = [];

  try {
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];

      setFileNotice(
        files.length === 1
          ? `Uploading ${file.name}...`
          : `Uploading ${index + 1} of ${files.length}: ${file.name}`
      );

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        const message =
          data.error === "Not authenticated"
            ? "Sign in required to upload documents."
            : data.error || "File upload failed.";

        failedFiles.push(`${file.name}: ${message}`);
        continue;
      }

      successCount += 1;

      if (data.file?.id) {
        lastUploadedFile = data.file;

        if (files.length <= 10) {
          uploadedFilesForChat.push(data.file);
        }
      }
    }

    await loadUploadedFiles();

    if (uploadedFilesForChat.length > 0) {
      setActiveFile(lastUploadedFile);

      setActiveFiles((currentFiles) => {
        const existingIds = new Set(
          currentFiles.map((item) => item.id).filter(Boolean)
        );

        const newFiles = uploadedFilesForChat.filter(
          (item) => item?.id && !existingIds.has(item.id)
        );

        return [...currentFiles, ...newFiles];
      });
    }

    if (failedFiles.length > 0) {
      setFileNotice(
        `Uploaded ${successCount} of ${files.length} files. Failed: ${failedFiles[0]}`
      );
    } else if (files.length === 1) {
      setFileNotice("");
    } else if (files.length <= 10) {
      setFileNotice(`Uploaded and attached ${successCount} files successfully.`);
    } else {
      setFileNotice(
        `Uploaded ${successCount} files successfully. They were saved to the Document Library.`
      );
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
async function sendMessage(overrideMessage = null, overridePracticeMode = null, options = {}) {
  const sendOptions = options || {};
  const messageToSend =
    typeof overrideMessage === "string" ? overrideMessage : message;
  const practiceModeForRequest = overridePracticeMode ?? isPracticeMode;
  const forceNoProject = sendOptions.forceNoProject === true;
  const shouldStartFreshChat = sendOptions.startFreshChat === true;
  const shouldHideFromRecent = sendOptions.hideFromRecent === true;
  const explicitChatId =
    typeof sendOptions.chatId === "string" && sendOptions.chatId.trim()
      ? sendOptions.chatId.trim()
      : "";

  if (!messageToSend.trim()) return;
  stopVirtusVoice();

  setEditingIndex(null);
  setEditingText("");
  const isStartingNewProjectChat =
    !forceNoProject && !!activeProject?.id && projectHomeOpen;
  const chatIdForRequest = isStartingNewProjectChat
    ? crypto.randomUUID()
    : explicitChatId || (shouldStartFreshChat ? crypto.randomUUID() : activeChatId);

  if (isStartingNewProjectChat || shouldStartFreshChat || explicitChatId) {
    localStorage.setItem("virtus_chat_id", chatIdForRequest);
    setActiveChatId(chatIdForRequest);
    setProjectHomeOpen(false);
  }

  setConversation((prev) => {
    const cleaned = isStartingNewProjectChat || shouldStartFreshChat ? [] : [...prev];

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
        text: messageToSend,
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

const userMessage = `${messageToSend}${attachedFileText}`;
const shouldGenerateImageDirectly = isImageCreationRequest(messageToSend);

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
          title: getGeneratedDocumentTitle(messageToSend),
          content: messageToSend,
          fileName: getGeneratedDocumentTitle(messageToSend),
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
  chatId: chatIdForRequest,
  practiceMode: practiceModeForRequest,
  activeProjectId: forceNoProject ? null : activeProject?.id || null,
  activeProjectTitle: forceNoProject ? null : activeProject?.title || null,
  hideFromSidebar: sendOptions.hideFromSidebar === true,
  sessionTitle: sendOptions.sessionTitle || null,
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



                if (chatIdForRequest && !shouldHideFromRecent) {
          setRecentConversations((prev) => {
            const resolvedPlan =
              !isAuthenticated && data.access ? data.access.plan : guestAccess?.plan;

            const resolvedSidebarChatId =
              !isAuthenticated
                ? getGuestSidebarChatId(resolvedPlan, chatIdForRequest)
                : chatIdForRequest;

            const existingItem = prev.find(
              (item) => item.id === resolvedSidebarChatId
            );

            const existingTitle = existingItem?.title?.trim() || "";
            const normalizedExistingTitle = existingTitle.toLowerCase();

            const existingTitleIsWeak =
              !existingTitle ||
              normalizedExistingTitle === "new chat" ||
              normalizedExistingTitle === "file workspace" ||
              normalizedExistingTitle === "executive file studio" ||
              normalizedExistingTitle.startsWith("uploaded file:");

            const newItemTitle = existingTitleIsWeak
              ? userMessage.includes("File ID:")
                ? "Executive File Studio"
                : userMessage.trim().slice(0, 60) || "New chat"
              : existingTitle;

            const newItem = {
              id: resolvedSidebarChatId,
              title: newItemTitle,
            };

            
            if (activeProject?.id) {
              const nextProjectChat = {
                chatId: resolvedSidebarChatId,
                title: newItemTitle,
                createdAt: new Date().toISOString(),
              };

              const currentProjectChats = Array.isArray(activeProject.chats)
                ? activeProject.chats
                : [];

              const nextProject = {
                ...activeProject,
                chats: [
                  nextProjectChat,
                  ...currentProjectChats.filter(
                    (chat) => chat.chatId !== resolvedSidebarChatId
                  ),
                ],
              };

              setActiveProject(nextProject);
              setProjectSpaces((prevProjects) =>
                prevProjects.map((project) =>
                  project.id === nextProject.id ? nextProject : project
                )
              );
              void saveProjectSpaceToApi(nextProject);
            }

            if (activeProject?.id) {
              return prev;
            }


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
  const fallbackTitle = "Virtus Document";

  const rawLines = String(text || "").split("\n");

  const cleanedLines = rawLines
    .map((line) => {
      const original = line.trim();

      const clean = original
        .replace(/^[-*]\s+/, "")
        .replace(/^\d+[.)]\s+/, "")
        .replace(/[#*_`]/g, "")
        .trim();

      const isBullet =
        /^[-*]\s+/.test(original) || /^\d+[.)]\s+/.test(original);

      return {
        original,
        clean,
        lower: clean.toLowerCase(),
        wordCount: clean.split(/\s+/).filter(Boolean).length,
        isBullet,
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
      lower === "training proposal" ||
      lower === "board document" ||
      lower === "board summary" ||
      lower === "board-ready document" ||
      lower === "document" ||
      lower === "report"
    );
  };

  const isConversationalOpening = (line) => {
    const lower = line.lower.replace(/^sir sebastian,\s*/, "");

    return (
      lower.startsWith("yes") ||
      lower.startsWith("here is") ||
      lower.startsWith("here's") ||
      lower.startsWith("certainly") ||
      lower.startsWith("of course") ||
      lower.startsWith("i prepared") ||
      lower.startsWith("i have prepared") ||
      lower.startsWith("below is") ||
      lower.includes("based on the document") ||
      lower.includes("based on the file") ||
      lower.includes("based on module")
    );
  };

  const realLines = cleanedLines.filter((line) => {
    return !isGenericTitle(line) && !isConversationalOpening(line);
  });

  const labeledTitle = realLines.find((line) => {
    return (
      !line.isBullet &&
      line.wordCount <= 12 &&
      (line.lower.startsWith("proposal:") ||
        line.lower.startsWith("program:") ||
        line.lower.startsWith("title:") ||
        line.lower.startsWith("document title:"))
    );
  });

  if (labeledTitle?.clean) {
    return labeledTitle.clean
      .replace(/^proposal:\s*/i, "")
      .replace(/^program:\s*/i, "")
      .replace(/^title:\s*/i, "")
      .replace(/^document title:\s*/i, "")
      .trim();
  }

  const markdownHeading = realLines.find((line) => {
    return (
      !line.isBullet &&
      line.wordCount <= 12 &&
      (line.original.startsWith("# ") ||
        line.original.startsWith("## ") ||
        line.original.startsWith("### "))
    );
  });

  const firstStrongTitleLine = realLines.find((line, index) => {
    return (
      !line.isBullet &&
      index <= 5 &&
      line.wordCount <= 8 &&
      /^[A-Z0-9][A-Za-z0-9&.,:()\/ -]{2,90}$/.test(line.original) &&
      !line.lower.includes("training") &&
      !line.lower.includes("integrates")
    );
  });

  const strongerTitle = realLines.find((line) => {
    return (
      !line.isBullet &&
      line.wordCount <= 10 &&
      (line.lower.includes("report") ||
        line.lower.includes("plan") ||
        line.lower.includes("proposal") ||
        line.lower.includes("blueprint") ||
        line.lower.includes("summary document"))
    );
  });

  const firstNonBulletShortLine = realLines.find((line) => {
    return !line.isBullet && line.wordCount <= 10;
  });

  return (
    markdownHeading?.clean ||
    firstStrongTitleLine?.clean ||
    strongerTitle?.clean ||
    firstNonBulletShortLine?.clean ||
    fallbackTitle
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
          <span className="text-xs font-semibold text-sky-300">Copied</span>
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
        className={`${iconClass} hidden md:flex`}
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

       {canCreateFiles ? (
        <>
          <div className="hidden md:flex md:items-center md:gap-3">
       <button
        type="button"
        title="Create Word file"
        disabled={!!creatingFileType}
        onClick={async () => {
          if (!beginFileCreation("DOCX")) return;

          try {
            const documentTitle = getGeneratedDocumentTitle(item.text);

            await handleCreateDocxFile({
              title: documentTitle,
              content: item.text || "",
              fileName: documentTitle,
            });
          } finally {
            endFileCreation();
          }
        }}
        className={iconClass}
        aria-label="Create Word document from Virtus answer"
      >
        <span className="inline-flex min-w-[34px] items-center justify-center text-[10px] font-semibold tracking-wide">
          {creatingFileType === "DOCX" ? (
            <span className="h-3 w-3 animate-spin rounded-full border border-sky-300 border-t-transparent" />
          ) : (
            "DOCX"
          )}
        </span>
      </button>

      <button
        type="button"
        title="Create PDF file"
        disabled={!!creatingFileType}
        onClick={async () => {
          if (!beginFileCreation("PDF")) return;

          try {
            const documentTitle = getGeneratedDocumentTitle(item.text);

            await handleCreatePdfFile({
              title: documentTitle,
              content: item.text || "",
              fileName: documentTitle,
            });
          } finally {
            endFileCreation();
          }
        }}
        className={iconClass}
        aria-label="Create PDF document from Virtus answer"
      >
        <span className="inline-flex min-w-[28px] items-center justify-center text-[10px] font-semibold tracking-wide">
          {creatingFileType === "PDF" ? (
            <span className="h-3 w-3 animate-spin rounded-full border border-sky-300 border-t-transparent" />
          ) : (
            "PDF"
          )}
        </span>
      </button>

      <button
        type="button"
        title="Create PowerPoint file"
        disabled={!!creatingFileType}
        onClick={async () => {
          if (!beginFileCreation("PPTX")) return;

          try {
            const documentTitle = getGeneratedDocumentTitle(item.text);

            await handleCreatePptxFile({
              title: documentTitle,
              content: item.text || "",
              fileName: documentTitle,
            });
          } finally {
            endFileCreation();
          }
        }}
        className={iconClass}
        aria-label="Create PowerPoint presentation from Virtus answer"
      >
        <span className="inline-flex min-w-[34px] items-center justify-center text-[10px] font-semibold tracking-wide">
          {creatingFileType === "PPTX" ? (
            <span className="h-3 w-3 animate-spin rounded-full border border-sky-300 border-t-transparent" />
          ) : (
            "PPTX"
          )}
        </span>
      </button>

      <button
        type="button"
        title="Create image file"
        disabled={!!creatingFileType}
        onClick={async () => {
          if (!beginFileCreation("IMAGE")) return;

          try {
            const documentTitle = getGeneratedDocumentTitle(item.text);

            const userImageRequest = conversation[index - 1]?.role === "user"
              ? conversation[index - 1]?.text || ""
              : item.text || "";

            await handleCreateImageFile({
              title: documentTitle,
              content: userImageRequest,
              fileName: documentTitle,
            });
          } finally {
            endFileCreation();
          }
        }}
        className={iconClass}
        aria-label="Create image from Virtus answer"
      >
        <span className="inline-flex min-w-[40px] items-center justify-center text-[10px] font-semibold tracking-wide">
          {creatingFileType === "IMAGE" ? (
            <span className="h-3 w-3 animate-spin rounded-full border border-sky-300 border-t-transparent" />
          ) : (
            "IMAGE"
          )}
        </span>
      </button>
          </div>
        </>
      ) : (
        <button
          type="button"
          title="Upgrade to create files"
          onClick={() => {
            setMessage("File creation is part of Plus and Premium. Upgrade to create Word, PDF, PowerPoint, and image files directly from Virtus answers. Free accounts can continue using chat normally.");
            textareaRef.current?.focus();
          }}
          className={iconClass}
          aria-label="Upgrade to create files"
        >
          <span className="text-[10px] font-semibold tracking-wide">LOCKED</span>
        </button>
      )}

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
        <span className="text-lg leading-none">...</span>
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
            <span className="text-sky-300">Read</span>
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
            <span className="text-sky-300">M</span>
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
            <span className="text-sky-300">F</span>
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
                <span className="text-red-300">Stop</span>
                <span>Stop reading</span>
              </button>
            </>
          )}
          {canCreateFiles && (
            <div className="md:hidden">
              <div className="my-2 h-px bg-sky-900/20" />

              {[
                ["DOCX", "Create Word document"],
                ["PDF", "Create PDF"],
                ["PPTX", "Create PowerPoint"],
                ["IMAGE", "Create image"],
              ].map(([fileType, label]) => (
                <button
                  key={fileType}
                  type="button"
                  disabled={!!creatingFileType}
                  onClick={async () => {
                    setOpenMessageMenuIndex(null);
                    if (!beginFileCreation(fileType)) return;

                    try {
                      const documentTitle = getGeneratedDocumentTitle(item.text);

                      if (fileType === "DOCX") {
                        await handleCreateDocxFile({
                          title: documentTitle,
                          content: item.text || "",
                          fileName: documentTitle,
                        });
                      }

                      if (fileType === "PDF") {
                        await handleCreatePdfFile({
                          title: documentTitle,
                          content: item.text || "",
                          fileName: documentTitle,
                        });
                      }

                      if (fileType === "PPTX") {
                        await handleCreatePptxFile({
                          title: documentTitle,
                          content: item.text || "",
                          fileName: documentTitle,
                        });
                      }

                      if (fileType === "IMAGE") {
                        const userImageRequest =
                          conversation[index - 1]?.role === "user"
                            ? conversation[index - 1]?.text || ""
                            : item.text || "";

                        await handleCreateImageFile({
                          title: documentTitle,
                          content: userImageRequest,
                          fileName: documentTitle,
                        });
                      }
                    } finally {
                      endFileCreation();
                    }
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-sky-950/35 disabled:opacity-60"
                >
                  <span className="text-sky-300">{fileType === "IMAGE" ? "IMG" : fileType}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
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
  className="virtus-chat-root h-[100dvh] md:h-screen overflow-hidden bg-zinc-900 text-zinc-100"
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

{confirmDialog && (
  <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
    <div className="w-full max-w-sm rounded-3xl border border-sky-900/35 bg-zinc-950/95 p-5 shadow-2xl shadow-sky-950/30">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-sky-300/60">
        Virtus confirmation
      </p>
      <p className="mt-3 text-base font-medium text-zinc-100">
        {confirmDialog.message}
      </p>

      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            confirmDialog.resolve(false);
            setConfirmDialog(null);
          }}
          className="rounded-full border border-zinc-800 bg-zinc-950/70 px-4 py-2 text-sm text-zinc-300 transition hover:border-sky-900/35 hover:bg-zinc-900"
        >
          No
        </button>

        <button
          type="button"
          onClick={() => {
            confirmDialog.resolve(true);
            setConfirmDialog(null);
          }}
          className="rounded-full border border-sky-700/50 bg-sky-950/50 px-4 py-2 text-sm font-medium text-sky-100 transition hover:border-sky-500/70 hover:bg-sky-900/60"
        >
          Yes
        </button>
      </div>
    </div>
  </div>
)}

 <div className="flex h-full">
        <aside className="hidden md:flex md:w-72 bg-gradient-to-b from-zinc-950 via-sky-950/10 to-black border-r border-sky-900/25 h-full flex-col shadow-[inset_-1px_0_0_rgba(14,165,233,0.12)]">
          <div className="px-4 pt-4 pb-3 border-b border-sky-900/20 bg-black/20 flex justify-center">
  <img
    src="/virtus-logo.png"
    alt="Virtus AI logo"
    className="block w-[190px] h-auto object-contain"
  />
</div>

                    <div className="virtus-scrollbar flex-1 overflow-y-auto overflow-x-hidden p-3">
            <div className="grid grid-cols-5 gap-2">
              <button
                type="button"
                aria-label="Search"
                onClick={() => { setSearchOpen(!searchOpen); setProjectsOpen(false); setPracticeOpen(false); setCaptureOpen(false); }}
                className="group relative flex h-11 items-center justify-center rounded-2xl border border-sky-900/30 bg-sky-950/10 text-sky-100 shadow-sm shadow-sky-950/20 backdrop-blur-sm transition hover:border-sky-700/50 hover:bg-sky-950/25 hover:shadow-sky-900/10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
                <span className="pointer-events-none absolute left-1/2 top-[calc(100%+8px)] z-50 -translate-x-1/2 whitespace-nowrap rounded-xl border border-sky-900/35 bg-zinc-950/95 px-3 py-1 text-xs font-medium text-sky-100 opacity-0 shadow-lg shadow-sky-950/30 backdrop-blur-sm transition group-hover:opacity-100">Search</span>
              </button>

              <button
                type="button"
                aria-label="Projects"
                onClick={() => {
                  const nextState = !projectsOpen;
                  setProjectsOpen(nextState);
                  setSearchOpen(false);
                  setPracticeOpen(false);
                  setCaptureOpen(false);
                  if (!nextState) { setProjectHomeOpen(false); setActiveProject(null); }
                }}
                className="group relative flex h-11 items-center justify-center rounded-2xl border border-sky-900/30 bg-sky-950/10 text-sky-100 shadow-sm shadow-sky-950/20 backdrop-blur-sm transition hover:border-sky-700/50 hover:bg-sky-950/25 hover:shadow-sky-900/10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M3 7h6l2 2h10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" /><path d="M3 7V5a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v2" /></svg>
                <span className="pointer-events-none absolute left-1/2 top-[calc(100%+8px)] z-50 -translate-x-1/2 whitespace-nowrap rounded-xl border border-sky-900/35 bg-zinc-950/95 px-3 py-1 text-xs font-medium text-sky-100 opacity-0 shadow-lg shadow-sky-950/30 backdrop-blur-sm transition group-hover:opacity-100">Projects</span>
              </button>

              <button
                type="button"
                aria-label="New Chat"
                onClick={() => {
                  if (loading) { abortControllerRef.current?.abort(); }
                  stopVirtusVoice();
                  abortControllerRef.current = null;
                  const newChatId = getGuestSidebarChatId(guestAccess?.plan, crypto.randomUUID());
                  localStorage.setItem("virtus_chat_id", newChatId);
                  setActiveChatId(newChatId);
                  setActiveProject(null);
                  setProjectHomeOpen(false);
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
                }}
                className="group relative flex h-11 items-center justify-center rounded-2xl border border-sky-900/30 bg-sky-950/10 text-sky-100 shadow-sm shadow-sky-950/20 backdrop-blur-sm transition hover:border-sky-700/50 hover:bg-sky-950/25 hover:shadow-sky-900/10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
                <span className="pointer-events-none absolute left-1/2 top-[calc(100%+8px)] z-50 -translate-x-1/2 whitespace-nowrap rounded-xl border border-sky-900/35 bg-zinc-950/95 px-3 py-1 text-xs font-medium text-sky-100 opacity-0 shadow-lg shadow-sky-950/30 backdrop-blur-sm transition group-hover:opacity-100">New Chat</span>
              </button>

              <button
                type="button"
                aria-label="Capture"
                onClick={() => {
                  setCaptureOpen(!captureOpen);
                  setSearchOpen(false);
                  setProjectsOpen(false);
                  setPracticeOpen(false);
                }}
                className="group relative flex h-11 items-center justify-center rounded-2xl border border-sky-900/30 bg-sky-950/10 text-sky-100 shadow-sm shadow-sky-950/20 backdrop-blur-sm transition hover:border-sky-700/50 hover:bg-sky-950/25 hover:shadow-sky-900/10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M7 3h8l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M14 3v5h5" /><path d="M9 13h6" /><path d="M9 17h4" /></svg>
                <span className="pointer-events-none absolute left-1/2 top-[calc(100%+8px)] z-50 -translate-x-1/2 whitespace-nowrap rounded-xl border border-sky-900/35 bg-zinc-950/95 px-3 py-1 text-xs font-medium text-sky-100 opacity-0 shadow-lg shadow-sky-950/30 backdrop-blur-sm transition group-hover:opacity-100">Capture</span>
              </button>

              <button
                type="button"
                aria-label="Practices"
                onClick={() => {
                  setPracticeOpen(!practiceOpen);
                  setSearchOpen(false);
                  setProjectsOpen(false);
                  setCaptureOpen(false);
                }}
                className="group relative flex h-11 items-center justify-center rounded-2xl border border-sky-900/30 bg-sky-950/10 text-sky-100 shadow-sm shadow-sky-950/20 backdrop-blur-sm transition hover:border-sky-700/50 hover:bg-sky-950/25 hover:shadow-sky-900/10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /><path d="M12 2v3" /><path d="M12 19v3" /><path d="M2 12h3" /><path d="M19 12h3" /></svg>
                <span className="pointer-events-none absolute left-1/2 top-[calc(100%+8px)] z-50 -translate-x-1/2 whitespace-nowrap rounded-xl border border-sky-900/35 bg-zinc-950/95 px-3 py-1 text-xs font-medium text-sky-100 opacity-0 shadow-lg shadow-sky-950/30 backdrop-blur-sm transition group-hover:opacity-100">Practices</span>
              </button>
            </div>

            {captureOpen && renderCapturePanel()}

            {searchOpen && (
              <div className="mt-3 rounded-2xl border border-sky-900/20 bg-zinc-950/45 p-3 shadow-sm shadow-sky-950/10">
                <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-sky-300/60">
                  Search Chats
                </p>
                <input
                  value={chatSearchQuery}
                  onChange={(event) => setChatSearchQuery(event.target.value)}
                  placeholder="Search recent chats..."
                  className="w-full rounded-xl border border-sky-900/25 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-sky-700/50"
                />
              </div>
            )}
            {projectsOpen && (
              <div className="mt-3 rounded-2xl border border-sky-900/20 bg-zinc-950/45 p-3 shadow-sm shadow-sky-950/10">
                <button
                  type="button"
                  onClick={() => {
                    if (!canStartNewProject()) return;
                    setShowProjectInput(true);
                  }}
                  className="w-full rounded-xl border border-sky-900/25 bg-sky-950/20 px-3 py-2 text-left text-sm text-sky-100 transition hover:border-sky-700/40 hover:bg-sky-950/35"
                >
                  + Project
                </button>

                {showProjectInput && (
                  <input
                    value={newProjectTitle}
                    onChange={(event) => setNewProjectTitle(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter") return;

                      const cleanTitle = newProjectTitle.trim();

                      if (!cleanTitle) return;

                      const projectId = `project-${cleanTitle
                        .toLowerCase()
                        .replace(/\s+/g, "-")
                        .replace(/[^a-z0-9-]/g, "")
                        .replace(/-+/g, "-")
                        .replace(/^-|-$/g, "")}-${crypto.randomUUID().slice(0, 8)}`;

                      const nextProject = {
                        id: projectId,
                        title: cleanTitle,
                        chatId: crypto.randomUUID(),
                      };
                        chats: [],

                      upsertProjectSpaceState(nextProject);
                      void saveProjectSpaceToApi(nextProject);
                      setActiveProject(nextProject);
                      setProjectHomeOpen(true);
                      setNewProjectTitle("");
                      setShowProjectInput(false);
                    }}
                    placeholder="Project name..."
                    className="mt-2 w-full rounded-xl border border-sky-900/25 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-sky-700/50"
                    autoFocus
                  />
                )}

                <div className="mt-3 space-y-2">
                  {projectSpaces.map((project) => (
                    <div
                      key={project.id}
                      className={`group flex items-center gap-2 rounded-xl border pr-2 transition ${
                        activeProject?.id === project.id
                          ? "border-sky-700/40 bg-sky-950/25 text-sky-100"
                          : "border-sky-900/15 bg-zinc-950/35 text-zinc-300 hover:border-sky-800/35 hover:bg-zinc-950/55"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          const projectChatId = project.chatId || crypto.randomUUID();
                          const nextProject = {
                            ...project,
                            chatId: projectChatId,
                          };

                          setActiveProject(nextProject);
                          setProjectSpaces((prev) =>
                            prev.map((savedProject) =>
                              savedProject.id === project.id ? nextProject : savedProject
                            )
                          );
                          void saveProjectSpaceToApi(nextProject);

                          localStorage.setItem("virtus_chat_id", projectChatId);
                          setActiveChatId(projectChatId);
                          setConversation([]);
                          setMessage("");
                          setReply("");
                          setStreamingReply("");
                          setEditingIndex(null);
                          setEditingText("");
                          setIsPracticeMode(null);
                          setShouldAutoScroll(true);
                          setProjectHomeOpen(true);
                        }}
                        className="min-w-0 flex-1 px-3 py-2 text-left text-sm"
                      >
                        <span className="block truncate">{project.title}</span>
                      </button>

                      <button
                        type="button"
                        aria-label="Delete project"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDeleteProject(project);
                        }}
                        className="group relative overflow-visible flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-zinc-500 opacity-70 transition hover:bg-red-950/30 hover:text-red-200 group-hover:opacity-100"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="h-3.5 w-3.5"
                        >
                          <circle cx="5" cy="12" r="1.5" />
                          <circle cx="12" cy="12" r="1.5" />
                          <circle cx="19" cy="12" r="1.5" />
                        </svg>
                        <span className="pointer-events-none absolute left-1/2 top-[calc(100%+8px)] z-50 -translate-x-1/2 whitespace-nowrap rounded-xl border border-sky-900/35 bg-zinc-950/95 px-3 py-1 text-xs font-medium text-sky-100 opacity-0 shadow-lg shadow-sky-950/30 backdrop-blur-sm transition duration-150 group-hover:opacity-100">Delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {practiceOpen && (
              <div className="virtus-practice-panel mt-3 max-h-[420px] space-y-2 overflow-y-auto rounded-2xl border border-sky-900/20 p-2 no-scrollbar">
                <p className="px-3 pt-2 text-[11px] font-medium uppercase tracking-[0.18em] text-sky-300/50">
                  Practice Categories
                </p>

                {renderGuidedPracticeAssessment()}

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
                          setMessage(getLockedPracticeCategoryMessage(category, requiredPlan));
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
                          ? "virtus-practice-item border-sky-900/10 hover:border-sky-800/30"
                          : "virtus-practice-item-locked border-zinc-800/70 opacity-75 hover:border-sky-900/20"
                      }`}
                    >
                      <span className="block font-medium">
                        {category.title}
                      </span>

                      <span className="mt-0.5 block text-sm leading-6 virtus-practice-description">
                        {category.description}
                      </span>

                      {accessLabel && (
                        <span className="virtus-practice-badge mt-1 inline-flex rounded-full border border-sky-900/25 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em]">
                          {accessLabel}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mt-6">
<div className="mb-2 flex items-center justify-between px-2">
  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-sky-300/50">
    {chatSearchQuery.trim() ? "Search Results" : "Recent"}
  </p>

  {!chatSearchQuery.trim() && recentConversations.length > 0 && (
    <button
      type="button"
      aria-label="Delete all recent chats"
      onClick={async () => {
        const confirmed = await askVirtusConfirm("Delete all recent chats?");
        if (!confirmed) return;

        const chatsToDelete = recentConversations.filter((item) => item?.id);

        setRecentConversations([]);
        localStorage.removeItem("virtus_guest_recent_chats");

        await Promise.allSettled(
          chatsToDelete.map((chat) =>
            handleDeleteChat(chat.id, { skipConfirm: true, silent: true })
          )
        );
      }}
      className="group relative flex h-7 w-7 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-red-950/30 hover:text-red-200"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-3.5 w-3.5"
      >
        <circle cx="5" cy="12" r="1.5" />
        <circle cx="12" cy="12" r="1.5" />
        <circle cx="19" cy="12" r="1.5" />
      </svg>

      <span className="pointer-events-none absolute left-1/2 top-[calc(100%+8px)] z-50 -translate-x-1/2 whitespace-nowrap rounded-xl border border-sky-900/35 bg-zinc-950/95 px-3 py-1 text-xs font-medium text-sky-100 opacity-0 shadow-lg shadow-sky-950/30 backdrop-blur-sm transition group-hover:opacity-100">
        Delete all
      </span>
    </button>
  )}
</div>

  <div className="space-y-2">
  {recentConversations.filter((item) => {
    const title = item?.title?.trim().toLowerCase() || "";
        const searchTerm = chatSearchQuery.trim().toLowerCase();

        return (
          item?.id &&
          title &&
          title !== "new chat" &&
          title !== "file workspace" &&
          title !== "executive file studio" &&
          !title.startsWith("uploaded file:") &&
          !title.startsWith("create a personalized guided") &&
          !title.startsWith("guided practice -") &&
          (!searchTerm || title.includes(searchTerm))
        );
  }).length === 0 ? (
    <div className="rounded-xl px-3 py-2 text-sm text-zinc-400 bg-zinc-900/60 border border-zinc-800">
      Recent conversations will appear here
    </div>
  ) : (
    recentConversations
      .filter((item) => {
        const title = item?.title?.trim().toLowerCase() || "";
        const searchTerm = chatSearchQuery.trim().toLowerCase();

        return (
          item?.id &&
          title &&
          title !== "new chat" &&
          title !== "file workspace" &&
          title !== "executive file studio" &&
          !title.startsWith("uploaded file:") &&
          !title.startsWith("create a personalized guided") &&
          !title.startsWith("guided practice -") &&
          (!searchTerm || title.includes(searchTerm))
        );
      })
      .map((item) => (
  
                    <div
                      key={item.id}
                      className="group flex items-center gap-2 rounded-2xl border border-sky-900/15 bg-zinc-950/30 pr-2 text-zinc-200 transition hover:border-sky-800/35 hover:bg-zinc-950/55"
                    >
                      <button
                        type="button"
                        onClick={async () => {
                        const guestId =
                          localStorage.getItem("virtus_guest_id") ||
                          crypto.randomUUID();

                        localStorage.setItem("virtus_guest_id", guestId);

                        abortControllerRef.current?.abort();
                        stopVirtusVoice();
                        abortControllerRef.current = null;

                        setShouldAutoScroll(true);
                        setMessage("");
                        setReply("");
                        setStreamingReply("");
                        setEditingIndex(null);
                        setEditingText("");
                        setIsPracticeMode(null);
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
                        className="min-w-0 flex-1 px-3 py-2 text-left text-sm"
                    >
                        <span className="block truncate">{item.title}</span>
                      </button>

                      <button
                        type="button"
                        aria-label="Delete chat"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDeleteChat(
                            getGuestSidebarChatId(guestAccess?.plan, item.id)
                          );
                        }}
                        className="group relative overflow-visible flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-zinc-500 opacity-70 transition hover:bg-red-950/30 hover:text-red-200 group-hover:opacity-100"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="h-3.5 w-3.5"
                        >
                          <circle cx="5" cy="12" r="1.5" />
                          <circle cx="12" cy="12" r="1.5" />
                          <circle cx="19" cy="12" r="1.5" />
                        </svg>
                        <span className="pointer-events-none absolute left-1/2 top-[calc(100%+8px)] z-50 -translate-x-1/2 whitespace-nowrap rounded-xl border border-sky-900/35 bg-zinc-950/95 px-3 py-1 text-xs font-medium text-sky-100 opacity-0 shadow-lg shadow-sky-950/30 backdrop-blur-sm transition duration-150 group-hover:opacity-100">Delete</span>
                      </button>
                    </div>
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
  className="relative flex-1 min-w-0 flex justify-center bg-zinc-900"
  onWheel={(e) => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollTop += e.deltaY;
  }}
>
          <div className="w-full h-full flex flex-col">
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
            subtitle: "3-day premium-style sample",
            bullets: [
              "A strong preview of the deeper Virtus experience",
              "Good for testing reflection, planning, and pattern awareness",
              "Keeps short-term continuity during the trial",
              "After the trial, create an account to keep using Virtus",
            ],
          },
          {
            title: "Free",
            subtitle: "$0 entry account",
            bullets: [
              "Saved chats for basic continuity",
              "Light guidance for practical questions and daily reflection",
              "Standard usage for simple support",
              "Best for trying Virtus before upgrading",
            ],
          },
          {
            title: "Plus",
            subtitle: "$19/month or $15.99/month yearly",
            bullets: [
              "Stronger personal coaching and emotional support",
              "Better memory and continuity across chats",
              "More guided help with decisions, habits, and self-discipline",
              "Includes support for up to 3 project spaces",
            ],
          },
          {
            title: "Premium / Virtus Prime",
            subtitle: "$49/month or $44.99/month yearly",
            bullets: [
              "Deepest strategic and executive guidance",
              "Strongest personalization, correction, and continuity",
              "Best for leadership, coaching, projects, and long-term transformation",
              "Includes advanced support for up to 50 project spaces",
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
<div className="virtus-chat-clear-bar virtus-theme-card-soft relative z-[9999] border-b border-sky-900/20 px-3 py-3 backdrop-blur-sm md:px-4 md:py-3">
  <div className="flex min-h-[44px] items-center gap-4">
<div className="md:hidden">
  <button
    type="button"
    onClick={() => setShowMobileMenu(true)}
    className="virtus-theme-card flex items-center gap-2 rounded-2xl border border-sky-900/20 px-2 py-1.5 text-sky-700 shadow-sm shadow-sky-950/10 transition hover:border-sky-800/40 hover:bg-sky-950/10"
    aria-label="Open Virtus menu"
  >
    <img
      src="/virtus-logo.png"
      alt="Virtus AI"
      className="h-7 w-auto object-contain"
    />
  </button>
</div>
{activeProject?.id && !projectHomeOpen && (
  <button
    type="button"
    onClick={() => {
      setProjectHomeOpen(true);
      setConversation([]);
      setMessage("");
      setReply("");
      setStreamingReply("");
      setLoading(false);
    }}
    className="md:hidden rounded-2xl border border-sky-900/30 bg-sky-950/20 px-3 py-2 text-xs font-medium text-sky-100"
  >
    Back
  </button>
)}


<div className="hidden min-w-0 flex-1 items-center justify-start md:flex">
  <img
    src="/virtus-logo.png"
    alt="Virtus AI"
    className="h-8 w-auto object-contain"
  />
</div>

    {showMobileMenu && (
      <div
        className="virtus-mobile-overlay fixed inset-0 z-[99999] md:hidden"
        onClick={() => setShowMobileMenu(false)}
      >
        <div
          className="virtus-mobile-panel h-full w-full p-5 text-sm"
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
        x
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
                setActiveProject(null);
                setProjectHomeOpen(false);
                setConversation([]);
                setShowMobileMenu(false);
              }}
              className="virtus-mobile-menu-item w-full rounded-2xl px-3 py-3 text-left transition"
            >
              + New chat
            </button>

            <button
              type="button"
              onClick={() => {
                setProjectsOpen(!projectsOpen);
                setPracticeOpen(false);
                setSearchOpen(false);
                setCaptureOpen(false);
              }}
              className="virtus-mobile-menu-item w-full rounded-2xl px-3 py-3 text-left transition"
            >
              Projects
            </button>

            {projectsOpen && (
              <div className="max-h-[360px] space-y-2 overflow-y-auto rounded-2xl border border-sky-900/20 bg-zinc-950/45 p-3 no-scrollbar">
                <button
                  type="button"
                  onClick={() => {
                    if (!canStartNewProject()) return;
                    setShowProjectInput(true);
                  }}
                  className="w-full rounded-xl border border-sky-900/25 bg-sky-950/20 px-3 py-2 text-left text-sm text-sky-100 transition hover:border-sky-700/40 hover:bg-sky-950/35"
                >
                  + Project
                </button>

                {showProjectInput && (
                  <input
                    value={newProjectTitle}
                    onChange={(event) => setNewProjectTitle(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter") return;

                      const cleanTitle = newProjectTitle.trim();
                      if (!cleanTitle) return;

                      const projectId = `project-${cleanTitle
                        .toLowerCase()
                        .replace(/\s+/g, "-")
                        .replace(/[^a-z0-9-]/g, "")
                        .replace(/-+/g, "-")
                        .replace(/^-|-$/g, "")}-${crypto.randomUUID().slice(0, 8)}`;

                      const nextProject = {
                        id: projectId,
                        title: cleanTitle,
                        chatId: crypto.randomUUID(),
                      };
                        chats: [],

                      upsertProjectSpaceState(nextProject);
                      void saveProjectSpaceToApi(nextProject);
                      setActiveProject(nextProject);
                      setProjectHomeOpen(true);
                      setNewProjectTitle("");
                      setShowProjectInput(false);
                      setShowMobileMenu(false);
                    }}
                    placeholder="Project name..."
                    className="mt-2 w-full rounded-xl border border-sky-900/25 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-sky-700/50"
                    autoFocus
                  />
                )}

                {projectSpaces.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => {
                      const projectChatId = project.chatId || crypto.randomUUID();
                      const nextProject = { ...project, chatId: projectChatId };

                      setActiveProject(nextProject);
                      setProjectSpaces((prev) =>
                        prev.map((savedProject) =>
                          savedProject.id === project.id ? nextProject : savedProject
                        )
                      );
                      void saveProjectSpaceToApi(nextProject);
                      localStorage.setItem("virtus_chat_id", projectChatId);
                      setActiveChatId(projectChatId);
                      setConversation([]);
                      setMessage("");
                      setReply("");
                      setStreamingReply("");
                      setEditingIndex(null);
                      setEditingText("");
                      setIsPracticeMode(null);
                      setShouldAutoScroll(true);
                      setProjectHomeOpen(true);
                      setShowMobileMenu(false);
                    }}
                    className="w-full rounded-xl border border-sky-900/15 bg-zinc-950/35 px-3 py-2 text-left text-sm text-zinc-300 transition hover:border-sky-800/35 hover:bg-zinc-950/55"
                  >
                    {project.title}
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setCaptureOpen(!captureOpen);
                setProjectsOpen(false);
                setPracticeOpen(false);
                setSearchOpen(false);
              }}
              className="virtus-mobile-menu-item w-full rounded-2xl px-3 py-3 text-left transition"
            >
              Capture
            </button>

            {captureOpen && renderCapturePanel()}

            <button
              type="button"
              onClick={() => {
                setPracticeOpen(!practiceOpen);
                setProjectsOpen(false);
                setSearchOpen(false);
                setCaptureOpen(false);
              }}
              className="virtus-mobile-menu-item w-full rounded-2xl px-3 py-3 text-left transition"
            >
              Practice
            </button>

            {practiceOpen && (
              <div className="virtus-practice-panel max-h-[360px] space-y-2 overflow-y-auto rounded-2xl border border-sky-900/20 p-2 no-scrollbar">
                <p className="px-3 pt-2 text-[11px] font-medium uppercase tracking-[0.18em] text-sky-300/50">
                  Practice Categories
                </p>

                {renderGuidedPracticeAssessment()}

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
                          setMessage(getLockedPracticeCategoryMessage(category, requiredPlan));
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
                          ? "virtus-practice-item border-sky-900/10 hover:border-sky-800/30"
                          : "virtus-practice-item-locked border-zinc-800/70 opacity-75 hover:border-sky-900/20"
                      }`}
                    >
                      <span className="block font-medium">
                        {category.title}
                      </span>

                      <span className="mt-0.5 block text-sm leading-6 virtus-practice-description">
                        {category.description}
                      </span>

                      {accessLabel && (
                        <span className="virtus-practice-badge mt-1 inline-flex rounded-full border border-sky-900/25 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em]">
                          {accessLabel}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            <Link href="/account" onClick={() => setShowMobileMenu(false)} className="virtus-mobile-menu-item block rounded-2xl px-3 py-3 transition">
              Profile
            </Link>

            <Link href="/account/personalization" onClick={() => setShowMobileMenu(false)} className="virtus-mobile-menu-item block rounded-2xl px-3 py-3 transition">
              Personalization
            </Link>

            <Link href="/account/personalization/memory" onClick={() => setShowMobileMenu(false)} className="virtus-mobile-menu-item block rounded-2xl px-3 py-3 transition">
              Memory
            </Link>

            <Link href="/upgrade" onClick={() => setShowMobileMenu(false)} className="virtus-mobile-menu-item block rounded-2xl px-3 py-3 transition">
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
                className="virtus-danger-button w-full rounded-2xl border px-3 py-3 text-left transition"
              >
                Log out
              </button>
            ) : (
              <Link href="/login" onClick={() => setShowMobileMenu(false)} className="virtus-mobile-menu-item block rounded-2xl px-3 py-3 transition">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    )}

    <div className="ml-auto shrink-0 text-right">
      <Link
        href="/upgrade"
        className="select-none inline-flex items-center rounded-full border border-sky-900/25 bg-sky-950/20 px-3 py-1 text-xs text-sky-200 transition hover:border-sky-800/40 hover:bg-sky-950/35"
      >
        Plan: {displayPlanLabel}
      </Link>

      {isTrialGuestExpired && (
        <p className="mt-2 text-xs text-sky-300/70">
          Sign in to continue.
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
            ? "Continue with account or plan"
            : !isAuthenticated && currentAccess?.plan === "trial_guest"
            ? "Continue"
            : displayUpgradeLabel}
        </Link>
      )}
    </div>
  </div>
</div>
<div
  ref={scrollContainerRef}
  className={`virtus-scrollbar flex-1 overflow-y-auto px-3 py-4 md:px-6 md:py-6 min-h-0 ${
    showMobileMenu ? "opacity-0 pointer-events-none" : "opacity-100"
  }`}
>

              {conversation.length > 0 || loading ? (
                <div className="space-y-4">
                  {conversation.map((item, index) => (
                    <div
                      key={index}
className={`relative select-none max-w-[92%] md:max-w-[75%] rounded-2xl px-4 py-3 text-[15px] md:text-base break-words ${
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
  <span className="text-xs font-semibold">Copied</span>
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
  setEditingIndex(index);
  setEditingText(item.text || "");
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
    <div className="select-text">
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
    </div>
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
            <span className="shrink-0 text-sky-300">FILE</span>
            <span className="max-w-[220px] truncate">
              {file.file_name}
            </span>
          </div>
        ))}
      </div>
    )}

    <p className="select-text whitespace-pre-wrap leading-7">
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
<div className="h-full flex items-start justify-center px-6 py-10">
  {activeProject?.title ? (
    <div className="w-full max-w-4xl">
      <div className="mb-8">
        <button
          type="button"
          onClick={() => {
            setProjectHomeOpen(false);
            setActiveProject(null);
            setProjectsOpen(true);
            setShowMobileMenu(true);
          }}
          className="mb-5 inline-flex items-center rounded-full border border-sky-900/30 bg-sky-950/20 px-4 py-2 text-sm font-medium text-sky-100 transition hover:border-sky-700/50 hover:bg-sky-950/35 md:hidden"
        >
          Back to projects
        </button>

        <p className="text-3xl font-semibold text-sky-100">
          {activeProject.title}
        </p>
        <p className="mt-3 text-sm virtus-theme-muted">
          New chat in {activeProject.title}
        </p>
      </div>

      <div className="mb-5 flex items-center gap-3">
        <span className="rounded-full border border-sky-900/25 bg-sky-950/20 px-5 py-2.5 text-sm font-medium text-sky-100 shadow-sm shadow-sky-950/10">
          Chats
        </span>
      </div>

      <div className="space-y-2">
        {(activeProject.chats || []).length > 0 &&
          (activeProject.chats || []).map((projectChat) => (
            <div
              key={projectChat.chatId}
              className="group flex items-center gap-2 rounded-2xl border border-sky-900/15 bg-zinc-950/25 text-left shadow-sm shadow-black/10 transition hover:border-sky-800/35 hover:bg-sky-950/15 hover:shadow-sky-950/10"
            >
            <button
              type="button"
              onClick={async () => {
                const projectChatId = projectChat.chatId;

                if (!projectChatId) return;

                const guestId =
                  localStorage.getItem("virtus_guest_id") ||
                  crypto.randomUUID();

                localStorage.setItem("virtus_guest_id", guestId);

                abortControllerRef.current?.abort();
                stopVirtusVoice();
                abortControllerRef.current = null;

                setShouldAutoScroll(true);
                setMessage("");
                setReply("");
                setStreamingReply("");
                setEditingIndex(null);
                setEditingText("");
                setIsPracticeMode(null);
                setProjectHomeOpen(false);
                setLoading(true);

                try {
                  const res = await fetch("/api/conversations", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      chatId: projectChatId,
                      ...(isAuthenticated ? {} : { guestId }),
                    }),
                  });

                  const data = await res.json();

                  if (data.access && !isAuthenticated) {
                    localStorage.setItem(
                      "virtus_guest_access",
                      JSON.stringify(data.access)
                    );
                    setGuestAccess(normalizeGuestAccess(data.access));
                  }

                  setConversation(data.conversation || []);
                  setActiveChatId(projectChatId);
                  localStorage.setItem("virtus_chat_id", projectChatId);
                } catch (error) {
                  setConversation([]);
                }

                setLoading(false);
              }}
              className="min-w-0 flex-1 px-4 py-4 text-left"
            >
              <span className="block truncate text-base font-semibold text-zinc-100 transition group-hover:text-sky-100">
                {projectChat.title || "Untitled project chat"}
              </span>
              <span className="mt-1 block truncate text-sm text-zinc-500 transition group-hover:text-zinc-400">
                Chat inside {activeProject.title}
              </span>
            </button>

            <button
              type="button"
              aria-label="Delete chat"
              onClick={(event) => {
                event.stopPropagation();
                handleDeleteChat(projectChat.chatId, { projectId: activeProject.id });
              }}
              className="group relative overflow-visible mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-zinc-500 opacity-70 transition hover:bg-red-950/30 hover:text-red-200 group-hover:opacity-100"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-3.5 w-3.5"
              >
                <circle cx="5" cy="12" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="19" cy="12" r="1.5" />
              </svg>
            </button>
          </div>
          ))}
      </div>
    </div>
  ) : (
    <div className="rounded-3xl border border-sky-900/20 bg-zinc-950/25 px-8 py-6 text-center shadow-sm shadow-sky-950/10 backdrop-blur-sm">
      <p className="text-sm font-medium text-sky-200">Ask Virtus anything.</p>
      <p className="mt-2 text-xs virtus-theme-muted">
        Think clearly. Act deliberately. Build with discipline.
      </p>
    </div>
  )}
</div>
              )}
            </div>

<div
  className={`virtus-chat-clear-bar virtus-theme-card-soft border-t border-sky-900/20 px-3 py-3 md:px-8 md:py-5 ${
    showMobileMenu ? "opacity-0 pointer-events-none" : "opacity-100"
  }`}
>
  <div className="virtus-theme-card relative rounded-[30px] border border-sky-900/25 shadow-sm shadow-sky-950/10 backdrop-blur-sm transition hover:border-sky-800/40 hover:bg-sky-950/10">

<div className="absolute left-3 top-1/2 -translate-y-1/2">
  <button
    type="button"
    onClick={() => {
      setShowFileMenu((value) => !value);
      loadUploadedFiles();
    }}
    disabled={uploadingFile || loading}
    className="virtus-file-action flex h-10 w-10 items-center justify-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-50"
  >
    {uploadingFile ? "..." : "+"}
  </button>

  <input
    id="virtus-file-upload"
    type="file"
    multiple
    accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.webp,image/*"
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
    className="virtus-file-menu absolute bottom-14 left-0 z-40 max-h-[62vh] w-72 overflow-y-auto overscroll-contain rounded-2xl border border-sky-900/55 bg-zinc-950/95 p-3 text-sm shadow-2xl shadow-black/70 backdrop-blur-xl no-scrollbar"
  >
    <div className="virtus-file-soft mb-3 rounded-2xl border border-sky-900/20 px-3 py-2">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-sky-300/60">
        Executive File Studio
      </p>

      <p className="mt-1 text-xs leading-5 virtus-file-muted">
        Upload, select, and use documents inside Virtus.
      </p>


    </div>

    <button
      type="button"
      onClick={() => document.getElementById("virtus-file-upload")?.click()}
      className="virtus-file-action flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition"
    >
      <span className="text-sky-300">+</span>
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
      className="virtus-file-action mb-2 flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition"
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
      );

      return cleanUploadedFiles.length === 0 ? (
        <p className="virtus-file-card rounded-xl border px-3 py-2 text-xs virtus-file-muted">
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
              <span className="block truncate text-sky-700">
                {file.file_name}
              </span>
              <span className="block text-[11px] virtus-file-muted">
                Click to open this document for Virtus
              </span>
            </button>

            {isImageFile && (
              <div className="virtus-file-soft mt-2 overflow-hidden rounded-lg border border-sky-900/30">
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
              <div className="virtus-file-soft mt-3 rounded-xl border border-sky-900/25 px-3 py-2">
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
                    className="virtus-file-action rounded-lg border px-3 py-1.5 text-xs transition"
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
                    className="virtus-file-action rounded-lg border px-3 py-1.5 text-xs transition"
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
                        className="virtus-file-action rounded-lg border px-3 py-1.5 text-xs transition"
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
  <div className="virtus-file-menu ml-16 mt-3 max-w-[70%] rounded-2xl border border-sky-900/30 px-4 py-3 text-sm shadow-lg shadow-black/20">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="font-medium text-sky-200">File access notice</p>
        <p className="mt-1 text-xs leading-5 virtus-file-muted">
          {fileNotice}
        </p>
      </div>

      <button
        type="button"
        onClick={() => setFileNotice("")}
        className="rounded-full border border-sky-900/30 px-2 py-0.5 text-xs text-sky-300 transition hover:bg-sky-950/45 hover:text-sky-100"
      >
        x
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
      ? "Your Trial Guest access has ended. Create a free account or choose Plus or Premium to continue."
      : isDailyLimitReached
      ? currentPlanKey === "trial_guest"
      ? "Trial Guest daily sample limit reached. Create a free account or choose Plus or Premium to continue."
      : currentPlanKey === "free"
      ? "Free daily limit reached. Plus unlocks more daily use and stronger coaching."
      : currentPlanKey === "plus"
      ? "Plus daily limit reached. Premium / Virtus Prime unlocks unlimited daily use."
      : "Daily limit reached for your current plan"
      : activeProject?.title ? `New chat in ${activeProject.title}...` : "Message Virtus..."
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













