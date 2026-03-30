import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const RSS_FEEDS = [
  {
    url: "https://www.marijuanamoment.net/feed/",
    source: "Marijuana Moment",
  },
  {
    url: "https://www.leafly.com/news/feed",
    source: "Leafly",
  },
  {
    url: "https://cannabishealthnews.co.uk/feed/",
    source: "Cannabis Health News",
  },
  {
    url: "https://mjbizdaily.com/feed/",
    source: "MJBizDaily",
  },
];

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  research: [
    "study", "research", "clinical", "trial", "patient", "therapeutic",
    "efficacy", "treatment", "medical", "science", "findings", "evidence",
    "opioid", "pain", "anxiety", "epilepsy", "cancer",
  ],
  blockchain: [
    "blockchain", "nft", "traceability", "seed-to-sale", "supply chain",
    "smart contract", "web3", "token", "digital key",
  ],
  industry: [
    "market", "regulation", "license", "export", "import", "legislation",
    "policy", "business", "revenue", "investment", "legali", "bill",
    "government", "eu-gmp", "infarmed", "portugal",
  ],
};

const HB_KEYWORDS = [
  "medical cannabis", "EU-GMP", "patient access", "cannabis research",
  "regulated cannabis", "seed-to-sale", "traceability", "Dr. Green",
  "blockchain cannabis", "Healing Buds",
];

function detectCategory(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();
  let bestCategory = "news";
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const score = keywords.filter((kw) => text.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }
  return bestCategory;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function enrichContent(
  title: string,
  summary: string,
  sourceUrl: string,
  sourceName: string,
  category: string
): string {
  const categoryLabel: Record<string, string> = {
    research: "Cannabis Research",
    blockchain: "Blockchain & Traceability",
    industry: "Industry Update",
    news: "Cannabis News",
  };

  const relevantKeywords = HB_KEYWORDS.filter((kw) =>
    `${title} ${summary}`.toLowerCase().includes(kw.toLowerCase())
  ).slice(0, 3);

  const tagLine =
    relevantKeywords.length > 0
      ? `\n\n**Related topics:** ${relevantKeywords.join(", ")}`
      : "";

  return `## ${categoryLabel[category] || "News Update"}

${summary}

${tagLine}

> *Source: ${sourceName}. For the full article, visit the original source.*`;
}

async function fetchFeed(
  feedUrl: string,
  sourceName: string
): Promise<
  Array<{
    title: string;
    slug: string;
    summary: string;
    content: string;
    source_url: string;
    category: string;
    author: string;
    published_at: string;
  }>
> {
  try {
    const response = await fetch(feedUrl, {
      headers: { "User-Agent": "HealingBuds/1.0 RSS Reader" },
    });
    if (!response.ok) {
      console.error(`Feed ${feedUrl} returned ${response.status}`);
      return [];
    }

    const xml = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, "text/xml");

    if (!doc || doc.querySelector("parsererror")) {
      console.error(`Failed to parse XML from ${feedUrl}`);
      return [];
    }

    const items = doc.querySelectorAll("item");
    const articles: Array<{
      title: string;
      slug: string;
      summary: string;
      content: string;
      source_url: string;
      category: string;
      author: string;
      published_at: string;
    }> = [];

    items.forEach((item) => {
      const title = item.querySelector("title")?.textContent?.trim() || "";
      const link = item.querySelector("link")?.textContent?.trim() || "";
      const descriptionRaw =
        item.querySelector("description")?.textContent?.trim() || "";
      const pubDate = item.querySelector("pubDate")?.textContent?.trim() || "";
      const creator =
        item.getElementsByTagNameNS(
          "http://purl.org/dc/elements/1.1/",
          "creator"
        )[0]?.textContent?.trim() || sourceName;

      if (!title || !link) return;

      const summary = stripHtml(descriptionRaw).slice(0, 500);
      const category = detectCategory(title, summary);
      const content = enrichContent(title, summary, link, sourceName, category);

      articles.push({
        title,
        slug: slugify(title),
        summary: summary || title,
        content,
        source_url: link,
        category,
        author: creator,
        published_at: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      });
    });

    // Return max 5 per feed to keep volume reasonable
    return articles.slice(0, 5);
  } catch (err) {
    console.error(`Error fetching ${feedUrl}:`, err);
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check admin authorization
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch all RSS feeds in parallel
    const feedPromises = RSS_FEEDS.map((feed) =>
      fetchFeed(feed.url, feed.source)
    );
    const feedResults = await Promise.allSettled(feedPromises);

    const allArticles = feedResults
      .filter(
        (r): r is PromiseFulfilledResult<ReturnType<typeof fetchFeed> extends Promise<infer T> ? T : never> =>
          r.status === "fulfilled"
      )
      .flatMap((r) => r.value);

    if (allArticles.length === 0) {
      return new Response(
        JSON.stringify({ success: true, inserted: 0, message: "No articles found from feeds" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get existing source_urls for dedup
    const { data: existing } = await supabase
      .from("articles")
      .select("source_url")
      .not("source_url", "is", null);

    const existingUrls = new Set(
      (existing || []).map((a: { source_url: string }) => a.source_url)
    );

    // Also dedup by slug to avoid conflicts
    const { data: existingSlugs } = await supabase
      .from("articles")
      .select("slug");

    const slugSet = new Set(
      (existingSlugs || []).map((a: { slug: string }) => a.slug)
    );

    const newArticles = allArticles.filter(
      (a) => !existingUrls.has(a.source_url) && !slugSet.has(a.slug)
    );

    if (newArticles.length === 0) {
      return new Response(
        JSON.stringify({ success: true, inserted: 0, message: "All articles already exist" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert new articles
    const { data: inserted, error } = await supabase
      .from("articles")
      .insert(newArticles)
      .select("id, title, category");

    if (error) {
      console.error("Insert error:", error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        inserted: inserted?.length || 0,
        articles: inserted?.map((a) => ({ title: a.title, category: a.category })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
