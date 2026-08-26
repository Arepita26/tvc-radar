import Parser from "rss-parser";
import sourcesConfig from "../config/sources.json";
import {
  fetchTweetsForAccount,
  TwitterCredentials,
  XAccountConfig,
} from "./twitter";

// 1. Blacklist de Ruido General (Farándula, Deportes Internacionales, Efemérides, Spam)
const NOISE_BLACKLIST =
  /feliz cumpleaños|buen provecho|buenos dias a todos|buenas noches a todos|tal dia como hoy|en honor a|concierto|estreno|champions league|copa libertadores|la liga|premier league|grandes ligas|mlb|taquilla|farandula|miss universo|horoscopo|sorteo|giveaway|hilo\s*\d+\/\d+/i;

// 2. Diccionarios de Clasificación Temática
const DDHH_KEYWORDS =
  /derechos humanos|preso politico|presos politicos|tortura|libertad de expresion|censura|sntp|cnp|provea|foro penal|ong|cidh|salario|docentes|maestros|enfermeros|gremio|sindicato|violacion|detencion|allanamiento|protesta|manifestacion|reivindicacion/i;
const SERVICES_KEYWORDS =
  /sin luz|sin agua|falla electrica|corpoelec|hidrocapital|funvisis|sismo|temblor|inameh|lluvias|vialidad|gasolina|inundacion|desbordamiento|apagon/i;
const STATE_KEYWORDS =
  /promulgacion|promulga|ley|decreto|gaceta oficial|asamblea nacional|tsj|cne|ministerio|fiscal general|delcy|jorge rodriguez|cancilleria|alocucion|convenio|acuerdo bilateral|palacio de miraflores/i;
const POLITICS_KEYWORDS =
  /maria corina|edmundo gonzalez|oposicion|elecciones|partidos politicos|plataforma|comando con vzla|henrique capriles|manuel rosales/i;

// 3. Diccionarios de Regiones de Venezuela
export const VENEZUELA_REGIONS = [
  {
    id: "caracas_miranda",
    label: "Caracas y Miranda",
    regex:
      /caracas|miranda|la guaira|vargas|chacao|baruta|el hatillo|sucre|petare|guarenas|guatire|los teques|altamira|chacaito|helicoide|rodeo/i,
  },
  {
    id: "zulia_occidente",
    label: "Zulia y Occidente",
    regex:
      /zulia|maracaibo|san francisco|cabimas|costa oriental|falcon|coro|punto fijo|golfete|lara|barquisimeto|carora|yaracuy|san felipe/i,
  },
  {
    id: "tachira_andes",
    label: "Táchira y Andes",
    regex:
      /tachira|san cristobal|cucuta|frontera|ureña|san antonio del tachira|merida|el vigia|trujillo|valera/i,
  },
  {
    id: "carabobo_aragua",
    label: "Carabobo y Aragua",
    regex:
      /carabobo|valencia|naguanagua|puerto cabello|sandiego|guacara|aragua|maracay|la victoria|cagua|turmero|tocoron/i,
  },
  {
    id: "bolivar_oriente",
    label: "Bolívar y Oriente",
    regex:
      /bolivar|guayana|san felix|puerto ordaz|orinoco|ciudad bolivar|anzoategui|barcelona|puerto la cruz|lecheria|monagas|maturin|sucre|cumana|carupano|nueva esparta|margarita/i,
  },
] as const;

// 4. Patrones de Última Hora / Breaking News
const BREAKING_REGEX =
  /sismo|temblor|terremoto|allanan|allanamiento|detienen|detenido|detencion arbitraria|apagon masivo|colapso|explosion|alerta roja|alerta maxima|urgente|extraoficial|pronunciamiento urgente/i;

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  sourceType: "rss" | "syndicated";
  category: string;
  url: string;
  publishedAt: string;
  relativeTime: string;
  snippet?: string;
  timestamp: number;
  tier?: number;
  region?: string;
  isBreaking?: boolean;
}

export interface ScanResult {
  items: NewsItem[];
  totalScannedSources: number;
  successfulSources: number;
  timeframeHours: number;
  scannedAt: string;
  xSessionActive: boolean;
}

export function detectRegion(text: string): string | undefined {
  for (const reg of VENEZUELA_REGIONS) {
    if (reg.regex.test(text)) {
      return reg.id;
    }
  }
  return undefined;
}

export function filterAndCategorizeItem(item: {
  title: string;
  defaultCategory: string;
  sourceType: "rss" | "syndicated";
}): { keep: boolean; category: string; region?: string; isBreaking?: boolean } {
  const text = item.title.trim();

  // Descarte directo si coincide con la Blacklist de spam/ruido
  if (NOISE_BLACKLIST.test(text)) {
    return { keep: false, category: item.defaultCategory };
  }

  // Clasificación Dinámica por Contenido
  let assignedCategory = item.defaultCategory;

  if (DDHH_KEYWORDS.test(text)) {
    assignedCategory = "DDHH";
  } else if (SERVICES_KEYWORDS.test(text)) {
    assignedCategory = "Servicios";
  } else if (STATE_KEYWORDS.test(text)) {
    assignedCategory = "Estado";
  } else if (POLITICS_KEYWORDS.test(text)) {
    assignedCategory = "Politica";
  }

  const region = detectRegion(text);
  const isBreaking = BREAKING_REGEX.test(text);

  return { keep: true, category: assignedCategory, region, isBreaking };
}

const parser = new Parser({
  timeout: 8000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    Accept:
      "application/rss+xml, application/xml, text/xml, application/atom+xml, text/html;q=0.9, */*;q=0.8",
  },
});

export function parseToTimestamp(dateStr?: string | null): number {
  if (!dateStr || typeof dateStr !== "string") return 0;
  const trimmed = dateStr.trim();
  if (!trimmed) return 0;

  let timestamp = Date.parse(trimmed);
  if (!isNaN(timestamp) && timestamp > 0) {
    return timestamp;
  }

  const mysqlMatch = trimmed.match(
    /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/
  );
  if (mysqlMatch) {
    const isoString = `${mysqlMatch[1]}-${mysqlMatch[2]}-${mysqlMatch[3]}T${mysqlMatch[4]}:${mysqlMatch[5]}:${mysqlMatch[6]}Z`;
    timestamp = Date.parse(isoString);
    if (!isNaN(timestamp) && timestamp > 0) return timestamp;
  }

  const dateMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateMatch) {
    timestamp = Date.parse(`${trimmed}T00:00:00Z`);
    if (!isNaN(timestamp) && timestamp > 0) return timestamp;
  }

  return 0;
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

function cleanTitle(rawTitle?: string): string {
  if (!rawTitle) return "";
  let title = rawTitle.trim();
  title = title.replace(/ - [^-]+$/, "").trim();
  title = title.replace(/<!\[CDATA\[(.*?)\]\]>/g, "$1");
  title = title.replace(/<[^>]*>/g, "");
  title = title.replace(
    /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
    ""
  );
  return title.trim();
}

function cleanUrl(rawUrl?: string): string {
  if (!rawUrl) return "";
  try {
    const parsed = new URL(rawUrl);
    const paramsToRemove = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "fbclid",
      "gclid",
      "igshid",
    ];
    paramsToRemove.forEach((param) => parsed.searchParams.delete(param));
    return parsed.toString();
  } catch {
    return rawUrl;
  }
}

function normalizeForComparison(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isSimilar(titleA: string, titleB: string): boolean {
  const normA = normalizeForComparison(titleA);
  const normB = normalizeForComparison(titleB);

  if (normA === normB) return true;
  if (normA.includes(normB) || normB.includes(normA)) {
    if (Math.min(normA.length, normB.length) > 20) return true;
  }

  const tokensA = new Set(normA.split(" ").filter((w) => w.length > 3));
  const tokensB = new Set(normB.split(" ").filter((w) => w.length > 3));
  if (tokensA.size === 0 || tokensB.size === 0) return false;

  let intersection = 0;
  tokensA.forEach((token) => {
    if (tokensB.has(token)) intersection++;
  });

  const union = new Set([...tokensA, ...tokensB]).size;
  const similarity = intersection / union;
  return similarity > 0.65;
}

async function fetchFeedWithTimeout(url: string, timeoutMs: number = 8000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const feed = await parser.parseURL(url);
    clearTimeout(timeoutId);
    return feed;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export async function scanNews(
  hours: number = 24,
  credentials?: TwitterCredentials
): Promise<ScanResult> {
  const now = Date.now();
  const cutoffTimestamp = now - hours * 60 * 60 * 1000;
  const allRawItems: NewsItem[] = [];

  const rssFeeds = sourcesConfig.rss_feeds || [];
  const xAccounts: XAccountConfig[] = sourcesConfig.x_accounts || [];

  const effectiveAuthToken =
    credentials?.authToken ||
    process.env.X_AUTH_TOKEN ||
    process.env.TWITTER_AUTH_TOKEN;

  const effectiveCt0 =
    credentials?.ct0 ||
    process.env.X_CT0 ||
    process.env.TWITTER_CT0;

  const xSessionActive = Boolean(effectiveAuthToken && effectiveCt0);
  let successfulSources = 0;

  // 1. Extracción en Paralelo: Feeds RSS
  const rssPromises = rssFeeds.map(async (feed) => {
    try {
      const parsedFeed = await fetchFeedWithTimeout(feed.url);
      const feedItems: NewsItem[] = [];

      for (const item of parsedFeed.items || []) {
        const dateRaw =
          item.isoDate ||
          item.pubDate ||
          (item as unknown as { date?: string }).date;

        const itemTimestamp = parseToTimestamp(dateRaw);
        if (itemTimestamp === 0) continue;

        const title = cleanTitle(item.title);
        const url = cleanUrl(item.link || item.guid);
        if (!title || !url) continue;

        feedItems.push({
          id: `rss-${Buffer.from(url).toString("base64").slice(0, 16)}`,
          title,
          source: feed.name,
          sourceType: "rss",
          category: feed.category,
          tier: feed.tier || 2,
          url,
          publishedAt: new Date(itemTimestamp).toISOString(),
          relativeTime: calculateRelativeTime(itemTimestamp, now),
          snippet: item.contentSnippet
            ? cleanTitle(item.contentSnippet).slice(0, 160).trim()
            : undefined,
          timestamp: itemTimestamp,
        });
      }

      return { items: feedItems, success: true };
    } catch {
      return { items: [], success: false };
    }
  });

  const rssResults = await Promise.allSettled(rssPromises);
  for (const r of rssResults) {
    if (r.status === "fulfilled") {
      if (r.value.success) successfulSources++;
      allRawItems.push(...r.value.items);
    }
  }

  // 2. Extracción en Lotes: Cuentas de X (Twitter)
  const BATCH_SIZE = 4;
  for (let i = 0; i < xAccounts.length; i += BATCH_SIZE) {
    const batch = xAccounts.slice(i, i + BATCH_SIZE);
    const batchPromises = batch.map(async (account) => {
      try {
        const rawTweets = await fetchTweetsForAccount(account, credentials);
        return {
          items: rawTweets,
          success: rawTweets.length > 0 || xSessionActive,
        };
      } catch {
        return { items: [], success: false };
      }
    });

    const batchResults = await Promise.allSettled(batchPromises);
    for (const r of batchResults) {
      if (r.status === "fulfilled") {
        if (r.value.success) successfulSources++;
        allRawItems.push(...r.value.items);
      }
    }

    if (i + BATCH_SIZE < xAccounts.length) {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  // 3. Corte Temporal Estricto
  const timeFiltered = allRawItems.filter(
    (item) => item.timestamp >= cutoffTimestamp && item.timestamp <= now + 60000
  );

  // 4. Aplicación del Descarte Negativo, Detección de Región y Breaking News
  const validItems: NewsItem[] = [];

  for (const raw of timeFiltered) {
    const evaluation = filterAndCategorizeItem({
      title: raw.title,
      defaultCategory: raw.category,
      sourceType: raw.sourceType,
    });

    if (evaluation.keep) {
      validItems.push({
        ...raw,
        category: evaluation.category,
        region: evaluation.region,
        isBreaking: evaluation.isBreaking,
        relativeTime: calculateRelativeTime(raw.timestamp, now),
      });
    }
  }

  // 5. Deduplicación por URL y Similitud de Texto
  const deduplicatedItems: NewsItem[] = [];
  const seenUrls = new Set<string>();

  // Prioridad 1: Breaking News primero. Prioridad 2: Timestamp descendente
  validItems.sort((a, b) => {
    if (a.isBreaking && !b.isBreaking) return -1;
    if (!a.isBreaking && b.isBreaking) return 1;
    return b.timestamp - a.timestamp;
  });

  for (const item of validItems) {
    if (seenUrls.has(item.url)) continue;

    const isDuplicateTitle = deduplicatedItems.some((existing) =>
      isSimilar(existing.title, item.title)
    );

    if (!isDuplicateTitle) {
      seenUrls.add(item.url);
      deduplicatedItems.push(item);
    }
  }

  return {
    items: deduplicatedItems,
    totalScannedSources: rssFeeds.length + xAccounts.length,
    successfulSources,
    timeframeHours: hours,
    scannedAt: new Date(now).toISOString(),
    xSessionActive,
  };
}
