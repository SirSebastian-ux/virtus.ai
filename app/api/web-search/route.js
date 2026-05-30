import { checkRateLimit, getRateLimitIdentity, rateLimitResponse } from "@/lib/rate-limit";
export async function POST(req) {
  const searchRateLimit = checkRateLimit({
    key: `web-search:${getRateLimitIdentity(req)}`,
    limit: 30,
    windowMs: 60_000,
  });

  if (!searchRateLimit.allowed) {
    return rateLimitResponse(searchRateLimit);
  }


  try {
    const apiKey = process.env.TAVILY_API_KEY;

    if (!apiKey) {
      return Response.json({
        ok: false,
        error: "WEB_SEARCH_NOT_CONFIGURED",
        message: "Web search is not configured.",
        results: [],
      });
    }

    const internalKey = req.headers.get("x-virtus-internal-key");

    if (internalKey !== apiKey) {
      return Response.json(
        {
          ok: false,
          error: "FORBIDDEN",
          message: "Forbidden.",
          results: [],
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const query = String(body?.query || "").trim();

    if (!query || query.length < 3) {
      return Response.json(
        {
          ok: false,
          error: "INVALID_QUERY",
          message: "Search query is too short.",
          results: [],
        },
        { status: 400 }
      );
    }

    const safeQuery = query.slice(0, 300);

    const tavilyResponse = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
       Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query: safeQuery,
        search_depth: "basic",
        max_results: 5,
        include_answer: false,
        include_raw_content: false,
      }),
    });

    if (!tavilyResponse.ok) {
      const errorText = await tavilyResponse.text();

      return Response.json({
        ok: false,
        error: "WEB_SEARCH_FAILED",
        message: "The web search service failed.",
        status: tavilyResponse.status,
        details: errorText.slice(0, 500),
        results: [],
      });
    }

    const data = await tavilyResponse.json();

    const results = Array.isArray(data?.results)
      ? data.results.slice(0, 5).map((item) => ({
          title: String(item?.title || "").slice(0, 180),
          url: String(item?.url || ""),
          content: String(item?.content || "").slice(0, 800),
          publishedDate:
            item?.published_date ||
            item?.publishedDate ||
            item?.published_at ||
            null,
        }))
      : [];

    return Response.json({
      ok: true,
      query: safeQuery,
      results,
    });
  } catch (error) {
    console.error("WEB SEARCH ROUTE ERROR:", error);

    return Response.json({
      ok: false,
      error: "WEB_SEARCH_ERROR",
      message: "Web search failed.",
      results: [],
    });
  }
}

