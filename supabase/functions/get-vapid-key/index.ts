import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");

    if (!vapidPublicKey) {
      // Generate new VAPID keys if not set
      const keyPair = await crypto.subtle.generateKey(
        { name: "ECDSA", namedCurve: "P-256" },
        true,
        ["sign", "verify"]
      );

      const publicKeyRaw = new Uint8Array(
        await crypto.subtle.exportKey("raw", keyPair.publicKey)
      );
      const privateKeyJwk = await crypto.subtle.exportKey("jwk", keyPair.privateKey);

      // Base64url encode
      let binary = "";
      for (const byte of publicKeyRaw) binary += String.fromCharCode(byte);
      const publicKeyBase64url = btoa(binary)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      return new Response(
        JSON.stringify({
          publicKey: publicKeyBase64url,
          needsSetup: true,
          privateKeyD: privateKeyJwk.d,
          message: "New keys generated. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY secrets.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ publicKey: vapidPublicKey }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
