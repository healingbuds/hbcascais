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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing Supabase credentials");
      return new Response(
        JSON.stringify({ error: "Supabase credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse request body for optional parameters
    const body = await req.json().catch(() => ({}));
    const { imageUrl, logoType = 'teal' } = body;

    let imageBytes: Uint8Array;
    const fileName = logoType === 'white' ? 'hb-logo-white.png' : 'hb-logo-teal.png';

    if (imageUrl) {
      // Fetch image from provided URL
      console.log(`Fetching image from: ${imageUrl}`);
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      imageBytes = new Uint8Array(arrayBuffer);
    } else {
      // Use embedded teal logo (Healing Buds green logo)
      const tealLogoBase64 = "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";
      const binaryString = atob(tealLogoBase64);
      imageBytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        imageBytes[i] = binaryString.charCodeAt(i);
      }
    }

    console.log(`Uploading ${fileName} to email-assets bucket (${imageBytes.length} bytes)`);

    // Upload to storage
    const { data, error } = await supabase.storage
      .from("email-assets")
      .upload(fileName, imageBytes, {
        contentType: "image/png",
        upsert: true,
      });

    if (error) {
      console.error("Upload error:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("email-assets")
      .getPublicUrl(fileName);

    console.log("Logo uploaded successfully:", urlData.publicUrl);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `${fileName} uploaded to email-assets bucket`,
        url: urlData.publicUrl
      }),
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
