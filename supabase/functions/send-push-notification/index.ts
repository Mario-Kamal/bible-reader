import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, body, topicId } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.log("VAPID keys not configured");
      return new Response(
        JSON.stringify({ success: true, message: "VAPID keys not configured", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all push subscriptions
    const { data: subscriptions, error: fetchError } = await supabase
      .from("push_subscriptions")
      .select("*");

    if (fetchError) {
      console.error("Error fetching subscriptions:", fetchError);
      throw new Error("Failed to fetch subscriptions");
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("No subscriptions found");
      return new Response(
        JSON.stringify({ success: true, message: "No subscriptions", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${subscriptions.length} subscriptions`);

    const payload = JSON.stringify({
      title: title || "رحلة الكتاب المقدس 📖",
      body: body || "موضوع جديد متاح للقراءة!",
      icon: "/favicon.png",
      badge: "/favicon.png",
      tag: "new-topic",
      data: { url: "/home", topicId },
    });

    let successCount = 0;
    const failedSubscriptions: string[] = [];

    // Helper: base64url decode
    function base64urlDecode(str: string): Uint8Array {
      const padding = "=".repeat((4 - (str.length % 4)) % 4);
      const base64 = (str + padding).replace(/-/g, "+").replace(/_/g, "/");
      const rawData = atob(base64);
      const bytes = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; i++) {
        bytes[i] = rawData.charCodeAt(i);
      }
      return bytes;
    }

    // Helper: base64url encode
    function base64urlEncode(bytes: Uint8Array): string {
      let binary = "";
      for (const byte of bytes) {
        binary += String.fromCharCode(byte);
      }
      return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    }

    // Helper: standard base64 decode
    function base64Decode(str: string): Uint8Array {
      const rawData = atob(str);
      const bytes = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; i++) {
        bytes[i] = rawData.charCodeAt(i);
      }
      return bytes;
    }

    // Create VAPID JWT
    async function createJwt(audience: string): Promise<string> {
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

      // Import VAPID private key as EC P-256
      const rawKey = base64urlDecode(vapidPrivateKey!);
      
      // Build PKCS8 wrapper for the 32-byte raw EC private key
      const pkcs8Header = new Uint8Array([
        0x30, 0x81, 0x87, 0x02, 0x01, 0x00, 0x30, 0x13,
        0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02,
        0x01, 0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d,
        0x03, 0x01, 0x07, 0x04, 0x6d, 0x30, 0x6b, 0x02,
        0x01, 0x01, 0x04, 0x20,
      ]);
      
      const pkcs8 = new Uint8Array(pkcs8Header.length + rawKey.length);
      pkcs8.set(pkcs8Header);
      pkcs8.set(rawKey, pkcs8Header.length);

      const key = await crypto.subtle.importKey(
        "pkcs8",
        pkcs8,
        { name: "ECDSA", namedCurve: "P-256" },
        false,
        ["sign"]
      );

      const sig = await crypto.subtle.sign(
        { name: "ECDSA", hash: "SHA-256" },
        key,
        new TextEncoder().encode(unsignedToken)
      );

      // Convert DER signature to raw r||s format
      const sigBytes = new Uint8Array(sig);
      let r: Uint8Array, s: Uint8Array;

      if (sigBytes[0] === 0x30) {
        // DER encoded
        const rLen = sigBytes[3];
        const rBytes = sigBytes.slice(4, 4 + rLen);
        const sLen = sigBytes[4 + rLen + 1];
        const sBytes = sigBytes.slice(4 + rLen + 2, 4 + rLen + 2 + sLen);

        r = new Uint8Array(32);
        s = new Uint8Array(32);
        const rTrimmed = rBytes[0] === 0 ? rBytes.slice(1) : rBytes;
        const sTrimmed = sBytes[0] === 0 ? sBytes.slice(1) : sBytes;
        r.set(rTrimmed, 32 - rTrimmed.length);
        s.set(sTrimmed, 32 - sTrimmed.length);
      } else {
        r = sigBytes.slice(0, 32);
        s = sigBytes.slice(32, 64);
      }

      const rawSig = new Uint8Array(64);
      rawSig.set(r, 0);
      rawSig.set(s, 32);

      return `${unsignedToken}.${base64urlEncode(rawSig)}`;
    }

    // Encrypt payload using RFC 8291 (Web Push Encryption)
    async function encryptPayload(
      p256dhKey: string,
      authSecret: string,
      payloadText: string
    ): Promise<{ encrypted: Uint8Array; salt: Uint8Array; localPublicKey: Uint8Array }> {
      const userPublicKeyBytes = base64Decode(p256dhKey);
      const authSecretBytes = base64Decode(authSecret);
      const payloadBytes = new TextEncoder().encode(payloadText);

      // Import user's public key
      const userPublicKey = await crypto.subtle.importKey(
        "raw",
        userPublicKeyBytes,
        { name: "ECDH", namedCurve: "P-256" },
        true,
        []
      );

      // Generate local ephemeral key pair
      const localKeyPair = await crypto.subtle.generateKey(
        { name: "ECDH", namedCurve: "P-256" },
        true,
        ["deriveBits"]
      );

      // Export local public key
      const localPublicKeyRaw = new Uint8Array(
        await crypto.subtle.exportKey("raw", localKeyPair.publicKey)
      );

      // ECDH shared secret
      const sharedSecret = new Uint8Array(
        await crypto.subtle.deriveBits(
          { name: "ECDH", public: userPublicKey },
          localKeyPair.privateKey,
          256
        )
      );

      // Generate salt
      const salt = crypto.getRandomValues(new Uint8Array(16));

      // HKDF to derive keys
      async function hkdf(
        salt: Uint8Array,
        ikm: Uint8Array,
        info: Uint8Array,
        length: number
      ): Promise<Uint8Array> {
        const key = await crypto.subtle.importKey("raw", ikm, { name: "HKDF" }, false, [
          "deriveBits",
        ]);
        const bits = await crypto.subtle.deriveBits(
          { name: "HKDF", hash: "SHA-256", salt, info },
          key,
          length * 8
        );
        return new Uint8Array(bits);
      }

      // Create info strings for RFC 8291
      const keyInfoHeader = new TextEncoder().encode("WebPush: info\0");
      const keyInfo = new Uint8Array(
        keyInfoHeader.length + userPublicKeyBytes.length + localPublicKeyRaw.length
      );
      keyInfo.set(keyInfoHeader);
      keyInfo.set(userPublicKeyBytes, keyInfoHeader.length);
      keyInfo.set(localPublicKeyRaw, keyInfoHeader.length + userPublicKeyBytes.length);

      // IKM
      const ikm = await hkdf(authSecretBytes, sharedSecret, keyInfo, 32);

      // Content encryption key
      const cekInfo = new TextEncoder().encode("Content-Encoding: aes128gcm\0");
      const contentEncryptionKey = await hkdf(salt, ikm, cekInfo, 16);

      // Nonce
      const nonceInfo = new TextEncoder().encode("Content-Encoding: nonce\0");
      const nonce = await hkdf(salt, ikm, nonceInfo, 12);

      // Pad payload (add delimiter byte 0x02 and optional padding)
      const paddedPayload = new Uint8Array(payloadBytes.length + 1);
      paddedPayload.set(payloadBytes);
      paddedPayload[payloadBytes.length] = 2; // delimiter

      // Encrypt with AES-128-GCM
      const encryptionKey = await crypto.subtle.importKey(
        "raw",
        contentEncryptionKey,
        { name: "AES-GCM" },
        false,
        ["encrypt"]
      );

      const ciphertext = new Uint8Array(
        await crypto.subtle.encrypt(
          { name: "AES-GCM", iv: nonce },
          encryptionKey,
          paddedPayload
        )
      );

      // Build aes128gcm header:
      // salt (16) + rs (4 bytes, big-endian uint32) + idlen (1) + keyid (65 for P-256 uncompressed)
      const recordSize = ciphertext.length + 86; // header size + ciphertext
      const header = new Uint8Array(86);
      header.set(salt, 0); // 16 bytes salt
      // Record size as 4-byte big-endian
      const rs = 4096 + 1; // default record size
      header[16] = (rs >>> 24) & 0xff;
      header[17] = (rs >>> 16) & 0xff;
      header[18] = (rs >>> 8) & 0xff;
      header[19] = rs & 0xff;
      header[20] = 65; // idlen (P-256 public key is 65 bytes uncompressed)
      header.set(localPublicKeyRaw, 21); // keyid

      const encrypted = new Uint8Array(header.length + ciphertext.length);
      encrypted.set(header);
      encrypted.set(ciphertext, header.length);

      return { encrypted, salt, localPublicKey: localPublicKeyRaw };
    }

    // Send notifications
    for (const sub of subscriptions) {
      try {
        const endpointUrl = new URL(sub.endpoint);
        const audience = `${endpointUrl.protocol}//${endpointUrl.host}`;

        const jwt = await createJwt(audience);

        // Encrypt the payload
        const { encrypted } = await encryptPayload(sub.p256dh, sub.auth, payload);

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
          console.log("Notification sent to:", sub.endpoint.substring(0, 60));
        } else {
          const errText = await response.text();
          console.error(`Push failed (${response.status}):`, errText);
          if (response.status === 410 || response.status === 404) {
            failedSubscriptions.push(sub.id);
          }
        }
      } catch (error: any) {
        console.error("Failed to send to subscription:", error.message);
      }
    }

    // Clean up invalid subscriptions
    if (failedSubscriptions.length > 0) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .in("id", failedSubscriptions);
      console.log("Cleaned up", failedSubscriptions.length, "invalid subscriptions");
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        total: subscriptions.length,
        cleaned: failedSubscriptions.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-push-notification:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "حدث خطأ" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
