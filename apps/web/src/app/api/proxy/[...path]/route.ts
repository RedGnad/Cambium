import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ApiApp = Awaited<
  ReturnType<(typeof import("@cambium/api/app"))["buildApiApp"]>
>;
type RouteContext = { params: Promise<{ path?: string[] }> };
type InjectMethod = "DELETE" | "GET" | "HEAD" | "PATCH" | "POST" | "PUT" | "OPTIONS";
type InjectResponse = {
  statusCode: number;
  headers: Record<string, string | string[] | number | undefined>;
  payload: string;
  rawPayload?: Buffer;
};

let appPromise: Promise<ApiApp> | null = null;

function getEmbeddedApiApp(): Promise<ApiApp> {
  appPromise ??= import("@cambium/api/app").then((mod) => mod.buildApiApp());
  return appPromise;
}

function hasRequestBody(method: string): boolean {
  return !["GET", "HEAD"].includes(method.toUpperCase());
}

function injectMethod(method: string): InjectMethod {
  const upper = method.toUpperCase();
  if (
    upper === "DELETE" ||
    upper === "GET" ||
    upper === "HEAD" ||
    upper === "PATCH" ||
    upper === "POST" ||
    upper === "PUT" ||
    upper === "OPTIONS"
  ) {
    return upper;
  }
  return "GET";
}

function cleanBaseUrl(raw: string): URL | null {
  try {
    return new URL(raw.replace(/\/+$/, "").replace(/\/api$/, ""));
  } catch {
    return null;
  }
}

function getExternalApiBase(request: NextRequest): URL | null {
  const configured = process.env.API_BASE_URL;
  if (!configured) return null;

  const apiBase = cleanBaseUrl(configured);
  if (!apiBase) return null;

  const currentOrigin = new URL(request.url).origin;
  if (apiBase.origin === currentOrigin) return null;

  const isLocalhost =
    apiBase.hostname === "localhost" || apiBase.hostname === "127.0.0.1";
  if (process.env.VERCEL && isLocalhost) return null;

  return apiBase;
}

function apiPath(path: string[] | undefined, search: string): string {
  const encoded = (path ?? []).map((part) => encodeURIComponent(part)).join("/");
  return `/api/${encoded}${search}`;
}

function copyHeaders(headers: Headers): Headers {
  const copied = new Headers();
  headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (["connection", "content-encoding", "transfer-encoding"].includes(lower)) {
      return;
    }
    copied.set(key, value);
  });
  return copied;
}

function safeErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/postgres(?:ql)?:\/\/[^@\s]+@/g, "postgresql://***@");
}

async function proxyToExternalApi(
  request: NextRequest,
  path: string[] | undefined
): Promise<Response> {
  const base = getExternalApiBase(request);
  if (!base) throw new Error("External API base URL is not configured.");

  const url = new URL(request.url);
  const target = new URL(apiPath(path, url.search), base);
  const headers = new Headers(request.headers);
  headers.delete("host");

  const upstream = await fetch(target, {
    method: request.method,
    headers,
    body: hasRequestBody(request.method) ? await request.arrayBuffer() : undefined,
    cache: "no-store",
    redirect: "manual",
  });

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: copyHeaders(upstream.headers),
  });
}

async function proxyToEmbeddedApi(
  request: NextRequest,
  path: string[] | undefined
): Promise<Response> {
  const app = await getEmbeddedApiApp();
  const url = new URL(request.url);
  const headers = Object.fromEntries(request.headers.entries());
  delete headers.host;

  const response = (await app.inject({
    method: injectMethod(request.method),
    url: apiPath(path, url.search),
    headers,
    payload: hasRequestBody(request.method)
      ? Buffer.from(await request.arrayBuffer())
      : undefined,
  })) as InjectResponse;

  const responseHeaders = new Headers();
  for (const [key, value] of Object.entries(response.headers)) {
    if (value === undefined) continue;
    const lower = key.toLowerCase();
    if (["connection", "content-encoding", "transfer-encoding"].includes(lower)) {
      continue;
    }
    if (Array.isArray(value)) {
      value.forEach((item) => responseHeaders.append(key, item));
    } else {
      responseHeaders.set(key, String(value));
    }
  }

  const responseBody = response.rawPayload
    ? new Uint8Array(response.rawPayload)
    : response.payload;

  return new Response(responseBody, {
    status: response.statusCode,
    headers: responseHeaders,
  });
}

async function handle(request: NextRequest, context: RouteContext): Promise<Response> {
  const { path } = await context.params;
  try {
    if (getExternalApiBase(request)) {
      return await proxyToExternalApi(request, path);
    }
    return await proxyToEmbeddedApi(request, path);
  } catch (error) {
    return Response.json(
      {
        error: "cambium_api_unavailable",
        message: safeErrorMessage(error),
        hint:
          "On Vercel, either leave API_BASE_URL unset and configure DATABASE_URL plus demo signer keys for the embedded API, or set API_BASE_URL to a deployed Cambium API host. Do not use localhost in Vercel environment variables.",
      },
      { status: 500 }
    );
  }
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const OPTIONS = handle;
