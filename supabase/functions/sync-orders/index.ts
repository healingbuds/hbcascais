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
  console.log(`[sync-orders] GET ${url}`);

  return fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-auth-apikey": apiKey,
      "x-auth-signature": signature,
    },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting order sync from Dr Green API...");

    let allOrders: any[] = [];
    let page = 1;
    const take = 50;
    let hasMore = true;

    while (hasMore) {
      const response = await drGreenGet("/dapp/orders", { orderBy: 'desc', take, page });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const orders = data?.data?.orders || [];
      const total = data?.data?.pageMetaDto?.totalCount || data?.data?.total || 0;

      allOrders = [...allOrders, ...orders];
      hasMore = allOrders.length < total && orders.length > 0;
      page++;
      if (page > 20) break;
    }

    console.log(`Fetched ${allOrders.length} orders from Dr Green API`);

    // Build lookup map from local drgreen_clients for enrichment
    const clientIds = new Set<string>();
    for (const order of allOrders) {
      const cid = order.client?.id || order.clientId;
      if (cid) clientIds.add(cid);
    }

    const clientLookup: Record<string, any> = {};
    if (clientIds.size > 0) {
      const { data: localClients } = await supabase
        .from('drgreen_clients')
        .select('drgreen_client_id, email, full_name, user_id, country_code, shipping_address')
        .in('drgreen_client_id', Array.from(clientIds));

      if (localClients) {
        for (const c of localClients) {
          clientLookup[c.drgreen_client_id] = c;
        }
      }
      console.log(`[sync-orders] Loaded ${Object.keys(clientLookup).length} local client records for enrichment`);
    }

    let synced = 0;
    const errors: string[] = [];

    const alpha3to2: Record<string, string> = { ZAF: 'ZA', PRT: 'PT', GBR: 'GB', THA: 'TH', USA: 'US', DEU: 'DE', FRA: 'FR', ESP: 'ES', ITA: 'IT', NLD: 'NL', BEL: 'BE', AUT: 'AT', CHE: 'CH', BRA: 'BR', MOZ: 'MZ', AGO: 'AO' };

    for (const order of allOrders) {
      try {
        const ordClientId = order.client?.id || order.clientId || null;
        const local = ordClientId ? clientLookup[ordClientId] : null;

        // Customer name: API first, then local client
        const apiName = order.client
          ? [order.client.firstName, order.client.lastName].filter(Boolean).join(' ')
          : order.customerName || null;
        const customerName = apiName || (local?.full_name ?? null);

        // Customer email: API first, then local client
        const customerEmail = order.client?.email || order.customerEmail || (local?.email ?? null);

        // Country code with alpha-3 → alpha-2 conversion
        const rawCountryCode = order.shipping?.countryCode || order.client?.shippings?.[0]?.countryCode || null;
        const apiCountryCode = rawCountryCode ? (alpha3to2[rawCountryCode] || rawCountryCode) : null;
        const countryCode = apiCountryCode || (local?.country_code ?? null);

        // Shipping address: API first, then local client
        const shippingAddress = order.shipping || (local?.shipping_address ?? null);

        // user_id from local client record
        const userId = local?.user_id ?? null;

        // Build items array from orderLines count
        const itemCount = order._count?.orderLines || 0;
        const items = itemCount > 0
          ? [{ quantity: order.totalQuantity || itemCount, totalPrice: order.totalPrice || 0 }]
          : [];

        // Use localPrice for proper currency amount, fallback to totalAmount
        const rawTotal = order.localPrice?.totalAmount ?? order.totalAmount ?? 0;
        const totalAmount = typeof rawTotal === 'number' ? rawTotal : (parseFloat(rawTotal) || 0);
        const currency = order.localPrice?.currency || order.shipping?.currency || order.currency || 'ZAR';

        const { error: upsertError } = await supabase
          .from('drgreen_orders')
          .upsert({
            drgreen_order_id: order.id,
            invoice_number: order.invoiceNumber || null,
            status: order.orderStatus || order.status || 'PENDING',
            payment_status: order.paymentStatus || 'PENDING',
            total_amount: totalAmount,
            items: items,
            customer_name: customerName,
            customer_email: customerEmail,
            client_id: ordClientId,
            country_code: countryCode,
            currency: currency,
            shipping_address: shippingAddress,
            user_id: userId,
            sync_status: 'synced',
            synced_at: new Date().toISOString(),
            created_at: order.createdAt || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'drgreen_order_id' });

        if (upsertError) {
          errors.push(`${order.id}: ${upsertError.message}`);
        } else {
          synced++;
        }
      } catch (err) {
        errors.push(`${order.id}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    console.log(`Sync complete: ${synced} synced, ${errors.length} errors`);

    return new Response(
      JSON.stringify({ success: true, synced, errors, total: allOrders.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error("Sync orders error:", error);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
