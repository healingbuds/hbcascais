import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as secp256k1 from "https://esm.sh/@noble/secp256k1@1.7.1";
import { hmac } from "https://esm.sh/@noble/hashes@1.3.0/hmac";
import { sha256 } from "https://esm.sh/@noble/hashes@1.3.0/sha256";

// Configure noble secp256k1 to use hmac for signing
secp256k1.utils.hmacSha256Sync = (key: Uint8Array, ...messages: Uint8Array[]) => {
  const combined = new Uint8Array(messages.reduce((acc, m) => acc + m.length, 0));
  let offset = 0;
  for (const msg of messages) {
    combined.set(msg, offset);
    offset += msg.length;
  }
  return hmac(sha256, key, combined);
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Environment = 'production' | 'staging' | 'railway';

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'skip';
  duration: number;
  message?: string;
  details?: Record<string, unknown>;
}

interface TestSuiteResult {
  suite: string;
  environment: Environment;
  timestamp: string;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  results: TestResult[];
}

// Environment configuration
interface EnvConfig {
  apiUrl: string;
  apiKeyEnv: string;
  privateKeyEnv: string;
}

const ENV_CONFIG: Record<Environment, EnvConfig> = {
  production: {
    apiUrl: 'https://api.drgreennft.com/api/v1',
    apiKeyEnv: 'DRGREEN_API_KEY',
    privateKeyEnv: 'DRGREEN_PRIVATE_KEY',
  },
  staging: {
    apiUrl: 'https://stage-api.drgreennft.com/api/v1',
    apiKeyEnv: 'DRGREEN_STAGING_API_KEY',
    privateKeyEnv: 'DRGREEN_STAGING_PRIVATE_KEY',
  },
  railway: {
    apiUrl: 'https://budstack-backend-main-development.up.railway.app/api/v1',
    apiKeyEnv: 'DRGREEN_STAGING_API_KEY',
    privateKeyEnv: 'DRGREEN_STAGING_PRIVATE_KEY',
  },
};

// Get environment config
function getEnvConfig(env: Environment): EnvConfig {
  return ENV_CONFIG[env];
}

// Check if environment is configured
function isEnvironmentConfigured(env: Environment): { configured: boolean; apiKey: boolean; privateKey: boolean; apiUrl: string } {
  const config = getEnvConfig(env);
  const apiKey = Deno.env.get(config.apiKeyEnv);
  const privateKey = Deno.env.get(config.privateKeyEnv);
  
  return {
    configured: Boolean(apiKey && privateKey),
    apiKey: Boolean(apiKey),
    privateKey: Boolean(privateKey),
    apiUrl: config.apiUrl,
  };
}

// Helper: Base64 decode
function base64ToBytes(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Helper: Sign request payload for Dr. Green API
async function signPayload(payload: string, env: Environment): Promise<string | null> {
  const config = getEnvConfig(env);
  const privateKeyB64 = Deno.env.get(config.privateKeyEnv);
  
  if (!privateKeyB64) {
    console.error(`[SIGN] No private key found for ${env}`);
    return null;
  }
  
  try {
    // Decode PEM-encoded key
    const pemContent = new TextDecoder().decode(base64ToBytes(privateKeyB64));
    const keyMatch = pemContent.match(/-----BEGIN (?:EC )?PRIVATE KEY-----\s*([\s\S]+?)\s*-----END (?:EC )?PRIVATE KEY-----/);
    
    if (!keyMatch) {
      console.error('[SIGN] Invalid PEM format');
      return null;
    }
    
    const keyB64 = keyMatch[1].replace(/\s/g, '');
    const keyDer = base64ToBytes(keyB64);
    
    // Extract private key from DER
    let privateKeyBytes: Uint8Array;
    if (keyDer.length === 32) {
      privateKeyBytes = keyDer;
    } else if (keyDer.length >= 36 && keyDer[0] === 0x30) {
      const ecPrivateKeyStart = keyDer.indexOf(0x04, 5);
      if (ecPrivateKeyStart !== -1 && keyDer[ecPrivateKeyStart + 1] === 0x20) {
        privateKeyBytes = keyDer.slice(ecPrivateKeyStart + 2, ecPrivateKeyStart + 2 + 32);
      } else {
        privateKeyBytes = keyDer.slice(-32);
      }
    } else {
      privateKeyBytes = keyDer.slice(-32);
    }
    
    // Sign the payload
    const payloadBytes = new TextEncoder().encode(payload);
    const payloadHash = sha256(payloadBytes);
    const signature = secp256k1.signSync(payloadHash, privateKeyBytes, { canonical: true });
    
    // Convert to base64
    return btoa(String.fromCharCode(...signature));
  } catch (error) {
    console.error('[SIGN] Error signing payload:', error);
    return null;
  }
}

// Helper: Direct API call to Dr. Green
async function callDrGreenApi(
  endpoint: string, 
  method: 'GET' | 'POST' = 'GET',
  body?: Record<string, unknown>,
  env: Environment = 'production'
): Promise<{ success: boolean; data?: unknown; status?: number; error?: string }> {
  const config = getEnvConfig(env);
  const apiKey = Deno.env.get(config.apiKeyEnv);
  
  if (!apiKey) {
    return { success: false, error: `API key not configured for ${env}` };
  }
  
  try {
    const url = `${config.apiUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-auth-apikey': apiKey,
    };
    
    if (body) {
      const payload = JSON.stringify(body);
      const signature = await signPayload(payload, env);
      if (signature) {
        headers['x-auth-signature'] = signature;
      }
    }
    
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    
    const data = await response.json().catch(() => ({}));
    
    return {
      success: response.ok,
      data,
      status: response.status,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Helper to call drgreen-proxy (for production tests that go through proxy)
async function callProxy(action: string, data?: Record<string, unknown>, authHeader?: string): Promise<{
  success: boolean;
  data?: unknown;
  error?: string;
  status?: number;
}> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'apikey': supabaseKey || '',
  };
  
  if (authHeader) {
    headers['Authorization'] = authHeader;
  }
  
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/drgreen-proxy`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ action, ...data }),
    });
    
    const result = await response.json();
    return {
      success: response.ok && result.success !== false,
      data: result,
      status: response.status,
    };
  } catch (err) {
    const error = err as Error;
    return {
      success: false,
      error: error.message,
    };
  }
}

// Test runner helper
async function runTest(
  name: string,
  testFn: () => Promise<{ success: boolean; message?: string; details?: Record<string, unknown> }>
): Promise<TestResult> {
  const start = Date.now();
  try {
    const result = await testFn();
    return {
      name,
      status: result.success ? 'pass' : 'fail',
      duration: Date.now() - start,
      message: result.message,
      details: result.details,
    };
  } catch (err) {
    const error = err as Error;
    return {
      name,
      status: 'fail',
      duration: Date.now() - start,
      message: `Exception: ${error.message}`,
      details: { stack: error.stack },
    };
  }
}

// ============================================
// PRODUCTION TESTS (via proxy)
// ============================================

async function testHealthCheck(): Promise<{ success: boolean; message?: string; details?: Record<string, unknown> }> {
  const result = await callProxy('health-check');
  
  if (!result.success) {
    return {
      success: false,
      message: 'Health check failed',
      details: { error: result.error, data: result.data },
    };
  }
  
  const data = result.data as Record<string, unknown>;
  const hasRequiredFields = Boolean(data.status && data.timestamp);
  
  return {
    success: hasRequiredFields,
    message: hasRequiredFields ? 'Health check passed' : 'Missing required fields in response',
    details: { response: data },
  };
}

async function testApiKeyConfiguration(): Promise<{ success: boolean; message?: string; details?: Record<string, unknown> }> {
  const result = await callProxy('health-check');
  
  if (!result.success) {
    return {
      success: false,
      message: 'Health check failed',
      details: { error: result.error, data: result.data },
    };
  }
  
  const data = result.data as Record<string, unknown>;
  const credentials = data.credentialValidation as Record<string, unknown> | undefined;
  
  const hasApiKey = credentials?.apiKeyPresent === true;
  const hasPrivateKey = credentials?.privateKeyPresent === true;
  
  return {
    success: hasApiKey && hasPrivateKey,
    message: hasApiKey && hasPrivateKey 
      ? 'API keys configured correctly' 
      : `Missing keys: ${!hasApiKey ? 'API_KEY ' : ''}${!hasPrivateKey ? 'PRIVATE_KEY' : ''}`,
    details: { credentials },
  };
}

async function testSignatureGeneration(): Promise<{ success: boolean; message?: string; details?: Record<string, unknown> }> {
  const result = await callProxy('health-check');
  
  if (!result.success) {
    return {
      success: false,
      message: 'Could not test signature generation',
      details: { error: result.error },
    };
  }
  
  const data = result.data as Record<string, unknown>;
  const apiConnectivity = data.apiConnectivity as Record<string, unknown> | undefined;
  const signingWorks = apiConnectivity?.success === true;
  
  return {
    success: signingWorks,
    message: signingWorks ? 'Signature generation verified via API connectivity' : 'API connectivity failed - signing may not be working',
    details: { apiConnectivity },
  };
}

async function testFetchStrains(): Promise<{ success: boolean; message?: string; details?: Record<string, unknown> }> {
  const result = await callProxy('health-check');
  
  if (!result.success) {
    return {
      success: false,
      message: 'Health check failed',
      details: { error: result.error, data: result.data },
    };
  }
  
  const data = result.data as Record<string, unknown>;
  const apiConnectivity = data.apiConnectivity as Record<string, unknown> | undefined;
  const strainsEndpointWorks = apiConnectivity?.success === true && 
                                apiConnectivity?.endpoint === 'GET /strains' &&
                                apiConnectivity?.status === 200;
  
  return {
    success: strainsEndpointWorks,
    message: strainsEndpointWorks ? 'Strains endpoint accessible' : 'Strains endpoint not working',
    details: { apiConnectivity },
  };
}

async function testLocalStrainDatabase(): Promise<{ success: boolean; message?: string; details?: Record<string, unknown> }> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY');
  
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/strains?select=id,name,sku&limit=5`, {
      headers: {
        'apikey': supabaseKey || '',
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });
    
    const strains = await response.json();
    const hasLocalStrains = Array.isArray(strains) && strains.length > 0;
    
    return {
      success: hasLocalStrains,
      message: hasLocalStrains ? `${strains.length} strains in local database` : 'No strains in local database - run sync',
      details: { count: strains?.length || 0, sample: strains?.slice(0, 3) },
    };
  } catch (err) {
    return {
      success: false,
      message: `Database query failed: ${(err as Error).message}`,
      details: {},
    };
  }
}

async function testClientPayloadValidation(): Promise<{ success: boolean; message?: string; details?: Record<string, unknown> }> {
  const invalidPayload = {
    firstName: '',
    lastName: 'Test',
    email: 'invalid-email',
  };
  
  const result = await callProxy('Create-Client-Legacy', invalidPayload);
  const data = result.data as Record<string, unknown>;
  const hasValidationError = Boolean(data?.error || data?.message || !result.success);
  
  return {
    success: hasValidationError,
    message: hasValidationError ? 'Payload validation working correctly' : 'Validation may not be catching invalid data',
    details: { expectedFailure: true, response: data },
  };
}

async function testLocalClientDatabase(): Promise<{ success: boolean; message?: string; details?: Record<string, unknown> }> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY');
  
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/drgreen_clients?select=id,drgreen_client_id,is_kyc_verified,admin_approval&limit=5`, {
      headers: {
        'apikey': supabaseKey || '',
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });
    
    const clients = await response.json();
    const tableExists = response.ok;
    
    return {
      success: tableExists,
      message: tableExists ? `Client table accessible, ${clients?.length || 0} records` : 'Client table not accessible',
      details: { count: clients?.length || 0, sample: clients?.slice(0, 2) },
    };
  } catch (err) {
    return {
      success: false,
      message: `Database query failed: ${(err as Error).message}`,
      details: {},
    };
  }
}

async function testErrorResponseFormat(): Promise<{ success: boolean; message?: string; details?: Record<string, unknown> }> {
  const result = await callProxy('Invalid-Action-That-Does-Not-Exist');
  const data = result.data as Record<string, unknown>;
  const hasErrorStructure = Boolean(data?.error || data?.message || data?.errorCode);
  
  return {
    success: hasErrorStructure,
    message: hasErrorStructure ? 'Error responses are properly structured' : 'Error response format may need improvement',
    details: { response: data },
  };
}

async function testCorsHeaders(): Promise<{ success: boolean; message?: string; details?: Record<string, unknown> }> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
  
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/drgreen-proxy`, {
      method: 'OPTIONS',
      headers: {
        'apikey': supabaseKey || '',
        'Origin': 'https://example.com',
      },
    });
    
    const corsHeader = response.headers.get('Access-Control-Allow-Origin');
    const allowHeaders = response.headers.get('Access-Control-Allow-Headers');
    const hasCors = corsHeader === '*' || (corsHeader?.includes('example.com') ?? false);
    
    return {
      success: hasCors,
      message: hasCors ? 'CORS headers configured correctly' : 'CORS headers may be misconfigured',
      details: { 'Access-Control-Allow-Origin': corsHeader, 'Access-Control-Allow-Headers': allowHeaders },
    };
  } catch (err) {
    return {
      success: false,
      message: `CORS test failed: ${(err as Error).message}`,
      details: {},
    };
  }
}

async function testResponseTime(): Promise<{ success: boolean; message?: string; details?: Record<string, unknown> }> {
  const start = Date.now();
  await callProxy('health-check');
  const duration = Date.now() - start;
  
  const isAcceptable = duration < 5000;
  const isFast = duration < 1000;
  
  return {
    success: isAcceptable,
    message: isFast ? `Fast response: ${duration}ms` : isAcceptable ? `Acceptable response: ${duration}ms` : `Slow response: ${duration}ms`,
    details: { durationMs: duration, threshold: '5000ms', rating: isFast ? 'fast' : isAcceptable ? 'acceptable' : 'slow' },
  };
}

async function testWebhookEndpoint(): Promise<{ success: boolean; message?: string; details?: Record<string, unknown> }> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
  
  try {
    const optionsResponse = await fetch(`${supabaseUrl}/functions/v1/drgreen-webhook`, {
      method: 'OPTIONS',
      headers: {
        'apikey': supabaseKey || '',
        'Origin': 'https://drgreen.com',
      },
    });
    
    const corsHeader = optionsResponse.headers.get('Access-Control-Allow-Origin');
    const hasCors = corsHeader === '*';
    
    return {
      success: hasCors,
      message: hasCors ? 'Webhook endpoint accessible with CORS' : 'Webhook CORS may be misconfigured',
      details: { status: optionsResponse.status, corsHeader },
    };
  } catch (err) {
    return {
      success: false,
      message: `Webhook endpoint test failed: ${(err as Error).message}`,
      details: {},
    };
  }
}

async function testWebhookPayloadValidation(): Promise<{ success: boolean; message?: string; details?: Record<string, unknown> }> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
  
  try {
    const invalidPayload = { clientId: 'test-client-123' };
    
    const response = await fetch(`${supabaseUrl}/functions/v1/drgreen-webhook`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidPayload),
    });
    
    const rejectsInvalid = response.status === 400 || response.status === 401;
    
    return {
      success: rejectsInvalid,
      message: rejectsInvalid 
        ? `Webhook security active (${response.status === 401 ? 'signature required' : 'payload validated'})` 
        : `Unexpected response: ${response.status}`,
      details: { status: response.status, expectedStatuses: [400, 401] },
    };
  } catch (err) {
    return {
      success: false,
      message: `Webhook validation test failed: ${(err as Error).message}`,
      details: {},
    };
  }
}

async function testKycJourneyLogsTable(): Promise<{ success: boolean; message?: string; details?: Record<string, unknown> }> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY');
  
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/kyc_journey_logs?select=id,event_type,event_source&limit=5`, {
      headers: {
        'apikey': supabaseKey || '',
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });
    
    const logs = await response.json();
    const tableExists = response.ok;
    
    return {
      success: tableExists,
      message: tableExists ? `KYC journey logs table accessible, ${logs?.length || 0} records` : 'KYC journey logs table not accessible',
      details: { count: logs?.length || 0, sample: logs?.slice(0, 2) },
    };
  } catch (err) {
    return {
      success: false,
      message: `Database query failed: ${(err as Error).message}`,
      details: {},
    };
  }
}

// ============================================
// STAGING-SPECIFIC TESTS
// ============================================

async function testStagingEnvironmentConfig(): Promise<{ success: boolean; message?: string; details?: Record<string, unknown> }> {
  const config = isEnvironmentConfigured('staging');
  
  return {
    success: config.configured,
    message: config.configured 
      ? 'Staging environment fully configured' 
      : `Missing staging keys: ${!config.apiKey ? 'API_KEY ' : ''}${!config.privateKey ? 'PRIVATE_KEY' : ''}`,
    details: { 
      apiKeyPresent: config.apiKey,
      privateKeyPresent: config.privateKey,
      apiUrl: config.apiUrl,
    },
  };
}

async function testStagingDirectConnection(env: Environment): Promise<{ success: boolean; message?: string; details?: Record<string, unknown> }> {
  const config = isEnvironmentConfigured(env);
  
  if (!config.configured) {
    return {
      success: false,
      message: `${env} environment not configured`,
      details: { configured: false },
    };
  }
  
  // Try to reach the API health endpoint
  try {
    const apiConfig = getEnvConfig(env);
    const response = await fetch(`${apiConfig.apiUrl}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    const isReachable = response.ok || response.status === 404; // 404 means server is up but endpoint may differ
    
    return {
      success: isReachable,
      message: isReachable ? `${env} API reachable (${response.status})` : `${env} API not reachable`,
      details: { 
        status: response.status,
        url: apiConfig.apiUrl,
      },
    };
  } catch (err) {
    return {
      success: false,
      message: `${env} API connection failed: ${(err as Error).message}`,
      details: { error: (err as Error).message },
    };
  }
}

async function testStagingStrains(env: Environment): Promise<{ success: boolean; message?: string; details?: Record<string, unknown> }> {
  const config = isEnvironmentConfigured(env);
  
  if (!config.configured) {
    return {
      success: false,
      message: `${env} environment not configured`,
      details: { configured: false },
    };
  }
  
  const result = await callDrGreenApi('/strains?take=5', 'GET', undefined, env);
  
  if (!result.success) {
    return {
      success: false,
      message: `Failed to fetch strains from ${env}`,
      details: { error: result.error, status: result.status },
    };
  }
  
  const data = result.data as { data?: unknown[] } | unknown[];
  const strains = Array.isArray(data) ? data : (data as { data?: unknown[] })?.data || [];
  
  return {
    success: Array.isArray(strains),
    message: `${env} strains endpoint: ${Array.isArray(strains) ? strains.length : 0} strains returned`,
    details: { 
      count: Array.isArray(strains) ? strains.length : 0,
      sample: Array.isArray(strains) ? strains.slice(0, 2) : null,
    },
  };
}

async function testStagingSignature(env: Environment): Promise<{ success: boolean; message?: string; details?: Record<string, unknown> }> {
  const config = isEnvironmentConfigured(env);
  
  if (!config.configured) {
    return {
      success: false,
      message: `${env} environment not configured`,
      details: { configured: false },
    };
  }
  
  const testPayload = JSON.stringify({ test: true, timestamp: Date.now() });
  const signature = await signPayload(testPayload, env);
  
  return {
    success: Boolean(signature),
    message: signature ? `${env} signature generation successful` : `${env} signature generation failed`,
    details: { 
      signatureGenerated: Boolean(signature),
      signatureLength: signature?.length || 0,
    },
  };
}

// ============================================
// MAIN HANDLER
// ============================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const suiteStart = Date.now();
  const results: TestResult[] = [];
  
  // Parse request body for environment
  let environment: Environment = 'production';
  try {
    const body = await req.json();
    if (body.environment === 'staging' || body.environment === 'railway') {
      environment = body.environment;
    }
  } catch {
    // Default to production if no body
  }
  
  console.log(`[TEST SUITE] Starting Dr. Green API Tests (${environment})`);

  if (environment === 'production') {
    // Production tests via proxy
    const productionTests = [
      { name: '1. Health Check', fn: testHealthCheck },
      { name: '2. API Key Configuration', fn: testApiKeyConfiguration },
      { name: '3. Signature Generation', fn: testSignatureGeneration },
      { name: '4. Strains API Endpoint', fn: testFetchStrains },
      { name: '5. Local Strain Database', fn: testLocalStrainDatabase },
      { name: '6. Client Payload Validation', fn: testClientPayloadValidation },
      { name: '7. Local Client Database', fn: testLocalClientDatabase },
      { name: '8. Error Response Format', fn: testErrorResponseFormat },
      { name: '9. CORS Headers', fn: testCorsHeaders },
      { name: '10. Response Time', fn: testResponseTime },
      { name: '11. Webhook Endpoint', fn: testWebhookEndpoint },
      { name: '12. Webhook Payload Validation', fn: testWebhookPayloadValidation },
      { name: '13. KYC Journey Logs Table', fn: testKycJourneyLogsTable },
    ];
    
    for (const test of productionTests) {
      console.log(`[TEST] Running: ${test.name}`);
      const result = await runTest(test.name, test.fn);
      results.push(result);
      console.log(`[TEST] ${test.name}: ${result.status} (${result.duration}ms)`);
    }
  } else {
    // Staging and Railway tests - direct API calls
    const envLabel = environment === 'staging' ? 'Staging' : 'Railway';
    const stagingTests = [
      { name: `1. ${envLabel} Environment Config`, fn: () => isEnvironmentConfigured(environment === 'railway' ? 'railway' : 'staging').configured 
        ? (async () => ({ success: true, message: `${envLabel} environment fully configured`, details: isEnvironmentConfigured(environment) as unknown as Record<string, unknown> }))()
        : (async () => ({ success: false, message: `Missing ${envLabel} keys`, details: isEnvironmentConfigured(environment) as unknown as Record<string, unknown> }))()
      },
      { name: `2. ${envLabel} API Connectivity`, fn: () => testStagingDirectConnection(environment) },
      { name: `3. ${envLabel} Signature Generation`, fn: () => testStagingSignature(environment) },
      { name: `4. ${envLabel} Strains Endpoint`, fn: () => testStagingStrains(environment) },
      { name: '5. Local Strain Database', fn: testLocalStrainDatabase },
      { name: '6. Local Client Database', fn: testLocalClientDatabase },
      { name: '7. KYC Journey Logs Table', fn: testKycJourneyLogsTable },
    ];
    
    for (const test of stagingTests) {
      console.log(`[TEST] Running: ${test.name}`);
      const result = await runTest(test.name, test.fn);
      results.push(result);
      console.log(`[TEST] ${test.name}: ${result.status} (${result.duration}ms)`);
    }
  }

  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const skipped = results.filter(r => r.status === 'skip').length;

  const suiteResult: TestSuiteResult = {
    suite: `Dr. Green API (${environment})`,
    environment,
    timestamp: new Date().toISOString(),
    totalTests: results.length,
    passed,
    failed,
    skipped,
    duration: Date.now() - suiteStart,
    results,
  };

  console.log(`[TEST SUITE] Complete: ${passed}/${results.length} passed, ${failed} failed`);

  return new Response(JSON.stringify(suiteResult, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
