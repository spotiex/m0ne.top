import { EmailMessage } from "cloudflare:email";

interface Env {
  STATE_KV: KVNamespace;
  NOTIFIER: {
    send(message: EmailMessage): Promise<void>;
  };
  SEED_URLS: string;
  WATCH_LOCATIONS: string;
  FROM_EMAIL: string;
  TO_EMAIL: string;
  USER_AGENT?: string;
}

interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

interface ProductSnapshot {
  productUrl: string;
  sourceUrl: string;
  title: string;
  normalizedLocations: string[];
  rawLocations: string[];
  checkedAt: string;
}

interface SnapshotState {
  products: Record<string, ProductSnapshot>;
}

interface DiscoveredProduct {
  productUrl: string;
  sourceUrl: string;
  title: string;
}

interface ChangeEvent {
  kind: "new-product" | "new-location";
  productTitle: string;
  productUrl: string;
  sourceUrl: string;
  locations: string[];
}

interface MonitorError {
  stage: "seed-fetch" | "product-fetch";
  url: string;
  message: string;
}

interface RunOptions {
  dryRun?: boolean;
  includeProducts?: boolean;
}

interface ScheduledController {
  cron: string;
  scheduledTime: number;
}

const SNAPSHOT_KEY = "snapshot:v1";
const DEFAULT_USER_AGENT = "racknerd-bf-watch/1.0";
const KNOWN_BLACK_FRIDAY_PRODUCTS: Array<{ title: string; slug: string }> = [
  {
    title: "1 GB KVM VPS (Black Friday 2025)",
    slug: "1-gb-kvm-vps-black-friday-2025"
  },
  {
    title: "2.5 GB KVM VPS (Black Friday 2025)",
    slug: "2560mb-kvm-vps-black-friday-2025"
  },
  {
    title: "4 GB KVM VPS (Black Friday 2025)",
    slug: "4-gb-kvm-vps-black-friday-2025"
  },
  {
    title: "6 GB KVM VPS (Black Friday 2025)",
    slug: "6-gb-kvm-vps-black-friday-2025"
  },
  {
    title: "8 GB KVM VPS (Black Friday 2025)",
    slug: "8-gb-kvm-vps-black-friday-2025"
  }
];

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/run") {
      const dryRun = url.searchParams.get("dry") === "1";
      const includeProducts = url.searchParams.get("debug") === "1";
      const result = await runMonitor(env, { dryRun, includeProducts });
      return json(result);
    }

    return json({
      ok: true,
      message: "Use /run or the Cron Trigger to execute the RackNerd Black Friday watcher."
    });
  },

  async scheduled(_controller: ScheduledController, env: Env): Promise<void> {
    await runMonitor(env);
  }
};

async function runMonitor(env: Env, options: RunOptions = {}): Promise<Record<string, unknown>> {
  const seedUrls = parseJsonArray(env.SEED_URLS, "SEED_URLS");
  const watchTerms = parseJsonArray(env.WATCH_LOCATIONS, "WATCH_LOCATIONS");
  const watchSet = new Set(watchTerms.map(normalizeLocationName).filter(Boolean));

  const { snapshot: previous, exists: hasBaseline } = await loadSnapshot(env);
  const { products: discoveredProducts, errors: discoveryErrors } = await discoverProducts(seedUrls, env);
  const { products: currentProducts, errors: productErrors } = await collectCurrentProducts(
    discoveredProducts,
    env
  );
  const current: SnapshotState = {
    products: Object.fromEntries(currentProducts.map((product) => [product.productUrl, product]))
  };
  const errors = [...discoveryErrors, ...productErrors];

  const changes = hasBaseline ? diffSnapshots(previous, current, watchSet) : [];

  if (!options.dryRun && changes.length > 0) {
    await sendNotification(changes, env);
  }

  if (!options.dryRun) {
    await env.STATE_KV.put(SNAPSHOT_KEY, JSON.stringify(current));
  }

  return {
    ok: true,
    checkedAt: new Date().toISOString(),
    dryRun: Boolean(options.dryRun),
    seedUrls,
    discoveredProducts: discoveredProducts.length,
    trackedProducts: currentProducts.length,
    changes,
    errors,
    products: options.includeProducts ? summarizeProducts(currentProducts) : undefined
  };
}

async function discoverProducts(
  seedUrls: string[],
  env: Env
): Promise<{ products: DiscoveredProduct[]; errors: MonitorError[] }> {
  const directProducts = seedUrls
    .filter(isDirectProductUrl)
    .map((seedUrl) => ({
      productUrl: seedUrl,
      sourceUrl: seedUrl,
      title: seedUrl
    }));

  const pageResults = await Promise.all(
    seedUrls.map(async (seedUrl) => {
      try {
        const html = await fetchText(seedUrl, env);
        return { ok: true as const, seedUrl, html };
      } catch (error) {
        return {
          ok: false as const,
          error: {
            stage: "seed-fetch" as const,
            url: seedUrl,
            message: toErrorMessage(error)
          }
        };
      }
    })
  );

  const products = new Map<string, DiscoveredProduct>(
    directProducts.map((product) => [product.productUrl, product])
  );
  const errors: MonitorError[] = [];

  for (const page of pageResults) {
    if (!page.ok) {
      errors.push(page.error);
      continue;
    }

    for (const product of extractProductLinks(page.html, page.seedUrl)) {
      products.set(product.productUrl, product);
    }

    for (const product of extractKnownBlackFridayProducts(page.html, page.seedUrl)) {
      products.set(product.productUrl, product);
    }
  }

  return { products: [...products.values()], errors };
}

async function collectCurrentProducts(
  products: DiscoveredProduct[],
  env: Env
): Promise<{ products: ProductSnapshot[]; errors: MonitorError[] }> {
  const snapshotResults = await Promise.all(
    products.map(async (product) => {
      try {
        const html = await fetchText(product.productUrl, env);
        const resolvedTitle = extractTitle(html) || product.title;
        const rawLocations = extractLocationOptions(html);
        const normalizedLocations = [...new Set(rawLocations.map(normalizeLocationName).filter(Boolean))];

        return {
          ok: true as const,
          snapshot: {
            productUrl: product.productUrl,
            sourceUrl: product.sourceUrl,
            title: resolvedTitle,
            normalizedLocations,
            rawLocations,
            checkedAt: new Date().toISOString()
          } satisfies ProductSnapshot
        };
      } catch (error) {
        return {
          ok: false as const,
          error: {
            stage: "product-fetch" as const,
            url: product.productUrl,
            message: toErrorMessage(error)
          }
        };
      }
    })
  );

  const snapshots: ProductSnapshot[] = [];
  const errors: MonitorError[] = [];

  for (const result of snapshotResults) {
    if (!result.ok) {
      errors.push(result.error);
      continue;
    }

    if (result.snapshot.rawLocations.length > 0) {
      snapshots.push(result.snapshot);
    }
  }

  return { products: snapshots, errors };
}

function diffSnapshots(
  previous: SnapshotState,
  current: SnapshotState,
  watchSet: Set<string>
): ChangeEvent[] {
  const changes: ChangeEvent[] = [];

  for (const currentProduct of Object.values(current.products)) {
    const previousProduct = previous.products[currentProduct.productUrl];
    const currentWatched = currentProduct.normalizedLocations.filter((location) => watchSet.has(location));

    if (currentWatched.length === 0) {
      continue;
    }

    if (!previousProduct) {
      changes.push({
        kind: "new-product",
        productTitle: currentProduct.title,
        productUrl: currentProduct.productUrl,
        sourceUrl: currentProduct.sourceUrl,
        locations: currentWatched
      });
      continue;
    }

    const previousSet = new Set(previousProduct.normalizedLocations);
    const newLocations = currentWatched.filter((location) => !previousSet.has(location));

    if (newLocations.length > 0) {
      changes.push({
        kind: "new-location",
        productTitle: currentProduct.title,
        productUrl: currentProduct.productUrl,
        sourceUrl: currentProduct.sourceUrl,
        locations: newLocations
      });
    }
  }

  return changes;
}

async function loadSnapshot(env: Env): Promise<{ snapshot: SnapshotState; exists: boolean }> {
  const raw = await env.STATE_KV.get(SNAPSHOT_KEY);
  if (!raw) {
    return { snapshot: { products: {} }, exists: false };
  }

  try {
    return { snapshot: JSON.parse(raw) as SnapshotState, exists: true };
  } catch {
    return { snapshot: { products: {} }, exists: false };
  }
}

async function sendNotification(changes: ChangeEvent[], env: Env): Promise<void> {
  const checkedAt = new Date().toISOString();
  const subject = `[RackNerd BF Watch] ${changes.length} change${changes.length > 1 ? "s" : ""} detected`;
  const lines = [
    `Detected ${changes.length} RackNerd Black Friday change(s) at ${checkedAt}.`,
    "",
    ...changes.flatMap((change, index) => {
      return [
        `${index + 1}. ${change.kind === "new-product" ? "New product with watched locations" : "New watched location"}`,
        `Title: ${change.productTitle}`,
        `Locations: ${change.locations.join(", ")}`,
        `Product: ${change.productUrl}`,
        `Source: ${change.sourceUrl}`,
        ""
      ];
    })
  ];

  const raw = buildPlainTextEmail({
    from: env.FROM_EMAIL,
    to: env.TO_EMAIL,
    subject,
    body: lines.join("\n").trim()
  });

  await env.NOTIFIER.send(new EmailMessage(env.FROM_EMAIL, env.TO_EMAIL, raw));
}

function extractProductLinks(html: string, baseUrl: string): DiscoveredProduct[] {
  const products = new Map<string, DiscoveredProduct>();
  const anchorPattern = /<a\b[^>]*href=(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi;

  for (const match of html.matchAll(anchorPattern)) {
    const rawHref = match[2];
    const innerHtml = match[3];
    if (!looksLikeBlackFridayProduct(rawHref, innerHtml, baseUrl)) {
      continue;
    }

    let absoluteUrl: string;
    try {
      absoluteUrl = new URL(rawHref, baseUrl).toString();
    } catch {
      continue;
    }

    const title = sanitizeText(innerHtml) || absoluteUrl;
    products.set(absoluteUrl, {
      productUrl: absoluteUrl,
      sourceUrl: baseUrl,
      title
    });
  }

  return [...products.values()];
}

function looksLikeBlackFridayProduct(href: string, innerHtml: string, sourceUrl: string): boolean {
  const haystack = `${href} ${sanitizeText(innerHtml)}`.toLowerCase();
  const looksLikeCheckout = /cart\.php\?a=add|\/store\//.test(haystack);
  const hasBlackFridaySignal = /black\s*friday|\bbf\b/.test(`${haystack} ${sourceUrl.toLowerCase()}`);
  return looksLikeCheckout && hasBlackFridaySignal;
}

function isDirectProductUrl(url: string): boolean {
  return /cart\.php\?a=add|\/store\//i.test(url);
}

function extractKnownBlackFridayProducts(html: string, sourceUrl: string): DiscoveredProduct[] {
  const loweredSource = sourceUrl.toLowerCase();
  if (!loweredSource.includes("blackfriday2025") && !loweredSource.includes("blackfriday")) {
    return [];
  }

  const products: DiscoveredProduct[] = [];
  for (const known of KNOWN_BLACK_FRIDAY_PRODUCTS) {
    if (!html.toLowerCase().includes(known.title.toLowerCase())) {
      continue;
    }

    products.push({
      productUrl: `https://my.racknerd.com/index.php?rp=/store/blackfriday2025/${known.slug}`,
      sourceUrl,
      title: known.title
    });
  }

  return products;
}

function extractTitle(html: string): string {
  const heading = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  if (heading) {
    return sanitizeText(heading[1]);
  }

  const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  if (title) {
    return sanitizeText(title[1]);
  }

  return "";
}

function extractLocationOptions(html: string): string[] {
  const matches = new Set<string>();
  const optionPattern = /<option\b[^>]*>([\s\S]*?)<\/option>/gi;

  for (const match of html.matchAll(optionPattern)) {
    const text = sanitizeText(match[1]);
    if (looksLikeLocation(text)) {
      matches.add(text);
    }
  }

  const dataLabelPattern =
    /<(?:label|div|span|td|option)\b[^>]*>([\s\S]*?(?:Los Angeles|LA-DC-02|San Jose|Seattle)[\s\S]*?)<\/(?:label|div|span|td|option)>/gi;

  for (const match of html.matchAll(dataLabelPattern)) {
    const text = sanitizeText(match[1]);
    if (looksLikeLocation(text)) {
      matches.add(text);
    }
  }

  return [...matches];
}

function looksLikeLocation(value: string): boolean {
  const normalized = value.toLowerCase();
  return /(los angeles|la-dc-02|san jose|santa clara|seattle)/.test(normalized);
}

function normalizeLocationName(value: string): string {
  const normalized = sanitizeText(value)
    .toLowerCase()
    .replace(/\s+/g, " ");

  if (!normalized) {
    return "";
  }

  if (normalized.includes("la-dc-02") || normalized.includes("los angeles") && normalized.includes("dc-02")) {
    return "Los Angeles (DC-02)";
  }

  if (normalized.includes("san jose")) {
    return "San Jose";
  }

  if (normalized.includes("santa clara")) {
    return "San Jose";
  }

  if (normalized.includes("seattle")) {
    return "Seattle";
  }

  return "";
}

async function fetchText(url: string, env: Env): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "user-agent": env.USER_AGENT || DEFAULT_USER_AGENT,
      accept: "text/html,application/xhtml+xml"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return response.text();
}

function parseJsonArray(raw: string, name: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || !parsed.every((item) => typeof item === "string")) {
      throw new Error("must be a JSON string array");
    }

    return parsed;
  } catch (error) {
    throw new Error(`Invalid ${name}: ${(error as Error).message}`);
  }
}

function sanitizeText(value: string): string {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function buildPlainTextEmail(input: {
  from: string;
  to: string;
  subject: string;
  body: string;
}): string {
  return [
    `From: ${input.from}`,
    `To: ${input.to}`,
    `Subject: ${input.subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "",
    input.body
  ].join("\r\n");
}

function summarizeProducts(products: ProductSnapshot[]): Array<Record<string, unknown>> {
  return products.map((product) => ({
    title: product.title,
    productUrl: product.productUrl,
    sourceUrl: product.sourceUrl,
    normalizedLocations: product.normalizedLocations,
    rawLocations: product.rawLocations
  }));
}

function json(payload: unknown): Response {
  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8"
    }
  });
}
