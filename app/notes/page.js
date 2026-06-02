"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const NOTE_TYPES = [
  "General Note",
  "Voice Capture",
  "Meeting",
  "Idea",
  "Reflection",
  "Task",
];

function getPreview(content) {
  const clean = String(content || "").replace(/\s+/g, " ").trim();
  if (!clean) return "Empty note";
  return clean.length > 90 ? `${clean.slice(0, 90)}...` : clean;
}

function buildLocalInsight(content) {
  const clean = String(content || "").trim();

  if (!clean) {
    return {
      summary: "Start writing. Your note insights will appear here.",
      actions: [],
      keyIdeas: [],
    };
  }

  const sentences = clean
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);

  const lines = clean
    .split(/\r?\n+/)
    .map((item) => item.trim())
    .filter(Boolean);

  const actions = lines
    .filter((line) =>
      /^(todo|task|action|next|follow|call|send|prepare|finish|review|create|fix|check)\b/i.test(
        line
      )
    )
    .slice(0, 6);

  const keyIdeas = lines
    .filter((line) => line.length > 25)
    .slice(0, 6);

  return {
    summary:
      sentences.slice(0, 2).join(" ") ||
      lines.slice(0, 2).join(" ") ||
      "Write more detail to generate a clearer summary.",
    actions,
    keyIdeas,
  };
}

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [activeNote, setActiveNote] = useState(null);
  const [title, setTitle] = useState("");
  const [noteType, setNoteType] = useState("General Note");
  const [content, setContent] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const insights = useMemo(() => buildLocalInsight(content), [content]);

  const filteredNotes = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return notes;

    return notes.filter((note) => {
      const haystack = `${note.title || ""} ${note.noteType || ""} ${
        note.content || ""
      }`.toLowerCase();

      return haystack.includes(query);
    });
  }, [notes, search]);

  useEffect(() => {
    try {
      const savedDraft = JSON.parse(
        localStorage.getItem("virtus_notes_draft_v1") || "null"
      );

      if (savedDraft && !activeNote) {
        setTitle(savedDraft.title || "");
        setNoteType(savedDraft.noteType || "General Note");
        setContent(savedDraft.content || "");
      }
    } catch {
      localStorage.removeItem("virtus_notes_draft_v1");
    }
  }, [activeNote]);

  useEffect(() => {
    try {
      localStorage.setItem(
        "virtus_notes_draft_v1",
        JSON.stringify({
          title,
          noteType,
          content,
          updatedAt: new Date().toISOString(),
        })
      );
    } catch {}
  }, [title, noteType, content]);

  useEffect(() => {
    void loadNotes();
  }, []);

  async function loadNotes() {
    setLoading(true);
    setStatus("");

    try {
      const response = await fetch("/api/capture-notes");
      const data = await response.json();

      if (!response.ok) {
        setStatus(data.error || "Notes could not be loaded.");
        return;
      }

      setNotes(Array.isArray(data.notes) ? data.notes : []);
    } catch (error) {
      setStatus(error.message || "Notes could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  function createNewNote() {
    setActiveNote(null);
    setTitle("");
    setNoteType("General Note");
    setContent("");
    setStatus("New note ready.");
  }

  function openNote(note) {
    setActiveNote(note);
    setTitle(note.title || "");
    setNoteType(note.noteType || "General Note");
    setContent(note.content || "");
    setStatus("");
  }

  async function saveNote() {
    const cleanTitle = title.trim() || "Untitled Note";
    const cleanContent = content.trim();

    if (!cleanContent) {
      setStatus("Write something before saving.");
      return;
    }

    setSaving(true);
    setStatus("");

    try {
      const isUpdating = Boolean(activeNote?.id);

      const response = await fetch("/api/capture-notes", {
        method: isUpdating ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: activeNote?.id,
          title: cleanTitle,
          noteType,
          content: cleanContent,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus(data.error || "Note could not be saved.");
        return;
      }

      const savedNote = data.note;

      setNotes((currentNotes) => {
        const withoutSaved = currentNotes.filter(
          (note) => note.id !== savedNote.id
        );

        return [savedNote, ...withoutSaved];
      });

      setActiveNote(savedNote);
      setTitle(savedNote.title || cleanTitle);
      setNoteType(savedNote.noteType || noteType);
      setContent(savedNote.content || cleanContent);
      setStatus("Note saved.");
    } catch (error) {
      setStatus(error.message || "Note could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteNote() {
    if (!activeNote?.id) {
      createNewNote();
      return;
    }

    const confirmed = window.confirm("Delete this note?");
    if (!confirmed) return;

    setSaving(true);
    setStatus("");

    try {
      const response = await fetch("/api/capture-notes", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: activeNote.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus(data.error || "Note could not be deleted.");
        return;
      }

      setNotes((currentNotes) =>
        currentNotes.filter((note) => note.id !== activeNote.id)
      );

      createNewNote();
      setStatus("Note deleted.");
    } catch (error) {
      setStatus(error.message || "Note could not be deleted.");
    } finally {
      setSaving(false);
    }
  }

  async function copyNote() {
    const text = `${title.trim() || "Untitled Note"}\n\n${content.trim()}`.trim();

    if (!text) {
      setStatus("Nothing to copy.");
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setStatus("Note copied.");
    } catch {
      setStatus("Copy failed.");
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 gap-4 p-4 lg:grid-cols-[310px_1fr_310px]">
        <aside className="rounded-2xl border border-sky-900/30 bg-zinc-950/80 p-3 shadow-2xl shadow-sky-950/20">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-sky-300/70">
                Virtus
              </p>
              <h1 className="text-xl font-semibold text-white">Notes</h1>
            </div>

            <Link
              href="/"
              className="rounded-xl border border-sky-700/30 px-3 py-2 text-xs text-sky-100 hover:bg-sky-950/40"
            >
              Home
            </Link>
          </div>

          <button
            type="button"
            onClick={createNewNote}
            className="mb-3 w-full rounded-xl border border-sky-600/40 bg-sky-950/40 px-3 py-2 text-sm font-medium text-sky-50 hover:bg-sky-900/40"
          >
            + New Note
          </button>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search notes..."
            className="mb-3 w-full rounded-xl border border-sky-900/30 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-sky-500/60"
          />

          <div className="mb-3 grid grid-cols-2 gap-2">
            {NOTE_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSearch(type)}
                className="rounded-xl border border-zinc-800 bg-zinc-900/70 px-2 py-2 text-xs text-zinc-300 hover:border-sky-700/50 hover:text-sky-100"
              >
                {type}
              </button>
            ))}
          </div>

          <div className="max-h-[calc(100vh-270px)] space-y-2 overflow-y-auto pr-1">
            {loading ? (
              <p className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 text-sm text-zinc-400">
                Loading notes...
              </p>
            ) : filteredNotes.length ? (
              filteredNotes.map((note) => (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => openNote(note)}
                  className={`w-full rounded-xl border p-3 text-left transition ${
                    activeNote?.id === note.id
                      ? "border-sky-500/60 bg-sky-950/40"
                      : "border-zinc-800 bg-zinc-900/60 hover:border-sky-800/60"
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <h2 className="line-clamp-1 text-sm font-semibold text-zinc-100">
                      {note.title || "Untitled Note"}
                    </h2>
                    <span className="shrink-0 rounded-full border border-sky-900/40 px-2 py-0.5 text-[10px] text-sky-200">
                      {note.noteType || "Note"}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-xs leading-5 text-zinc-500">
                    {getPreview(note.content)}
                  </p>
                </button>
              ))
            ) : (
              <p className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 text-sm text-zinc-400">
                No notes found.
              </p>
            )}
          </div>
        </aside>

        <section className="rounded-2xl border border-sky-900/30 bg-zinc-950/80 p-4 shadow-2xl shadow-sky-950/20">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-sky-300/70">
                OneNote Style Workspace
              </p>
              <h2 className="text-2xl font-semibold text-white">
                {activeNote ? "Edit Note" : "New Note"}
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={copyNote}
                className="rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-900"
              >
                Copy
              </button>

              <button
                type="button"
                onClick={deleteNote}
                disabled={saving}
                className="rounded-xl border border-red-700/40 px-3 py-2 text-sm text-red-100 hover:bg-red-950/30 disabled:opacity-60"
              >
                Delete
              </button>

              <button
                type="button"
                onClick={saveNote}
                disabled={saving}
                className="rounded-xl border border-sky-600/40 bg-sky-950/50 px-4 py-2 text-sm font-medium text-sky-50 hover:bg-sky-900/40 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>

          {status ? (
            <div className="mb-3 rounded-xl border border-sky-900/30 bg-sky-950/20 px-3 py-2 text-sm text-sky-100">
              {status}
            </div>
          ) : null}

          <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px]">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Note title..."
              className="rounded-xl border border-sky-900/30 bg-zinc-900/80 px-4 py-3 text-lg font-semibold text-white outline-none placeholder:text-zinc-600 focus:border-sky-500/60"
            />

            <select
              value={noteType}
              onChange={(event) => setNoteType(event.target.value)}
              className="rounded-xl border border-sky-900/30 bg-zinc-900/80 px-3 py-3 text-sm text-zinc-100 outline-none focus:border-sky-500/60"
            >
              {NOTE_TYPES.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </div>

          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Write your thoughts, meeting notes, ideas, reflections, tasks, or coaching insights here..."
            className="min-h-[calc(100vh-245px)] w-full resize-none rounded-2xl border border-sky-900/30 bg-zinc-900/70 px-4 py-4 text-base leading-7 text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-sky-500/60"
          />
        </section>

        <aside className="rounded-2xl border border-sky-900/30 bg-zinc-950/80 p-4 shadow-2xl shadow-sky-950/20">
          <p className="text-xs uppercase tracking-[0.25em] text-sky-300/70">
            Assistant Panel
          </p>
          <h2 className="mb-4 text-xl font-semibold text-white">Note Intelligence</h2>

          <div className="mb-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
            <h3 className="mb-2 text-sm font-semibold text-sky-100">Summary</h3>
            <p className="text-sm leading-6 text-zinc-300">{insights.summary}</p>
          </div>

          <div className="mb-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
            <h3 className="mb-2 text-sm font-semibold text-sky-100">Action Items</h3>
            {insights.actions.length ? (
              <ul className="space-y-2 text-sm text-zinc-300">
                {insights.actions.map((item) => (
                  <li key={item} className="rounded-lg bg-zinc-950/60 p-2">
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-zinc-500">
                Write lines starting with task, action, next, prepare, fix, or review.
              </p>
            )}
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
            <h3 className="mb-2 text-sm font-semibold text-sky-100">Key Ideas</h3>
            {insights.keyIdeas.length ? (
              <ul className="space-y-2 text-sm text-zinc-300">
                {insights.keyIdeas.map((item) => (
                  <li key={item} className="rounded-lg bg-zinc-950/60 p-2">
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-zinc-500">
                Longer paragraphs will appear here as key ideas.
              </p>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
