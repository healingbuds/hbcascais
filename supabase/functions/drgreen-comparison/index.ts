import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as secp256k1 from "https://esm.sh/@noble/secp256k1@2.1.0";
import { sha256 } from "https://esm.sh/@noble/hashes@1.4.0/sha256";
import { hmac } from "https://esm.sh/@noble/hashes@1.4.0/hmac";

// Initialize secp256k1 with the required HMAC-SHA256 function
secp256k1.etc.hmacSha256Sync = (key: Uint8Array, ...messages: Uint8Array[]) => {
  const h = hmac.create(sha256, key);
  for (const msg of messages) h.update(msg);
  return h.digest();
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Environment configurations
interface EnvConfig {
  apiUrl: string;
  apiKeyEnv: string;
  privateKeyEnv: string;
  name: string;
}

// Environment configurations - supports multiple staging environments
const ENV_CONFIG: Record<string, EnvConfig> = {
  production: {
    apiUrl: 'https://api.drgreennft.com/api/v1',
    apiKeyEnv: 'DRGREEN_API_KEY',
    privateKeyEnv: 'DRGREEN_PRIVATE_KEY',
    name: 'Production',
  },
  staging: {
    apiUrl: 'https://stage-api.drgreennft.com/api/v1', // Official staging URL
    apiKeyEnv: 'DRGREEN_STAGING_API_KEY',
    privateKeyEnv: 'DRGREEN_STAGING_PRIVATE_KEY',
    name: 'Staging (Official)',
  },
  railway: {
    apiUrl: 'https://budstack-backend-main-development.up.railway.app/api/v1', // Dev instance
    apiKeyEnv: 'DRGREEN_STAGING_API_KEY',
    privateKeyEnv: 'DRGREEN_STAGING_PRIVATE_KEY',
    name: 'Railway (Dev)',
  },
};

// Valid data types for comparison
type DataType = 'strains' | 'clients' | 'orders' | 'sales' | 'clientsSummary' | 'salesSummary' | 'userNfts';

// Base64 utilities
function cleanBase64(base64: string): string {
  let cleaned = (base64 || '').replace(/[\s\r\n"']/g, '').trim();
  cleaned = cleaned.replace(/-/g, '+').replace(/_/g, '/');
  const paddingNeeded = (4 - (cleaned.length % 4)) % 4;
  if (paddingNeeded > 0 && paddingNeeded < 4) {
    cleaned += '='.repeat(paddingNeeded);
  }
  return cleaned;
}

function base64ToBytes(base64: string): Uint8Array {
  const cleaned = cleanBase64(base64);
  const binaryString = atob(cleaned);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Extract 32-byte private key from PKCS#8
function extractSecp256k1PrivateKey(pkcs8Der: Uint8Array): Uint8Array {
  let offset = 0;

  function readLength(): number {
    const firstByte = pkcs8Der[offset++];
    if (firstByte < 0x80) return firstByte;
    const numBytes = firstByte & 0x7f;
    let length = 0;
    for (let i = 0; i < numBytes; i++) {
      length = (length << 8) | pkcs8Der[offset++];
    }
    return length;
  }

  if (pkcs8Der[offset++] !== 0x30) throw new Error('Expected SEQUENCE');
  readLength();
  if (pkcs8Der[offset++] !== 0x02) throw new Error('Expected INTEGER (version)');
  const versionLen = readLength();
  offset += versionLen;
  if (pkcs8Der[offset++] !== 0x30) throw new Error('Expected SEQUENCE (algorithm)');
  const algLen = readLength();
  offset += algLen;
  if (pkcs8Der[offset++] !== 0x04) throw new Error('Expected OCTET STRING');
  readLength();
  if (pkcs8Der[offset++] !== 0x30) throw new Error('Expected SEQUENCE (SEC1)');
  readLength();
  if (pkcs8Der[offset++] !== 0x02) throw new Error('Expected INTEGER (SEC1 version)');
  const sec1VersionLen = readLength();
  offset += sec1VersionLen;
  if (pkcs8Der[offset++] !== 0x04) throw new Error('Expected OCTET STRING (private key)');
  const keyLen = readLength();

  if (keyLen !== 32) {
    throw new Error(`Expected 32-byte private key, got ${keyLen}`);
  }

  return pkcs8Der.slice(offset, offset + 32);
}

// Generate secp256k1 signature
async function signPayload(data: string, privateKeyInput: string): Promise<string> {
  const encoder = new TextEncoder();
  const secret = (privateKeyInput || '').trim();
  
  let keyDerBytes: Uint8Array;
  
  // Check if the key is already in PEM format (not base64-encoded)
  if (secret.includes('-----BEGIN')) {
    // Key is already PEM format, extract the base64 body
    const pemBody = secret
      .replace(/-----BEGIN [A-Z0-9 ]+-----/g, '')
      .replace(/-----END [A-Z0-9 ]+-----/g, '')
      .replace(/[\r\n\s]/g, '')
      .trim();
    keyDerBytes = base64ToBytes(pemBody);
  } else {
    // Try to decode as base64, then check if result is PEM
    try {
      const decodedSecretBytes = base64ToBytes(secret);
      const decodedAsText = new TextDecoder().decode(decodedSecretBytes);
      
      if (decodedAsText.includes('-----BEGIN')) {
        // It was a base64-encoded PEM
        const pemBody = decodedAsText
          .replace(/-----BEGIN [A-Z0-9 ]+-----/g, '')
          .replace(/-----END [A-Z0-9 ]+-----/g, '')
          .replace(/[\r\n\s]/g, '')
          .trim();
        keyDerBytes = base64ToBytes(pemBody);
      } else {
        // It's raw base64-encoded DER
        keyDerBytes = decodedSecretBytes;
      }
    } catch (e) {
      throw new Error('Failed to decode private key - invalid format');
    }
  }

  const privateKeyBytes = extractSecp256k1PrivateKey(keyDerBytes);
  const dataBytes = encoder.encode(data);
  const messageHash = sha256(dataBytes);
  const signature = secp256k1.sign(messageHash, privateKeyBytes);
  const compactSig = signature.toCompactRawBytes();
  
  // Convert to DER
  const r = compactSig.slice(0, 32);
  const s = compactSig.slice(32, 64);

  function integerToDER(val: Uint8Array): Uint8Array {
    let start = 0;
    while (start < val.length - 1 && val[start] === 0) start++;
    const needsPadding = val[start] >= 0x80;
    const len = val.length - start + (needsPadding ? 1 : 0);
    const result = new Uint8Array(2 + len);
    result[0] = 0x02;
    result[1] = len;
    if (needsPadding) {
      result[2] = 0x00;
      result.set(val.slice(start), 3);
    } else {
      result.set(val.slice(start), 2);
    }
    return result;
  }

  const rDer = integerToDER(r);
  const sDer = integerToDER(s);
  const totalLen = rDer.length + sDer.length;
  const derSignature = new Uint8Array(2 + totalLen);
  derSignature[0] = 0x30;
  derSignature[1] = totalLen;
  derSignature.set(rDer, 2);
  derSignature.set(sDer, 2 + rDer.length);

  return bytesToBase64(derSignature);
}

// Make API request with query string signing
async function makeApiRequest(
  config: EnvConfig,
  apiKey: string,
  privateKey: string,
  endpoint: string,
  method: string,
  body?: Record<string, unknown>,
  queryParams?: Record<string, string>
): Promise<{ data: unknown; responseTime: number; status: number }> {
  const startTime = Date.now();

  let url = `${config.apiUrl}${endpoint}`;
  let signatureData: string;

  if (queryParams && Object.keys(queryParams).length > 0) {
    const queryString = new URLSearchParams(queryParams).toString();
    url = `${url}?${queryString}`;
    signatureData = queryString;
  } else if (body) {
    signatureData = JSON.stringify(body);
  } else {
    signatureData = '';
  }

  const signature = await signPayload(signatureData, privateKey);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-auth-apikey': apiKey,
    'x-auth-signature': signature,
  };

  const fetchOptions: RequestInit = {
    method,
    headers,
  };

  if (body && method !== 'GET') {
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(url, fetchOptions);
  const responseTime = Date.now() - startTime;
  
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    data = await response.text();
  }

  return { data, responseTime, status: response.status };
}

// Get endpoint configuration based on data type
function getEndpointConfig(dataType: DataType, countryCode: string): {
  endpoint: string;
  method: string;
  queryParams?: Record<string, string>;
} {
  switch (dataType) {
    case 'strains':
      return {
        endpoint: '/strains',
        method: 'GET',
        queryParams: {
          countryCode: countryCode,
          orderBy: 'desc',
          take: '50',
          page: '1',
        },
      };
    case 'clients':
      return {
        endpoint: '/dapp/clients',
        method: 'GET',
        queryParams: {
          orderBy: 'desc',
          take: '10',
          page: '1',
        },
      };
    case 'orders':
      return {
        endpoint: '/dapp/orders',
        method: 'GET',
        queryParams: {
          orderBy: 'desc',
          take: '10',
          page: '1',
        },
      };
    case 'sales':
      return {
        endpoint: '/dapp/sales',
        method: 'GET',
        queryParams: {
          orderBy: 'desc',
          take: '10',
          page: '1',
        },
      };
    case 'clientsSummary':
      return {
        endpoint: '/dapp/clients/summary',
        method: 'GET',
      };
    case 'salesSummary':
      return {
        endpoint: '/dapp/sales/summary',
        method: 'GET',
      };
    case 'userNfts':
      return {
        endpoint: '/dapp/users/nfts',
        method: 'GET',
      };
    default:
      throw new Error(`Unknown dataType: ${dataType}`);
  }
}

// Normalize response data based on type
function normalizeResponse(
  dataType: DataType,
  responseData: Record<string, unknown>,
  status: number
): { normalizedData: unknown[]; itemCount: number; summary?: Record<string, unknown> } {
  if (status !== 200 || !responseData) {
    return { normalizedData: [], itemCount: 0 };
  }

  const dataObj = responseData.data as Record<string, unknown> | undefined;
  const pageInfo = dataObj?.pageMetaDto as Record<string, unknown> | undefined;

  switch (dataType) {
    case 'strains': {
      let normalizedData: unknown[] = [];
      if (dataObj?.strains && Array.isArray(dataObj.strains)) {
        normalizedData = dataObj.strains;
      } else if (Array.isArray(responseData.data)) {
        normalizedData = responseData.data;
      }
      const itemCount = Number(pageInfo?.itemCount) || normalizedData.length;
      return { normalizedData, itemCount };
    }
    case 'clients': {
      let normalizedData: unknown[] = [];
      if (dataObj?.clients && Array.isArray(dataObj.clients)) {
        normalizedData = dataObj.clients;
      } else if (Array.isArray(responseData.data)) {
        normalizedData = responseData.data;
      }
      const itemCount = Number(pageInfo?.itemCount) || normalizedData.length;
      return { normalizedData, itemCount };
    }
    case 'orders': {
      let normalizedData: unknown[] = [];
      if (dataObj?.orders && Array.isArray(dataObj.orders)) {
        normalizedData = dataObj.orders;
      } else if (Array.isArray(responseData.data)) {
        normalizedData = responseData.data;
      }
      const itemCount = Number(pageInfo?.itemCount) || normalizedData.length;
      return { normalizedData, itemCount };
    }
    case 'sales': {
      let normalizedData: unknown[] = [];
      if (dataObj?.sales && Array.isArray(dataObj.sales)) {
        normalizedData = dataObj.sales;
      } else if (Array.isArray(responseData.data)) {
        normalizedData = responseData.data;
      }
      const itemCount = Number(pageInfo?.itemCount) || normalizedData.length;
      return { normalizedData, itemCount };
    }
    case 'clientsSummary': {
      // Returns summary object, not array
      const summary = dataObj?.summary as Record<string, unknown> | undefined;
      return {
        normalizedData: [],
        itemCount: Number(summary?.totalCount) || 0,
        summary: summary,
      };
    }
    case 'salesSummary': {
      // Returns summary object, not array
      const summary = dataObj?.summary as Record<string, unknown> | undefined;
      return {
        normalizedData: [],
        itemCount: Number(summary?.totalCount) || Number(dataObj?.count) || 0,
        summary: summary,
      };
    }
    case 'userNfts': {
      let normalizedData: unknown[] = [];
      if (dataObj?.nfts && Array.isArray(dataObj.nfts)) {
        normalizedData = dataObj.nfts;
      }
      const itemCount = Number(pageInfo?.itemCount) || normalizedData.length;
      return { normalizedData, itemCount };
    }
    default:
      return { normalizedData: [], itemCount: 0 };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { environment, dataType, countryCode = 'ZAF', stage } = await req.json();

    // Validate environment - now supports 'production', 'staging', 'railway'
    const validEnvironments = Object.keys(ENV_CONFIG);
    if (!environment || !validEnvironments.includes(environment)) {
      return new Response(
        JSON.stringify({ 
          error: `Invalid environment. Use one of: ${validEnvironments.join(', ')}`,
          validEnvironments 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate data type
    const validDataTypes: DataType[] = ['strains', 'clients', 'orders', 'sales', 'clientsSummary', 'salesSummary', 'userNfts'];
    if (!dataType || !validDataTypes.includes(dataType)) {
      return new Response(
        JSON.stringify({ 
          error: `Invalid dataType. Use one of: ${validDataTypes.join(', ')}`,
          validDataTypes 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const config = ENV_CONFIG[environment];
    const apiKey = Deno.env.get(config.apiKeyEnv);
    const privateKey = Deno.env.get(config.privateKeyEnv);

    if (!apiKey || !privateKey) {
      return new Response(
        JSON.stringify({ 
          error: `Missing credentials for ${environment}`,
          missingApiKey: !apiKey,
          missingPrivateKey: !privateKey,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get endpoint configuration
    const endpointConfig = getEndpointConfig(dataType, countryCode);
    
    // Add stage filter for sales if provided
    if (dataType === 'sales' && stage && ['LEADS', 'ONGOING', 'CLOSED'].includes(stage)) {
      endpointConfig.queryParams = { ...endpointConfig.queryParams, stage };
    }

    const result = await makeApiRequest(
      config,
      apiKey,
      privateKey,
      endpointConfig.endpoint,
      endpointConfig.method,
      undefined,
      endpointConfig.queryParams
    );

    // Normalize response
    const { normalizedData, itemCount, summary } = normalizeResponse(
      dataType,
      result.data as Record<string, unknown>,
      result.status
    );

    return new Response(
      JSON.stringify({
        environment,
        environmentName: config.name,
        dataType,
        apiUrl: config.apiUrl,
        status: result.status,
        success: result.status === 200,
        responseTime: result.responseTime,
        itemCount,
        data: normalizedData,
        summary: summary || null,
        rawResponse: result.data,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Comparison error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
