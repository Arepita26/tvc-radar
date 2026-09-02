import { NewsItem, parseToTimestamp } from "./scanner";

export interface XAccountConfig {
  handle: string;
  name: string;
  category: string;
  tier?: number;
}

export interface TwitterCredentials {
  authToken?: string;
  ct0?: string;
}

const BEARER_TOKEN =
  "AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA";

function sanitizeToken(token?: string | null): string | undefined {
  if (!token) return undefined;
  const trimmed = token.trim();
  if (
    trimmed === "" ||
    trimmed.toLowerCase() === "null" ||
    trimmed.toLowerCase() === "undefined"
  ) {
    return undefined;
  }
  return trimmed;
}

// In-memory caches: stores the FULL raw timeline (20 items) without timeframe filtering
const restIdCache = new Map<string, string>();
const timelineCache = new Map<
  string,
  { timestamp: number; items: NewsItem[] }
>();
const inFlightRequests = new Map<string, Promise<NewsItem[]>>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache per account

function cleanTweetText(rawText: string): string {
  if (!rawText) return "";
  let text = rawText.trim();

  // Strip emojis per Dominia Standards / Zero Emoji Rule
  text = text.replace(
    /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
    ""
  );

  // Clean trailing t.co media URLs
  text = text.replace(/\s*https:\/\/t\.co\/[a-zA-Z0-9]+$/g, "").trim();
  text = text.replace(/\n{3,}/g, "\n\n").trim();

  return text;
}

function calculateRelativeTime(
  publishedTimestamp: number,
  currentTimestamp: number
): string {
  const diffMs = Math.max(0, currentTimestamp - publishedTimestamp);
  const diffMinutes = Math.floor(diffMs / (60 * 1000));
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (diffMinutes < 1) return "hace un momento";
  if (diffMinutes < 60) return `hace ${diffMinutes} min`;
  if (diffHours === 1) return "hace 1 hora";
  if (diffHours < 24) return `hace ${diffHours} horas`;
  if (diffDays === 1) return "hace 1 día";
  return `hace ${diffDays} días`;
}

async function getTwitterRestId(
  screenName: string,
  authToken: string,
  ct0: string
): Promise<string | null> {
  const key = screenName.toLowerCase();
  if (restIdCache.has(key)) {
    return restIdCache.get(key)!;
  }

  const userUrl = `https://twitter.com/i/api/graphql/sLVLhk0bGj3MVFEKTdax1w/UserByScreenName?variables=${encodeURIComponent(
    JSON.stringify({
      screen_name: screenName,
      withSafetyModeUserFields: true,
    })
  )}&features=${encodeURIComponent(
    JSON.stringify({
      hidden_profile_likes_enabled: true,
      hidden_profile_subscriptions_enabled: true,
      responsive_web_graphql_exclude_directive_enabled: true,
      verified_phone_label_enabled: false,
      subscriptions_verification_info_is_identity_verified_enabled: true,
      subscriptions_verification_info_verified_since_enabled: true,
      highlights_tweets_tab_ui_enabled: true,
      responsive_web_twitter_article_notes_tab_enabled: true,
      creator_subscriptions_tweet_preview_api_enabled: true,
      responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
      responsive_web_graphql_timeline_navigation_enabled: true,
    })
  )}`;

  try {
    const res = await fetch(userUrl, {
      signal: AbortSignal.timeout(3500),
      headers: {
        authorization: `Bearer ${BEARER_TOKEN}`,
        "x-csrf-token": ct0,
        "x-twitter-auth-type": "OAuth2Session",
        "x-twitter-active-user": "yes",
        Cookie: `auth_token=${authToken}; ct0=${ct0};`,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Referer: "https://twitter.com/",
      },
    });

    if (res.status === 401) {
      console.log(`[TVC Radar - Twitter] HTTP 401 No autorizado para @${screenName}`);
      return null;
    }
    if (res.status === 429) {
      console.log(`[TVC Radar - Twitter] HTTP 429 Rate Limit en UserByScreenName para @${screenName}`);
      return null;
    }
    if (!res.ok) {
      console.log(`[TVC Radar - Twitter] HTTP ${res.status} en UserByScreenName para @${screenName}`);
      return null;
    }

    const data = await res.json();
    const restId = data?.data?.user?.result?.rest_id;
    if (restId) {
      restIdCache.set(key, restId);
      return restId;
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`[TVC Radar - Twitter] Error resolviendo @${screenName}: ${msg}`);
    return null;
  }

  return null;
}

/**
 * Fallback to Syndication Profile endpoint if GraphQL hits rate limit
 */
async function fetchSyndicationFallback(
  account: XAccountConfig,
  authToken: string,
  ct0: string
): Promise<NewsItem[]> {
  const now = Date.now();
  const screenName = account.handle.replace(/^@/, "");
  try {
    const res = await fetch(
      `https://syndication.twitter.com/srv/timeline-profile/screen-name/${screenName}`,
      {
        signal: AbortSignal.timeout(3500),
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          Cookie: `auth_token=${authToken}; ct0=${ct0};`,
          "x-csrf-token": ct0,
          Referer: "https://twitter.com/",
        },
      }
    );

    if (!res.ok) return [];
    const html = await res.text();
    const startTag = '<script id="__NEXT_DATA__" type="application/json">';
    const startIdx = html.indexOf(startTag);
    if (startIdx === -1) return [];

    const rawJson = html.substring(
      startIdx + startTag.length,
      html.indexOf("</script>", startIdx)
    );
    const data = JSON.parse(rawJson);
    const entries = data?.props?.pageProps?.timeline?.entries || [];

    const items: NewsItem[] = [];
    for (const entry of entries) {
      const tweet = entry.content?.tweet;
      if (tweet && tweet.created_at && (tweet.full_text || tweet.text)) {
        const rawText = tweet.full_text || tweet.text;
        const cleanedText = cleanTweetText(rawText);
        if (!cleanedText) continue;

        const timestamp = parseToTimestamp(tweet.created_at);
        if (timestamp === 0) continue;

        const tweetId = tweet.id_str;
        const authorName = tweet.user?.name || account.name;
        const authorScreenName = tweet.user?.screen_name || screenName;

        items.push({
          id: `x-${tweetId}`,
          title: cleanedText,
          source: `${authorName} (@${authorScreenName})`,
          sourceType: "syndicated",
          category: account.category,
          tier: account.tier || 2,
          url: `https://x.com/${authorScreenName}/status/${tweetId}`,
          publishedAt: new Date(timestamp).toISOString(),
          relativeTime: calculateRelativeTime(timestamp, now),
          timestamp,
        });
      }
    }
    return items;
  } catch {
    return [];
  }
}

/**
 * Consulta los tweets de un usuario mediante la API GraphQL autenticada
 */
async function fetchGraphQLTimeline(
  account: XAccountConfig,
  authToken: string,
  ct0: string
): Promise<NewsItem[]> {
  const now = Date.now();
  const screenName = account.handle.replace(/^@/, "");
  const restId = await getTwitterRestId(screenName, authToken, ct0);

  if (!restId) {
    return fetchSyndicationFallback(account, authToken, ct0);
  }

  const tweetsUrl = `https://twitter.com/i/api/graphql/V7H0Ap3_Hh2FyS75OCDO3Q/UserTweets?variables=${encodeURIComponent(
    JSON.stringify({
      userId: restId,
      count: 20,
      includePromotedContent: false,
      withQuickPromoteEligibilityTweetFields: false,
      withVoice: false,
      withV2Timeline: true,
    })
  )}&features=${encodeURIComponent(
    JSON.stringify({
      rweb_lists_timeline_redesign_enabled: true,
      responsive_web_graphql_exclude_directive_enabled: true,
      verified_phone_label_enabled: false,
      creator_subscriptions_tweet_preview_api_enabled: true,
      responsive_web_graphql_timeline_navigation_enabled: true,
      responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
      tweetypie_unmention_optimization_enabled: true,
      responsive_web_edit_tweet_api_enabled: true,
      graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
      view_counts_everywhere_api_enabled: true,
      longform_notetweets_consumption_enabled: true,
      responsive_web_twitter_article_tweet_consumption_enabled: false,
      tweet_awards_web_tipping_enabled: false,
      freedom_of_speech_not_reach_fetch_enabled: true,
      standardized_nudges_misinfo: true,
      tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
      longform_notetweets_rich_text_read_enabled: true,
      longform_notetweets_inline_media_enabled: true,
      responsive_web_enhance_cards_enabled: false,
    })
  )}`;

  try {
    const res = await fetch(tweetsUrl, {
      signal: AbortSignal.timeout(3500),
      headers: {
        authorization: `Bearer ${BEARER_TOKEN}`,
        "x-csrf-token": ct0,
        "x-twitter-auth-type": "OAuth2Session",
        "x-twitter-active-user": "yes",
        Cookie: `auth_token=${authToken}; ct0=${ct0};`,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Referer: "https://twitter.com/",
      },
    });

    if (res.status === 429) {
      console.log(`[TVC Radar - Twitter] HTTP 429 Rate Limit en UserTweets para @${screenName}, usando fallback`);
      return fetchSyndicationFallback(account, authToken, ct0);
    }
    if (!res.ok) {
      return fetchSyndicationFallback(account, authToken, ct0);
    }

    const data = await res.json();
    const instructions =
      data?.data?.user?.result?.timeline_v2?.timeline?.instructions || [];

    const items: NewsItem[] = [];

    for (const inst of instructions) {
      const entries =
        inst.entries ||
        (inst.type === "TimelinePinEntry" && inst.entry ? [inst.entry] : []);

      for (const entry of entries) {
        const tweetResult = entry?.content?.itemContent?.tweet_results?.result;
        if (!tweetResult) continue;

        const tweetLegacy = tweetResult.legacy || tweetResult.tweet?.legacy;
        const userLegacy = tweetResult.core?.user_results?.result?.legacy;

        if (tweetLegacy && tweetLegacy.created_at) {
          const rawText = tweetLegacy.full_text || tweetLegacy.text || "";
          const cleanedText = cleanTweetText(rawText);
          if (!cleanedText) continue;

          const timestamp = parseToTimestamp(tweetLegacy.created_at);
          if (timestamp === 0) continue;

          const tweetId = tweetLegacy.id_str || tweetResult.rest_id;
          const authorName = userLegacy?.name || account.name;
          const authorScreenName = userLegacy?.screen_name || screenName;

          items.push({
            id: `x-${tweetId}`,
            title: cleanedText,
            source: `${authorName} (@${authorScreenName})`,
            sourceType: "syndicated",
            category: account.category,
            tier: account.tier || 2,
            url: `https://x.com/${authorScreenName}/status/${tweetId}`,
            publishedAt: new Date(timestamp).toISOString(),
            relativeTime: calculateRelativeTime(timestamp, now),
            timestamp,
          });
        }
      }
    }

    if (items.length === 0) {
      return fetchSyndicationFallback(account, authToken, ct0);
    }

    return items;
  } catch {
    return fetchSyndicationFallback(account, authToken, ct0);
  }
}

/**
 * Consulta tweets para una cuenta de X con caché inteligente y deduplicación de peticiones en vuelo.
 */
export async function fetchTweetsForAccount(
  account: XAccountConfig,
  credentials?: TwitterCredentials
): Promise<NewsItem[]> {
  const authToken =
    sanitizeToken(credentials?.authToken) ||
    sanitizeToken(process.env.X_AUTH_TOKEN) ||
    sanitizeToken(process.env.TWITTER_AUTH_TOKEN);

  const ct0 =
    sanitizeToken(credentials?.ct0) ||
    sanitizeToken(process.env.X_CT0) ||
    sanitizeToken(process.env.TWITTER_CT0);

  if (!authToken || !ct0) {
    return [];
  }

  const screenName = account.handle.replace(/^@/, "").toLowerCase();
  const cached = timelineCache.get(screenName);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.items;
  }

  if (inFlightRequests.has(screenName)) {
    return inFlightRequests.get(screenName)!;
  }

  const fetchPromise = (async () => {
    try {
      const rawParsedTweets = await fetchGraphQLTimeline(
        account,
        authToken,
        ct0
      );

      if (rawParsedTweets.length > 0) {
        timelineCache.set(screenName, {
          timestamp: Date.now(),
          items: rawParsedTweets,
        });
        return rawParsedTweets;
      }

      if (cached && cached.items.length > 0) {
        return cached.items;
      }

      return [];
    } finally {
      inFlightRequests.delete(screenName);
    }
  })();

  inFlightRequests.set(screenName, fetchPromise);
  return fetchPromise;
}
