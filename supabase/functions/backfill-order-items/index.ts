import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as secp256k1 from "https://esm.sh/@noble/secp256k1@2.1.0";
import { sha256 } from "https://esm.sh/@noble/hashes@1.4.0/sha256";
import { hmac } from "https://esm.sh/@noble/hashes@1.4.0/hmac";

secp256k1.etc.hmacSha256Sync = (key: Uint8Array, ...messages: Uint8Array[]) => {
  const h = hmac.create(sha256, key);
  for (const msg of messages) h.update(msg);
  return h.digest();
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DRGREEN_API_URL = "https://api.drgreennft.com/api/v1";

function cleanBase64(base64: string): string {
  let cleaned = (base64 || '').replace(/[\s\r\n"']/g, '').trim();
  cleaned = cleaned.replace(/-/g, '+').replace(/_/g, '/');
  const paddingNeeded = (4 - (cleaned.length % 4)) % 4;
  if (paddingNeeded > 0 && paddingNeeded < 4) cleaned += '='.repeat(paddingNeeded);
  return cleaned;
}

function base64ToBytes(base64: string): Uint8Array {
  const cleaned = cleanBase64(base64);
  const binaryString = atob(cleaned);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function extractSecp256k1PrivateKey(derBytes: Uint8Array): Uint8Array {
  if (derBytes.length === 32) return derBytes;
  let offset = 0;
  function readLength(): number {
    const firstByte = derBytes[offset++];
    if (firstByte < 0x80) return firstByte;
    const numBytes = firstByte & 0x7f;
    let length = 0;
    for (let i = 0; i < numBytes; i++) length = (length << 8) | derBytes[offset++];
    return length;
  }
  if (derBytes[offset++] !== 0x30) throw new Error('Expected SEQUENCE');
  readLength();
  if (derBytes[offset] === 0x02) {
    offset++;
    const vLen = readLength();
    let version = 0;
    for (let i = 0; i < vLen; i++) version = (version << 8) | derBytes[offset + i];
    offset += vLen;
    if (version === 1) {
      if (derBytes[offset++] !== 0x04) throw new Error('Expected OCTET STRING');
      const keyLen = readLength();
      if (keyLen !== 32) throw new Error(`Expected 32-byte key, got ${keyLen}`);
      return derBytes.slice(offset, offset + 32);
    } else if (version === 0) {
      if (derBytes[offset++] !== 0x30) throw new Error('Expected SEQUENCE');
      const algLen = readLength();
      offset += algLen;
      if (derBytes[offset++] !== 0x04) throw new Error('Expected OCTET STRING');
      readLength();
      if (derBytes[offset++] !== 0x30) throw new Error('Expected SEQUENCE');
      readLength();
      if (derBytes[offset++] !== 0x02) throw new Error('Expected INTEGER');
      const sec1VersionLen = readLength();
      offset += sec1VersionLen;
      if (derBytes[offset++] !== 0x04) throw new Error('Expected OCTET STRING');
      const keyLen = readLength();
      if (keyLen !== 32) throw new Error(`Expected 32-byte key, got ${keyLen}`);
      return derBytes.slice(offset, offset + 32);
    }
  }
  throw new Error('Unsupported key format');
}

function extractPemBase64Body(text: string): string {
  return text
    .replace(/-----BEGIN [A-Z0-9 ]+-----/g, '')
    .replace(/-----END [A-Z0-9 ]+-----/g, '')
    .replace(/-{2,}[^\n]*\n?/g, '')
    .replace(/[\r\n\s]/g, '')
    .trim();
}

async function generateSignature(data: string, base64PrivateKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const secret = (base64PrivateKey || '').trim();
  const decodedSecretBytes = base64ToBytes(secret);
  const decodedAsText = new TextDecoder().decode(decodedSecretBytes);
  const isPem = decodedAsText.includes('-----BEGIN') || decodedAsText.includes('BEGIN') ||
    (decodedSecretBytes.length >= 2 && decodedSecretBytes[0] === 0x2D && decodedSecretBytes[1] === 0x2D);
  let keyDerBytes: Uint8Array;
  if (isPem) {
    const pemBody = extractPemBase64Body(decodedAsText);
    keyDerBytes = base64ToBytes(pemBody);
  } else if (decodedSecretBytes.length >= 150 && decodedSecretBytes.length <= 500) {
    const pemBody = extractPemBase64Body(decodedAsText);
    if (pemBody && pemBody.length > 0) {
      try { keyDerBytes = base64ToBytes(pemBody); } catch { keyDerBytes = decodedSecretBytes; }
    } else { keyDerBytes = decodedSecretBytes; }
  } else { keyDerBytes = decodedSecretBytes; }

  const privateKeyBytes = extractSecp256k1PrivateKey(keyDerBytes);
  const dataBytes = encoder.encode(data);
  const messageHash = sha256(dataBytes);
  const signature = secp256k1.sign(messageHash, privateKeyBytes);
  const compactSig = signature.toCompactRawBytes();
  const r = compactSig.slice(0, 32);
  const s = compactSig.slice(32, 64);

  function integerToDER(val: Uint8Array): Uint8Array {
    let start = 0;
    while (start < val.length - 1 && val[start] === 0) start++;
    const trimmed = val.slice(start);
    const needsPadding = trimmed[0] >= 0x80;
    const result = new Uint8Array((needsPadding ? 1 : 0) + trimmed.length);
    if (needsPadding) result[0] = 0x00;
    result.set(trimmed, needsPadding ? 1 : 0);
    return result;
  }

  const rDer = integerToDER(r);
  const sDer = integerToDER(s);
  const innerLen = 2 + rDer.length + 2 + sDer.length;
  const derSig = new Uint8Array(2 + innerLen);
  derSig[0] = 0x30;
  derSig[1] = innerLen;
  derSig[2] = 0x02;
  derSig[3] = rDer.length;
  derSig.set(rDer, 4);
  derSig[4 + rDer.length] = 0x02;
  derSig[5 + rDer.length] = sDer.length;
  derSig.set(sDer, 6 + rDer.length);
  return bytesToBase64(derSig);
}

async function drGreenGet(endpoint: string, queryParams: Record<string, string | number>): Promise<Response> {
  const apiKey = Deno.env.get("DRGREEN_API_KEY");
  const privateKey = Deno.env.get("DRGREEN_PRIVATE_KEY");
  if (!apiKey || !privateKey) throw new Error("Dr Green API credentials not configured");

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(queryParams)) params.append(key, String(value));
  const queryString = params.toString();

  const signature = await generateSignature(queryString, privateKey);
  const url = `${DRGREEN_API_URL}${endpoint}?${queryString}`;
  console.log(`[backfill] GET ${url}`);

  return fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-auth-apikey": apiKey,
      "x-auth-signature": signature,
    },
  });
}

async function drGreenGetWithBody(endpoint: string, signBody: object): Promise<Response> {
  const apiKey = Deno.env.get("DRGREEN_API_KEY");
  const privateKey = Deno.env.get("DRGREEN_PRIVATE_KEY");
  if (!apiKey || !privateKey) throw new Error("Dr Green API credentials not configured");

  const payload = JSON.stringify(signBody);
  const signature = await generateSignature(payload, privateKey);
  const url = `${DRGREEN_API_URL}${endpoint}`;
  console.log(`[backfill] GET (body-signed) ${url}`);

  return fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-auth-apikey": apiKey,
      "x-auth-signature": signature,
    },
  });
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

interface OrderLineItem {
  strain_id: string;
  strain_name: string;
  quantity: number;
  unit_price: number;
}

function extractOrderLines(orderDetail: Record<string, unknown>): OrderLineItem[] {
  const orderLines = (orderDetail.orderLines || orderDetail.order_lines || []) as Record<string, unknown>[];
  if (!Array.isArray(orderLines) || orderLines.length === 0) return [];

  return orderLines.map((line: Record<string, unknown>) => {
    const strain = line.strain as Record<string, unknown> | undefined;
    return {
      strain_id: (strain?.id || line.strainId || line.strain_id || '') as string,
      strain_name: (strain?.name || line.strainName || line.strain_name || '') as string,
      quantity: (line.quantity || line.grams || 0) as number,
      unit_price: (line.unitPrice || line.unit_price || line.price || 0) as number,
    };
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("[backfill] Starting order items backfill...");

    // Fetch all orders — we'll filter in code since JSONB filtering is complex
    const { data: allOrders, error: fetchErr } = await supabase
      .from('drgreen_orders')
      .select('id, drgreen_order_id, items, total_amount')
      .order('created_at', { ascending: false });

    if (fetchErr) throw new Error(`DB fetch error: ${fetchErr.message}`);

    // Filter orders needing backfill: items empty, or items have zero unit_price or missing strain_name
    const needsBackfill = (allOrders || []).filter((order: Record<string, unknown>) => {
      const items = order.items as Record<string, unknown>[];
      if (!Array.isArray(items) || items.length === 0) return true;
      return items.some((item: Record<string, unknown>) =>
        !item.unit_price || (item.unit_price as number) === 0 || !item.strain_name || item.strain_name === ''
      );
    });

    console.log(`[backfill] Found ${needsBackfill.length} orders needing backfill out of ${(allOrders || []).length} total`);

    let backfilled = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const order of needsBackfill) {
      try {
        const response = await drGreenGetWithBody(`/dapp/orders/${order.drgreen_order_id}`, { orderId: order.drgreen_order_id });
        if (!response.ok) {
          const errText = await response.text();
          errors.push(`${order.drgreen_order_id}: API ${response.status} - ${errText}`);
          failed++;
          await delay(500);
          continue;
        }

        const data = await response.json();
        const orderDetail = data?.data || data;

        // Log the full response to understand structure
        console.log(`[backfill] ${order.drgreen_order_id}: Full response:`, JSON.stringify(orderDetail).slice(0, 1000));

        const enrichedItems = extractOrderLines(orderDetail);

        if (enrichedItems.length === 0) {
          // If API also has no line items, build fallback from existing data
          console.log(`[backfill] ${order.drgreen_order_id}: No orderLines in detail response, skipping`);
          await delay(300);
          continue;
        }

        const { error: updateErr } = await supabase
          .from('drgreen_orders')
          .update({
            items: enrichedItems,
            updated_at: new Date().toISOString(),
          })
          .eq('id', order.id);

        if (updateErr) {
          errors.push(`${order.drgreen_order_id}: DB update - ${updateErr.message}`);
          failed++;
        } else {
          backfilled++;
          console.log(`[backfill] ${order.drgreen_order_id}: Updated with ${enrichedItems.length} line items`);
        }

        // Rate limit: 300ms between calls
        await delay(300);
      } catch (err) {
        errors.push(`${order.drgreen_order_id}: ${err instanceof Error ? err.message : 'Unknown'}`);
        failed++;
      }
    }

    console.log(`[backfill] Complete: ${backfilled} backfilled, ${failed} failed`);

    return new Response(
      JSON.stringify({ success: true, backfilled, failed, total: needsBackfill.length, errors }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error("[backfill] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
