import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DRGREEN_API_URL = "https://api.drgreennft.com/api/v1";
const API_TIMEOUT_MS = 10000;

// Minimal logging for health checks
function logInfo(message: string) {
  console.log(`[Health] ${message}`);
}

function logError(message: string) {
  console.error(`[Health] ${message}`);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const checks: Record<string, { status: string; message?: string; duration?: number }> = {};

  try {
    // Check 1: API credentials configured
    const apiKey = Deno.env.get("DRGREEN_API_KEY");
    const secretKey = Deno.env.get("DRGREEN_PRIVATE_KEY");
    
    checks.credentials = {
      status: apiKey && secretKey ? "ok" : "error",
      message: apiKey && secretKey 
        ? "API credentials configured" 
        : "Missing API credentials",
    };

    if (!apiKey || !secretKey) {
      return new Response(
        JSON.stringify({
          status: "unhealthy",
          checks,
          timestamp: new Date().toISOString(),
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check 2: API connectivity (simple GET request to strains endpoint)
    const connectivityStart = Date.now();
    try {
      // Build query string for signing
      const queryParams = "orderBy=desc&take=1&page=1";
      
      // Decode secret key if it's Base64-encoded
      const encoder = new TextEncoder();
      let keyBytes: Uint8Array;
      const isBase64Key = /^[A-Za-z0-9+/]+=*$/.test(secretKey) && secretKey.length % 4 === 0;
      if (isBase64Key) {
        try {
          const binaryString = atob(secretKey);
          keyBytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            keyBytes[i] = binaryString.charCodeAt(i);
          }
        } catch {
          keyBytes = encoder.encode(secretKey);
        }
      } else {
        keyBytes = encoder.encode(secretKey);
      }
      
      const cryptoKey = await crypto.subtle.importKey(
        "raw",
        keyBytes.buffer as ArrayBuffer,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(queryParams));
      const signatureBytes = new Uint8Array(signatureBuffer);
      // Convert to Base64 (as per API specification)
      let binary = '';
      for (let i = 0; i < signatureBytes.byteLength; i++) {
        binary += String.fromCharCode(signatureBytes[i]);
      }
      const signature = btoa(binary);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

      const response = await fetch(`${DRGREEN_API_URL}/strains?${queryParams}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-auth-apikey": apiKey,
          "x-auth-signature": signature,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const connectivityDuration = Date.now() - connectivityStart;

      if (response.ok) {
        const data = await response.json();
        checks.api_connectivity = {
          status: "ok",
          message: `API reachable`,
          duration: connectivityDuration,
        };
      } else {
        checks.api_connectivity = {
          status: "warning",
          message: `API returned ${response.status}`,
          duration: connectivityDuration,
        };
      }
    } catch (connError) {
      const errorMessage = connError instanceof Error ? connError.message : "Unknown error";
      checks.api_connectivity = {
        status: "error",
        message: `API unreachable`,
        duration: Date.now() - connectivityStart,
      };
      logError(`API connectivity check failed: ${errorMessage}`);
    }

    // Determine overall health
    const allOk = Object.values(checks).every(c => c.status === "ok");
    const hasError = Object.values(checks).some(c => c.status === "error");

    logInfo(`Health check completed: ${allOk ? 'healthy' : hasError ? 'unhealthy' : 'degraded'}`);

    return new Response(
      JSON.stringify({
        status: allOk ? "healthy" : hasError ? "unhealthy" : "degraded",
        checks,
        totalDuration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      }),
      { 
        status: allOk ? 200 : hasError ? 503 : 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logError(`Health check error: ${errorMessage}`);
    
    return new Response(
      JSON.stringify({
        status: "error",
        message: "Health check failed",
        timestamp: new Date().toISOString(),
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
