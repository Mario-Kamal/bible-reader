import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Helpers ──────────────────────────────────────────────────────────

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

async function createVapidJwt(
  audience: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
): Promise<string> {
  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    aud: audience,
    exp: now + 43200,
    sub: "mailto:admin@scripture.app",
  };

  const headerB64 = base64urlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const claimsB64 = base64urlEncode(new TextEncoder().encode(JSON.stringify(claims)));
  const unsignedToken = `${headerB64}.${claimsB64}`;

  const pubBytes = base64urlDecode(vapidPublicKey);
  const x = base64urlEncode(pubBytes.slice(1, 33));
  const y = base64urlEncode(pubBytes.slice(33, 65));
  
  let d = vapidPrivateKey;
  if (d.length % 4 !== 0) {
    d += "=".repeat(4 - (d.length % 4));
  }
  d = d.replace(/-/g, "+").replace(/_/g, "/");

  const key = await crypto.subtle.importKey(
    "jwk",
    { kty: "EC", crv: "P-256", x, y, d },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );

  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(unsignedToken),
  );

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

async function encryptPayload(
  p256dhKey: string,
  authSecret: string,
  payloadText: string,
): Promise<Uint8Array> {
  const userPublicKeyBytes = base64Decode(p256dhKey);
  const authSecretBytes = base64Decode(authSecret);
  const payloadBytes = new TextEncoder().encode(payloadText);

  const userPublicKey = await crypto.subtle.importKey(
    "raw",
    userPublicKeyBytes,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    [],
  );

  const localKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"],
  );

  const localPublicKeyRaw = new Uint8Array(
    await crypto.subtle.exportKey("raw", localKeyPair.publicKey),
  );

  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "ECDH", public: userPublicKey },
      localKeyPair.privateKey,
      256,
    ),
  );

  const salt = crypto.getRandomValues(new Uint8Array(16));

  async function hkdf(
    hkdfSalt: Uint8Array,
    ikm: Uint8Array,
    info: Uint8Array,
    length: number,
  ): Promise<Uint8Array> {
    const key = await crypto.subtle.importKey("raw", ikm, { name: "HKDF" }, false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits(
      { name: "HKDF", hash: "SHA-256", salt: hkdfSalt, info },
      key,
      length * 8,
    );
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

  const encryptionKey = await crypto.subtle.importKey("raw", contentEncryptionKey, { name: "AES-GCM" }, false, ["encrypt"]);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, encryptionKey, paddedPayload),
  );

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { title, body, topicId } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // المفاتيح الجديدة
    const vapidPublicKey = "BPsBdOkkJ1BwPD-MLfcR3p_OY9rXj6Nck2srcBU0lwn4pjGIq1b_3KQa3ZdJURhX569yYwUuNFsFlfAu-CK-ACc";
    const vapidPrivateKey = "fboyqe6EFAH6p_5NIPdR-6nN6yd2m7d4IMklzkbZ6wA";

    // اختبار المفاتيح
    try {
      const testJwt = await createVapidJwt("https://test.com", vapidPublicKey, vapidPrivateKey);
      console.log("✅ VAPID keys are valid");
    } catch (keyError) {
      console.error("❌ VAPID keys are invalid:", keyError);
      return new Response(
        JSON.stringify({ success: false, error: "VAPID keys are invalid" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // جلب كل المشتركين
    const { data: subscriptions, error: fetchError } = await supabase
      .from("push_subscriptions")
      .select("*");

    if (fetchError) {
      console.error("Error fetching subscriptions:", fetchError);
      throw new Error("Failed to fetch subscriptions");
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No subscriptions", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`📊 Found ${subscriptions.length} subscriptions`);
    
    // عرض تفاصيل أول مشترك للتأكد
    if (subscriptions.length > 0) {
      console.log("Sample subscription:", {
        id: subscriptions[0].id,
        endpoint: subscriptions[0].endpoint.substring(0, 50) + "...",
        hasP256dh: !!subscriptions[0].p256dh,
        hasAuth: !!subscriptions[0].auth
      });
    }

    const payload = JSON.stringify({
      title: title || "رحلة الكتاب المقدس 📖",
      body: body || "موضوع جديد متاح للقراءة!",
      icon: "/favicon.png",
      badge: "/favicon.png",
      tag: "new-topic",
      data: { url: "/home", topicId },
    });

    let successCount = 0;
    const failedSubscriptions: Array<{id: string, reason: string}> = [];

    for (const sub of subscriptions) {
      try {
        console.log(`📨 Sending to subscription ${sub.id}...`);
        
        const endpointUrl = new URL(sub.endpoint);
        const audience = `${endpointUrl.protocol}//${endpointUrl.host}`;

        const jwt = await createVapidJwt(audience, vapidPublicKey, vapidPrivateKey);
        const encrypted = await encryptPayload(sub.p256dh, sub.auth, payload);

        const response = await fetch(sub.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream",
            "Content-Encoding": "aes128gcm",
            "Content-Length": encrypted.length.toString(),
            TTL: "86400",
            Authorization: `vapid t=${jwt}, k=${vapidPublicKey}`,
          },
          body: encrypted,
        });

        if (response.ok || response.status === 201) {
          successCount++;
          console.log(`✅ Successfully sent to ${sub.id}`);
        } else {
          const errText = await response.text();
          console.error(`❌ Push failed (${response.status}) for ${sub.id}:`, errText);
          
          failedSubscriptions.push({
            id: sub.id,
            reason: `HTTP ${response.status}: ${errText}`
          });
          
          if (response.status === 410 || response.status === 404 || response.status === 403 || response.status === 400) {
            // حذف الاشتراكات الفاشلة
            await supabase.from("push_subscriptions").delete().eq("id", sub.id);
            console.log(`🗑️ Removed invalid subscription ${sub.id}`);
          }
        }
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error(`❌ Exception for ${sub.id}:`, msg);
        failedSubscriptions.push({
          id: sub.id,
          reason: `Exception: ${msg}`
        });
      }
    }

    // نتيجة البث
    const result = {
      success: true,
      sent: successCount,
      total: subscriptions.length,
      failed: failedSubscriptions.length,
      failures: failedSubscriptions, // تفاصيل الفشل
      cleaned: failedSubscriptions.length
    };

    console.log("📊 Final result:", result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Error in send-push-notification:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "حدث خطأ",
        stack: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});