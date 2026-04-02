import { clearSession, readSession } from "./auth";

function resolveApiUrl() {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:3001`;
  }

  return "http://127.0.0.1:3001";
}

function buildHeaders(init?: RequestInit, token?: string) {
  const session = readSession();
  return {
    ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...(token || session?.accessToken ? { Authorization: `Bearer ${token || session?.accessToken}` } : {}),
    ...(init?.headers || {})
  };
}

async function handleResponseError(response: Response) {
  if (response.status === 401 && typeof window !== "undefined") {
    clearSession();
    window.location.href = "/login";
    throw new Error("登录已过期，请重新登录");
  }

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(payload || "请求失败");
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit, token?: string): Promise<T> {
  const response = await fetch(`${resolveApiUrl()}${path}`, {
    ...init,
    headers: buildHeaders(init, token),
    cache: "no-store"
  });

  await handleResponseError(response);

  if (response.headers.get("content-type")?.includes("application/json")) {
    return (await response.json()) as T;
  }

  return undefined as T;
}

export async function downloadApiFile(path: string, filename: string) {
  const response = await fetch(`${resolveApiUrl()}${path}`, {
    method: "GET",
    headers: buildHeaders(),
    cache: "no-store"
  });

  await handleResponseError(response);

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export function getApiUrl() {
  return resolveApiUrl();
}