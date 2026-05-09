const AUTH_SECRET = process.env.AUTH_SECRET || process.env.JWT_SECRET || "ben-tenison-secret";
const AUTH_COOKIE = "bt_auth";
const TOKEN_TTL_SECONDS = 60 * 60 * 8;

type AuthPayload = {
  userId: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "CASHIER";
  storeId: string | null;
  storeName?: string | null;
  storeLocation?: string | null;
  exp: number;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function base64UrlEncode(bytes: Uint8Array) {
  let base64: string;

  if (typeof btoa === "function") {
    let str = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      str += String.fromCharCode(bytes[i]);
    }
    base64 = btoa(str);
  } else if (typeof Buffer !== "undefined") {
    base64 = Buffer.from(bytes).toString("base64");
  } else {
    throw new Error("No base64 encoder available.");
  }

  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (value.length % 4)) % 4);
  let binary: string;

  if (typeof atob === "function") {
    binary = atob(base64);
  } else if (typeof Buffer !== "undefined") {
    binary = Buffer.from(base64, "base64").toString("binary");
  } else {
    throw new Error("No base64 decoder available.");
  }

  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

async function importKey() {
  return await crypto.subtle.importKey(
    "raw",
    encoder.encode(AUTH_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function signAuthToken(payload: Omit<AuthPayload, "exp">) {
  const tokenData = {
    ...payload,
    exp: Date.now() + TOKEN_TTL_SECONDS * 1000,
  };

  const encodedPayload = base64UrlEncode(encoder.encode(JSON.stringify(tokenData)));
  const key = await importKey();
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(encodedPayload));
  const signature = base64UrlEncode(new Uint8Array(signatureBuffer));

  return `${encodedPayload}.${signature}`;
}

export async function verifyAuthToken(token: string): Promise<AuthPayload | null> {
  try {
    const [encodedPayload, signature] = token.split(".");
    if (!encodedPayload || !signature) return null;

    const key = await importKey();
    const signatureBytes = base64UrlDecode(signature);
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes,
      encoder.encode(encodedPayload),
    );

    if (!isValid) return null;

    const payload = JSON.parse(decoder.decode(base64UrlDecode(encodedPayload))) as AuthPayload;
    if (Date.now() > payload.exp) return null;

    return payload;
  } catch {
    return null;
  }
}

export async function getAuthPayloadFromCookies(cookies: { get(name: string): { value: string } | undefined }) {
  const cookie = cookies.get(AUTH_COOKIE);
  if (!cookie) return null;
  return verifyAuthToken(cookie.value);
}
