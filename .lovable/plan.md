

## Three-Part Plan: Reduced-Motion Hero, News Image Review, Product Jar Generation Fix

This covers three distinct requests:

### 1. Reduced-Motion Mode with Static Hero Image

**What**: Add a "Reduce Motion" toggle under the existing Accessibility section in Admin Settings. When enabled (or when the user's OS prefers reduced motion), the Hero replaces the video and all framer-motion animations with a static AI-generated medical cannabis hero image relevant to South Africa.

**Image generation**: Use the AI gateway script to generate a high-quality hero image with a prompt like: *"Professional medical cannabis clinic in South Africa, warm natural lighting, aloe plants and indigenous flora, clean modern healthcare aesthetic, cannabis leaf motifs, diverse South African patients, earth tones and teal accents"*. Upload to the `product-images` storage bucket as `hero-static.png`.

**Implementation**:

| File | Change |
|------|--------|
| `src/context/ThemeSliderContext.tsx` | Add `reduceMotion: boolean` and `setReduceMotion` to context. Persist in localStorage. Auto-detect from `prefers-reduced-motion` media query. |
| `src/components/Hero.tsx` | Read `reduceMotion` from context. If true: hide `<video>`, disable framer-motion variants (set all to `initial` state), show static hero image from storage instead. Remove particle field and animated glow. |
| `src/pages/AdminSettings.tsx` | Add a "Reduce Motion" toggle under the Accessibility section — a switch that sets the site-wide default. Description: "Disables hero video, particle effects, and scroll animations for visitors who prefer less motion." |
| `src/components/ParticleField.tsx` | Early-return `null` when `reduceMotion` is true. |
| `src/components/ScrollAnimation.tsx` | Pass children through without animation wrapper when `reduceMotion` is true. |

### 2. News Images — Review of `fetch-wire-articles`

**Current state**: The `fetch-wire-articles` edge function fetches RSS articles but does **not** extract or generate images. Articles are inserted with no `image_url` field.

**Issue**: Articles on The Wire likely display without images, making them visually flat.

**Proposed fix**:
- Extract `<media:content>` or `<enclosure>` image URLs from RSS XML during parsing in `fetch-wire-articles/index.ts`
- If no image found in RSS, optionally generate a category-themed placeholder using the AI image gateway
- Add `image_url` column to the articles insert if not already present

### 3. Product Jar Image Generation — Model & Dapp Strain Image Integration

**Current issues found**:

1. **Wrong model name**: `generate-product-image/index.ts` uses `google/gemini-2.5-flash-image-preview` — this is not a valid model. The correct model names are `google/gemini-2.5-flash-image`, `google/gemini-3-pro-image-preview`, or `google/gemini-3.1-flash-image-preview`.

2. **Not using dapp strain images**: The batch generator fetches strains from the local `strains` table (`image_url` column) and passes it as `originalImageUrl`, but the `generate-product-image` function only uses it as metadata — it doesn't actually compose the jar label with the strain's dapp image. The prompt mentions editing a jar template but doesn't incorporate the strain-specific image from the dapp API.

**Proposed fix**:

| File | Change |
|------|--------|
| `supabase/functions/generate-product-image/index.ts` | Fix model to `google/gemini-2.5-flash-image`. When `originalImageUrl` (the dapp strain image) is provided, include it in the AI prompt as a second image reference: "Use this strain photo as reference for the label artwork and bud appearance inside the jar." This composes the jar with the actual strain imagery. |
| `supabase/functions/batch-generate-images/index.ts` | Ensure `image_url` from the strains table (which comes from the dapp sync) is passed through correctly. |
| `src/components/admin/BatchImageGenerator.tsx` | Add a "Regenerate All" option that clears cached images and re-generates with updated prompts. |

### Files to modify (summary)

- `src/context/ThemeSliderContext.tsx` — add `reduceMotion` state
- `src/components/Hero.tsx` — conditional static image mode
- `src/pages/AdminSettings.tsx` — add Reduce Motion toggle
- `src/components/ParticleField.tsx` — respect reduceMotion
- `src/components/ScrollAnimation.tsx` — respect reduceMotion
- `supabase/functions/fetch-wire-articles/index.ts` — extract RSS images
- `supabase/functions/generate-product-image/index.ts` — fix model, use dapp strain images in composition
- `supabase/functions/batch-generate-images/index.ts` — pass strain images
- `src/components/admin/BatchImageGenerator.tsx` — add regenerate option
- **Generate static hero image** via AI gateway script → upload to storage

