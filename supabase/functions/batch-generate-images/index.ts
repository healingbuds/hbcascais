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
      return new Response(
        JSON.stringify({ error: "Supabase credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch all strains from the database
    const { data: strains, error: strainsError } = await supabase
      .from("strains")
      .select("id, name, image_url")
      .eq("is_archived", false)
      .limit(10);

    if (strainsError) {
      console.error("Error fetching strains:", strainsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch strains" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${strains?.length || 0} strains to process`);

    const results: { productId: string; productName: string; status: string; imageUrl?: string; error?: string }[] = [];
    
    // Process each strain
    for (const strain of strains || []) {
      console.log(`Processing strain: ${strain.name} (${strain.id})`);
      
      try {
        // Call the generate-product-image function
        const generateResponse = await fetch(`${SUPABASE_URL}/functions/v1/generate-product-image`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({
            productId: strain.id,
            productName: strain.name,
            originalImageUrl: strain.image_url,
          }),
        });

        const generateData = await generateResponse.json();

        if (generateResponse.ok) {
          results.push({
            productId: strain.id,
            productName: strain.name,
            status: generateData.cached ? "cached" : "generated",
            imageUrl: generateData.imageUrl,
          });
        } else {
          results.push({
            productId: strain.id,
            productName: strain.name,
            status: "error",
            error: generateData.error || "Unknown error",
          });
        }

        // Add a small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`Error processing ${strain.name}:`, error);
        results.push({
          productId: strain.id,
          productName: strain.name,
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const summary = {
      total: results.length,
      generated: results.filter(r => r.status === "generated").length,
      cached: results.filter(r => r.status === "cached").length,
      errors: results.filter(r => r.status === "error").length,
    };

    console.log("Batch generation complete:", summary);

    return new Response(
      JSON.stringify({ results, summary }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in batch-generate-images:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
