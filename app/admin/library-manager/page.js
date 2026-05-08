"use client";

import { useEffect, useMemo, useState } from "react";

function formatDate(value) {
  if (!value) return "Unknown";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Unknown";

  return date.toLocaleString();
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function CategoryTotals({ title, totals }) {
  const entries = Object.entries(totals || {}).sort((a, b) => b[1] - a[1]);

  return (
    <div className="rounded-3xl border border-white/10 bg-zinc-950/80 p-5 shadow-[0_0_30px_rgba(14,165,233,0.05)]">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <div className="mt-4 space-y-3">
        {entries.length === 0 ? (
          <p className="text-sm text-zinc-500">No category data yet.</p>
        ) : (
          entries.map(([category, count]) => (
            <div
              key={category}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
            >
              <span className="text-sm text-zinc-300">{category}</span>
              <span className="text-sm font-semibold text-sky-300">
                {formatNumber(count)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function AdminLibraryManagerPage() {
  const [loading, setLoading] = useState(true);
  const [ingesting, setIngesting] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [result, setResult] = useState(null);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/library-manager", {
        cache: "no-store",
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Failed to load library manager.");
      }

      setData(json);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const files = data?.files || [];

  const filteredFiles = useMemo(() => {
    const cleanSearch = search.trim().toLowerCase();

    return files.filter((file) => {
      const matchesSearch =
        !cleanSearch ||
        String(file.file_name || "").toLowerCase().includes(cleanSearch) ||
        String(file.category || "").toLowerCase().includes(cleanSearch);

      const matchesFilter =
        filter === "all" ||
        (filter === "readable" && file.has_extracted_text) ||
        (filter === "not-ingested" &&
          file.has_extracted_text &&
          !file.already_ingested) ||
        (filter === "ingested" && file.already_ingested) ||
        (filter === "no-text" && !file.has_extracted_text);

      return matchesSearch && matchesFilter;
    });
  }, [files, search, filter]);

  const selectedFiles = files.filter((file) => selectedIds.includes(file.id));

  function toggleSelected(fileId) {
    setSelectedIds((current) =>
      current.includes(fileId)
        ? current.filter((id) => id !== fileId)
        : [...current, fileId]
    );
  }

  function selectReadableNotIngested() {
    setSelectedIds(
      files
        .filter((file) => file.has_extracted_text && !file.already_ingested)
        .map((file) => file.id)
    );
  }

  function clearSelection() {
    setSelectedIds([]);
  }

  async function ingestSelected() {
    if (selectedIds.length === 0 || ingesting) return;

    setIngesting(true);
    setResult(null);
    setError("");

    try {
      const response = await fetch("/api/library/ingest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileIds: selectedIds,
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Failed to ingest selected files.");
      }

      setResult(json);
      setSelectedIds([]);
      await loadData();
    } catch (ingestError) {
      setError(ingestError.message);
    } finally {
      setIngesting(false);
    }
  }

  const summary = data?.summary || {};

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-6 py-8 md:px-8 lg:px-10">
        <div className="mb-8 rounded-3xl border border-sky-400/20 bg-gradient-to-br from-zinc-950 via-black to-zinc-900 p-8 shadow-[0_0_70px_rgba(14,165,233,0.10)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.28em] text-sky-400/80">
                Virtus AI Admin
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">
                Library Manager
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-400">
                Review uploaded workbooks, see ingestion status, and add readable files into the global Virtus coaching library.
              </p>
            </div>

            <button
              onClick={loadData}
              disabled={loading || ingesting}
              className="rounded-2xl border border-sky-400/30 bg-sky-400/10 px-5 py-3 text-sm font-semibold text-sky-200 transition hover:bg-sky-400/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {error ? (
          <div className="mb-6 rounded-3xl border border-rose-400/30 bg-rose-500/10 p-5 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-3xl border border-white/10 bg-zinc-950/80 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Files
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {formatNumber(summary.files_count)}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-zinc-950/80 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Readable
            </p>
            <p className="mt-3 text-3xl font-semibold text-sky-300">
              {formatNumber(summary.readable_files_count)}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-zinc-950/80 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Ingested
            </p>
            <p className="mt-3 text-3xl font-semibold text-emerald-300">
              {formatNumber(summary.ingested_files_count)}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-zinc-950/80 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Sources
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {formatNumber(summary.sources_count)}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-zinc-950/80 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Chunks
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {formatNumber(summary.chunks_count)}
            </p>
          </div>
        </div>

        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          <CategoryTotals
            title="Sources by Category"
            totals={summary.source_category_totals}
          />
          <CategoryTotals
            title="Chunks by Category"
            totals={summary.chunk_category_totals}
          />
        </div>

        <div className="mb-8 rounded-3xl border border-white/10 bg-zinc-950/80 p-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto_auto] lg:items-center">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search files or categories..."
              className="rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-sky-400/60"
            />

            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/60"
            >
              <option value="all">All files</option>
              <option value="readable">Readable files</option>
              <option value="not-ingested">Readable not ingested</option>
              <option value="ingested">Already ingested</option>
              <option value="no-text">No extracted text</option>
            </select>

            <button
              onClick={selectReadableNotIngested}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-zinc-200 transition hover:bg-white/10"
            >
              Select readable new
            </button>

            <button
              onClick={clearSelection}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-zinc-200 transition hover:bg-white/10"
            >
              Clear
            </button>
          </div>

          <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-sky-400/20 bg-sky-400/10 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-sky-100">
                Selected files: {selectedIds.length}
              </p>
              <p className="mt-1 text-xs text-sky-200/70">
                Only readable files with extracted text can be ingested properly.
              </p>
            </div>

            <button
              onClick={ingestSelected}
              disabled={selectedIds.length === 0 || ingesting}
              className="rounded-2xl bg-sky-400 px-5 py-3 text-sm font-semibold text-black transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {ingesting ? "Ingesting..." : "Ingest selected"}
            </button>
          </div>
        </div>

        {result ? (
          <div className="mb-8 rounded-3xl border border-emerald-400/30 bg-emerald-500/10 p-5">
            <h2 className="text-lg font-semibold text-emerald-200">
              Ingestion result
            </h2>
            <div className="mt-4 space-y-2">
              {(result.ingested_files || []).map((item) => (
                <div
                  key={item.file_name}
                  className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm"
                >
                  <p className="font-medium text-white">{item.file_name}</p>
                  {item.success ? (
                    <p className="mt-1 text-emerald-300">
                      Success - {item.category} - {item.chunks} chunks
                    </p>
                  ) : (
                    <p className="mt-1 text-rose-300">{item.error}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/80 shadow-[0_0_40px_rgba(14,165,233,0.05)]">
          <div className="border-b border-white/10 px-6 py-5">
            <h2 className="text-xl font-semibold text-white">
              Uploaded Files
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              Showing {filteredFiles.length} of {files.length} files.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-white/[0.03]">
                <tr className="text-left">
                  <th className="px-6 py-4 text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
                    Select
                  </th>
                  <th className="px-6 py-4 text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
                    File
                  </th>
                  <th className="px-6 py-4 text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
                    Status
                  </th>
                  <th className="px-6 py-4 text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
                    Category
                  </th>
                  <th className="px-6 py-4 text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
                    Chunks
                  </th>
                  <th className="px-6 py-4 text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
                    Created
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/10">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-zinc-400">
                      Loading library files...
                    </td>
                  </tr>
                ) : filteredFiles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-zinc-400">
                      No files match this view.
                    </td>
                  </tr>
                ) : (
                  filteredFiles.map((file) => {
                    const disabled = !file.has_extracted_text || ingesting;
                    const checked = selectedIds.includes(file.id);

                    return (
                      <tr key={file.id} className="align-top hover:bg-white/[0.02]">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={disabled}
                            onChange={() => toggleSelected(file.id)}
                            className="h-4 w-4 accent-sky-400 disabled:opacity-30"
                          />
                        </td>

                        <td className="px-6 py-4">
                          <p className="max-w-xl text-sm font-medium text-white">
                            {file.file_name}
                          </p>
                          <p className="mt-1 text-xs text-zinc-500">
                            {file.file_type || "unknown type"}
                          </p>
                          <p className="mt-1 text-xs text-zinc-600">
                            {file.extracted_text_chars} extracted characters
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          {file.already_ingested ? (
                            <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                              Ingested
                            </span>
                          ) : file.has_extracted_text ? (
                            <span className="rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-300">
                              Ready
                            </span>
                          ) : (
                            <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
                              No text
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-sm text-zinc-300">
                          {file.category || "-"}
                        </td>

                        <td className="px-6 py-4 text-sm font-semibold text-sky-300">
                          {file.chunks || 0}
                        </td>

                        <td className="px-6 py-4 text-sm text-zinc-400">
                          {formatDate(file.created_at)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}