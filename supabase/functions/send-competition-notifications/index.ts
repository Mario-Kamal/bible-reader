import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function base64urlDecode(str: string): Uint8Array {
  const padding = "=".repeat((4 - (str.length % 4)) % 4);
  const base64 = (str + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const bytes = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) bytes[i] = rawData.charCodeAt(i);
  return bytes;
}

function base64urlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64Decode(str: string): Uint8Array {
  const rawData = atob(str);
  const bytes = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) bytes[i] = rawData.charCodeAt(i);
  return bytes;
}

async function createVapidJwt(audience: string, vapidPublicKey: string, vapidPrivateKey: string): Promise<string> {
  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const claims = { aud: audience, exp: now + 43200, sub: "mailto:admin@scripture.app" };

  const headerB64 = base64urlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const claimsB64 = base64urlEncode(new TextEncoder().encode(JSON.stringify(claims)));
  const unsignedToken = `${headerB64}.${claimsB64}`;

  const pubBytes = base64urlDecode(vapidPublicKey);
  const x = base64urlEncode(pubBytes.slice(1, 33));
  const y = base64urlEncode(pubBytes.slice(33, 65));
  const d = vapidPrivateKey;

  const key = await crypto.subtle.importKey(
    "jwk",
    { kty: "EC", crv: "P-256", x, y, d },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );

  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, new TextEncoder().encode(unsignedToken));
  const sigBytes = new Uint8Array(sig);
  let rawSig: Uint8Array;

  if (sigBytes[0] === 0x30) {
    const rLen = sigBytes[3];
    const rBytes = sigBytes.slice(4, 4 + rLen);
    const sLen = sigBytes[4 + rLen + 1];
    const sBytes = sigBytes.slice(4 + rLen + 2, 4 + rLen + 2 + sLen);
    const r = new Uint8Array(32);
    const s = new Uint8Array(32);
    const rTrimmed = rBytes[0] === 0 ? rBytes.slice(1) : rBytes;
    const sTrimmed = sBytes[0] === 0 ? sBytes.slice(1) : sBytes;
    r.set(rTrimmed, 32 - rTrimmed.length);
    s.set(sTrimmed, 32 - sTrimmed.length);
    rawSig = new Uint8Array(64);
    rawSig.set(r, 0);
    rawSig.set(s, 32);
  } else {
    rawSig = sigBytes.slice(0, 64);
  }

  return `${unsignedToken}.${base64urlEncode(rawSig)}`;
}

async function encryptPayload(p256dhKey: string, authSecret: string, payloadText: string): Promise<Uint8Array> {
  const userPublicKeyBytes = base64Decode(p256dhKey);
  const authSecretBytes = base64Decode(authSecret);
  const payloadBytes = new TextEncoder().encode(payloadText);

  const userPublicKey = await crypto.subtle.importKey("raw", userPublicKeyBytes.buffer as ArrayBuffer, { name: "ECDH", namedCurve: "P-256" }, true, []);
  const localKeyPair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const localPublicKeyRaw = new Uint8Array(await crypto.subtle.exportKey("raw", localKeyPair.publicKey));
  const sharedSecret = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: userPublicKey }, localKeyPair.privateKey, 256));
  const salt = crypto.getRandomValues(new Uint8Array(16));

  async function hkdf(hkdfSalt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
    const key = await crypto.subtle.importKey("raw", ikm.buffer as ArrayBuffer, { name: "HKDF" }, false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt: hkdfSalt.buffer as ArrayBuffer, info: info.buffer as ArrayBuffer }, key, length * 8);
    return new Uint8Array(bits);
  }

  const keyInfoHeader = new TextEncoder().encode("WebPush: info\0");
  const keyInfo = new Uint8Array(keyInfoHeader.length + userPublicKeyBytes.length + localPublicKeyRaw.length);
  keyInfo.set(keyInfoHeader);
  keyInfo.set(userPublicKeyBytes, keyInfoHeader.length);
  keyInfo.set(localPublicKeyRaw, keyInfoHeader.length + userPublicKeyBytes.length);

  const ikm = await hkdf(authSecretBytes, sharedSecret, keyInfo, 32);
  const contentEncryptionKey = await hkdf(salt, ikm, new TextEncoder().encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, ikm, new TextEncoder().encode("Content-Encoding: nonce\0"), 12);

  const paddedPayload = new Uint8Array(payloadBytes.length + 1);
  paddedPayload.set(payloadBytes);
  paddedPayload[payloadBytes.length] = 2;

  const encryptionKey = await crypto.subtle.importKey("raw", contentEncryptionKey.buffer as ArrayBuffer, { name: "AES-GCM" }, false, ["encrypt"]);
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce.buffer as ArrayBuffer }, encryptionKey, paddedPayload.buffer as ArrayBuffer));

  const rs = 4096 + 1;
  const header = new Uint8Array(86);
  header.set(salt, 0);
  header[16] = (rs >>> 24) & 0xff;
  header[17] = (rs >>> 16) & 0xff;
  header[18] = (rs >>> 8) & 0xff;
  header[19] = rs & 0xff;
  header[20] = 65;
  header.set(localPublicKeyRaw, 21);

  const encrypted = new Uint8Array(header.length + ciphertext.length);
  encrypted.set(header);
  encrypted.set(ciphertext, header.length);
  return encrypted;
}

async function sendToAll(supabase: ReturnType<typeof createClient>, payload: string, vapidPublicKey: string, vapidPrivateKey: string) {
  const { data: subscriptions } = await supabase.from("push_subscriptions").select("*");
  if (!subscriptions || subscriptions.length === 0) return 0;

  let sent = 0;
  const failed: string[] = [];

  for (const sub of subscriptions) {
    try {
      const endpointUrl = new URL(sub.endpoint);
      const audience = `${endpointUrl.protocol}//${endpointUrl.host}`;
      const jwt = await createVapidJwt(audience, vapidPublicKey, vapidPrivateKey);
      const encrypted = await encryptPayload(sub.p256dh, sub.auth, payload);

      const res = await fetch(sub.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Encoding": "aes128gcm",
          "Content-Length": encrypted.length.toString(),
          TTL: "86400",
          Authorization: `vapid t=${jwt}, k=${vapidPublicKey}`,
        },
        body: encrypted.buffer as ArrayBuffer,
      });

      if (res.ok || res.status === 201) {
        sent++;
      } else if (res.status === 410 || res.status === 404) {
        failed.push(sub.id);
      }
    } catch (e) {
      console.error("Push error:", e);
    }
  }

  if (failed.length > 0) {
    await supabase.from("push_subscriptions").delete().in("id", failed);
  }

  return sent;
}

// Motivational messages for different stages
const START_MESSAGES = [
  { title: "🏆 مسابقة جديدة بدأت!", body: "استعد للتحدي! مسابقة أسبوعية جديدة تنتظرك الآن. شارك واربح النقاط!" },
  { title: "⚔️ المعركة بدأت!", body: "مسابقة جديدة أُطلقت! انضم الآن وتنافس مع زملائك على الصدارة." },
  { title: "🎯 تحدٍ جديد!", body: "مسابقة أسبوعية جديدة في انتظارك! اختبر معلوماتك وارتقِ في الترتيب." },
];

const MID_MESSAGES = [
  { title: "💪 لا تتوقف!", body: "المسابقة لا تزال تسير! تقدّم واجب الأسئلة وارفع نقاطك." },
  { title: "🔥 الوقت يمر!", body: "لا تفوّت فرصة كسب النقاط! المسابقة الأسبوعية تنتظر مشاركتك." },
  { title: "⭐ أين أنت؟", body: "تحقق من ترتيبك في المسابقة الأسبوعية وأضف نقاطاً قبل فوات الأوان!" },
];

const END_MESSAGES = [
  { title: "⏰ آخر فرصة!", body: "المسابقة تنتهي غداً! أجب على الأسئلة المتبقية الآن قبل انتهاء الوقت." },
  { title: "🚨 ساعات أخيرة!", body: "لديك أقل من 24 ساعة لإنهاء المسابقة! لا تضيع النقاط." },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { type } = body; // 'start' | 'mid' | 'end' | auto-detect

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

    if (!vapidPublicKey || !vapidPrivateKey) {
      return new Response(JSON.stringify({ success: false, message: "VAPID keys not configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const today = new Date().toISOString().split("T")[0];

    // Get active competitions
    const { data: competitions } = await supabase
      .from("competitions")
      .select("*")
      .eq("is_active", true)
      .lte("start_date", today)
      .gte("end_date", today);

    if (!competitions || competitions.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "No active competitions", sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const competition = competitions[0];
    const startDate = new Date(competition.start_date);
    const endDate = new Date(competition.end_date);
    const nowDate = new Date(today);

    const daysSinceStart = Math.floor((nowDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysUntilEnd = Math.floor((endDate.getTime() - nowDate.getTime()) / (1000 * 60 * 60 * 24));

    // Auto-detect type if not provided
    let notifType = type;
    if (!notifType) {
      if (daysSinceStart === 0) notifType = "start";
      else if (daysUntilEnd <= 1) notifType = "end";
      else notifType = "mid";
    }

    let messages: { title: string; body: string }[];
    if (notifType === "start") messages = START_MESSAGES;
    else if (notifType === "end") messages = END_MESSAGES;
    else messages = MID_MESSAGES;

    // Pick a random message
    const msg = messages[Math.floor(Math.random() * messages.length)];

    const payload = JSON.stringify({
      title: msg.title,
      body: `${competition.title} - ${msg.body}`,
      icon: "/favicon.png",
      badge: "/favicon.png",
      tag: `competition-${competition.id}-${notifType}`,
      data: { url: "/competitions", competitionId: competition.id },
    });

    const sent = await sendToAll(supabase, payload, vapidPublicKey, vapidPrivateKey);

    console.log(`Competition notification (${notifType}) sent to ${sent} subscribers`);

    return new Response(
      JSON.stringify({ success: true, sent, type: notifType, competition: competition.title }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "حدث خطأ" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
