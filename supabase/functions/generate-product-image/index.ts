import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productId, productName, originalImageUrl } = await req.json();
    
    if (!productId || !productName) {
      console.error("Missing required fields:", { productId, productName });
      return new Response(
        JSON.stringify({ error: "Product ID and name are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Generating branded image for product: ${productName} (${productId})`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Supabase credentials not configured");
      return new Response(
        JSON.stringify({ error: "Supabase credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check if we already have a generated image for this product
    const { data: existingImage, error: checkError } = await supabase
      .from("generated_product_images")
      .select("*")
      .eq("product_id", productId)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking existing image:", checkError);
    }

    if (existingImage) {
      console.log(`Found existing generated image for ${productName}`);
      return new Response(
        JSON.stringify({ 
          imageUrl: existingImage.generated_image_url,
          cached: true 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use the jar template as base and edit it to add cannabis buds
    // First, get the jar template image from storage or use embedded base64
    const jarTemplateUrl = `${SUPABASE_URL}/storage/v1/object/public/product-images/jar-template.jpg`;
    
    // Fetch the jar template
    let jarTemplateBase64 = "";
    try {
      const templateResponse = await fetch(jarTemplateUrl);
      if (templateResponse.ok) {
        const templateBuffer = await templateResponse.arrayBuffer();
        jarTemplateBase64 = btoa(String.fromCharCode(...new Uint8Array(templateBuffer)));
      }
    } catch (e) {
      console.log("Could not fetch jar template, will generate from scratch");
    }

    const editPrompt = `Edit this medical cannabis jar image to add dense, frosty, high-quality cannabis buds of the "${productName}" strain inside the jar.

REQUIREMENTS:
- Keep the exact jar design, lid, labels, and branding unchanged
- Fill the jar approximately 60-70% with realistic cannabis buds
- Buds should show visible trichomes, rich green coloring with hints of purple/orange
- Maintain the clean white background and professional lighting
- Keep the "powered by Dr. Green" text and HB logo visible
- Result should be 4K crystal-clear product photography quality
- The buds should look dense, fresh, and premium quality`;

    const generatePrompt = `Create a photorealistic, 4K ultra-high-definition product photograph of a premium medical cannabis glass jar with these EXACT specifications:

JAR STYLE:
- Clear glass squat jar (short and wide, NOT tall) with rounded edges
- White ribbed plastic screw-top lid
- On the lid: dark green circular badge with white "HB" medical leaf logo centered

LABELING:
- Green diagonal stripe label wrapping around the jar
- Clean white label area with strain name "${productName}" in elegant typography
- Small "powered by Dr. Green" text at the bottom of the jar label

CONTENTS:
- Dense, frosty, high-quality cannabis buds of the "${productName}" strain visible through the clear glass
- Buds should show visible trichomes, rich green coloring
- Jar should be approximately 60-70% full with buds

PHOTOGRAPHY STYLE:
- Clean white/light gray gradient background
- Soft studio lighting with gentle shadows
- Front-facing view showing main label clearly
- 4K crystal-clear product photography
- Professional medical/pharmaceutical aesthetic`;

    console.log("Calling Lovable AI for image generation...");

    // Build the request based on whether we have a template
    const messageContent: any[] = [
      {
        type: "text",
        text: jarTemplateBase64 ? editPrompt : generatePrompt,
      },
    ];

    // If we have the jar template, include it for editing
    if (jarTemplateBase64) {
      messageContent.push({
        type: "image_url",
        image_url: {
          url: `data:image/jpeg;base64,${jarTemplateBase64}`,
        },
      });
      console.log("Using jar template for image editing");
    } else {
      console.log("Generating image from scratch (no template found)");
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: messageContent,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("Lovable AI error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add funds to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to generate image" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    console.log("AI response received");

    // Extract the base64 image from the response
    const imageData = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageData) {
      console.error("No image in AI response:", JSON.stringify(aiData).slice(0, 500));
      return new Response(
        JSON.stringify({ error: "No image generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract base64 data (remove data:image/png;base64, prefix if present)
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    // Generate filename
    const safeProductName = productName.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const filename = `${safeProductName}-${productId.slice(0, 8)}.png`;

    console.log(`Uploading image to storage: ${filename}`);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(filename, imageBuffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(
        JSON.stringify({ error: "Failed to upload image" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(filename);

    const generatedImageUrl = publicUrlData.publicUrl;
    console.log(`Image uploaded successfully: ${generatedImageUrl}`);

    // Save to database for caching
    const { error: insertError } = await supabase
      .from("generated_product_images")
      .upsert({
        product_id: productId,
        product_name: productName,
        original_image_url: originalImageUrl || null,
        generated_image_url: generatedImageUrl,
        generated_at: new Date().toISOString(),
      }, { onConflict: "product_id" });

    if (insertError) {
      console.error("Database insert error:", insertError);
      // Don't fail the request, image was still generated and uploaded
    }

    return new Response(
      JSON.stringify({ 
        imageUrl: generatedImageUrl,
        cached: false 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-product-image:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
