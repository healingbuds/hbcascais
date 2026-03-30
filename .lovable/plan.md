

## Fix: Client Detail Endpoint Signing — 401 Errors

### Root Cause
The edge function logs show **every detail fetch returns 401 Unauthorized**. Cross-referencing with the working `drgreen-proxy` (line 2460), the `/dapp/clients/{id}` endpoint requires signing `JSON.stringify({ clientId })` as the payload — not an empty string.

**Working pattern (drgreen-proxy line 2460):**
```typescript
drGreenRequestBody(`/dapp/clients/${clientId}`, "GET", { clientId })
// → signs: '{"clientId":"47542db8-..."}'
```

**Current broken pattern (sync-clients):**
```typescript
drGreenGetDetail(`/dapp/clients/${client.id}`)
// → signs: "" (empty string) → 401
```

### Fix — `supabase/functions/sync-clients/index.ts`

**Change 1:** Update `drGreenGetDetail` to accept a sign body and sign the JSON-stringified body:

```typescript
async function drGreenGetDetail(endpoint: string, signBody: object): Promise<Response> {
  const apiKey = Deno.env.get("DRGREEN_API_KEY");
  const privateKey = Deno.env.get("DRGREEN_PRIVATE_KEY");
  if (!apiKey || !privateKey) throw new Error("Dr Green API credentials not configured");

  const payload = JSON.stringify(signBody);
  const signature = await generateSignature(payload, privateKey);
  const url = `${DRGREEN_API_URL}${endpoint}`;
  console.log(`[sync-clients] GET ${url} (signing: ${payload})`);

  return fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-auth-apikey": apiKey,
      "x-auth-signature": signature,
    },
  });
}
```

**Change 2:** Update the call site (~line 303) to pass `{ clientId: client.id }`:

```typescript
const detailResp = await drGreenGetDetail(`/dapp/clients/${client.id}`, { clientId: client.id });
```

### Single file changed
`supabase/functions/sync-clients/index.ts` — two edits (function signature + call site)

### Expected outcome
Detail fetches should return 200 with full shipping data (address1, city, postalCode), which gets merged into the `drgreen_clients` upsert.

