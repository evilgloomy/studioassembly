import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const STANDARDIZE_PROMPT = `Transform this LEGO minifigure photo into a clean, professional portrait.
Requirements:
- Pure white background, seamless, no shadows on the background
- Minifigure centered in frame, shot from roughly chest/waist up or full body
- Soft, even studio lighting with no harsh shadows
- Remove any background clutter, other objects, or surface textures
- Keep the minifigure's exact appearance, colors, accessories, and expression unchanged
- The result should look like an official catalog-style product photo
- Output a high quality, clean image`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { media_id, batch_id } = await req.json();
    if (!media_id || !batch_id) {
      return new Response(
        JSON.stringify({ error: "media_id and batch_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 1. Fetch the media record to get public_url
    const { data: media, error: mediaError } = await supabase
      .from("caerhold_media")
      .select("public_url, uploaded_by")
      .eq("id", media_id)
      .single();

    if (mediaError || !media) {
      return new Response(
        JSON.stringify({ error: "Media not found", details: mediaError?.message }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Standardizing portrait for media:", media_id);

    // 2. Call Gemini image edit via Lovable AI Gateway
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: STANDARDIZE_PROMPT },
              { type: "image_url", image_url: { url: media.public_url } },
            ],
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      return new Response(
        JSON.stringify({ error: "AI gateway error", status: aiResponse.status }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const imageDataUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageDataUrl) {
      console.error("No image in AI response:", JSON.stringify(aiData).slice(0, 500));
      return new Response(
        JSON.stringify({ error: "No image returned from AI" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Decode base64 to binary
    const base64Data = imageDataUrl.replace(/^data:image\/\w+;base64,/, "");
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // 4. Upload to storage
    const portraitFileName = `portrait_${crypto.randomUUID()}.png`;
    const storagePath = `caerhold/${batch_id}/${portraitFileName}`;

    const { error: uploadError } = await supabase.storage
      .from("media")
      .upload(storagePath, bytes, { contentType: "image/png" });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return new Response(
        JSON.stringify({ error: "Failed to upload standardized portrait", details: uploadError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: urlData } = supabase.storage.from("media").getPublicUrl(storagePath);

    // 5. Create new media record for the standardized portrait
    const { data: newMedia, error: newMediaError } = await supabase
      .from("caerhold_media")
      .insert({
        type: "image",
        storage_path: storagePath,
        public_url: urlData.publicUrl,
        upload_batch_id: batch_id,
        uploaded_by: media.uploaded_by,
      })
      .select("id, public_url")
      .single();

    if (newMediaError) {
      console.error("Media record error:", newMediaError);
      return new Response(
        JSON.stringify({ error: "Failed to create media record", details: newMediaError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Standardized portrait created:", newMedia.id);

    return new Response(
      JSON.stringify({ media_id: newMedia.id, public_url: newMedia.public_url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("standardize-portrait error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
