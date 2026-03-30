import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseGeneratedImageOptions {
  productId: string;
  productName: string;
  originalImageUrl?: string;
  autoGenerate?: boolean;
}

interface UseGeneratedImageResult {
  imageUrl: string | null;
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  generateImage: () => Promise<void>;
}

export function useGeneratedImage({
  productId,
  productName,
  originalImageUrl,
  autoGenerate = false,
}: UseGeneratedImageOptions): UseGeneratedImageResult {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check cache for existing generated image
  const checkCache = useCallback(async () => {
    if (!productId) {
      setIsLoading(false);
      return null;
    }

    try {
      // Check storage directly for the generated image
      const safeProductName = productName.toLowerCase().replace(/[^a-z0-9]/g, "-");
      const possibleFilename = `${safeProductName}-${productId.slice(0, 8)}.png`;
      
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(possibleFilename);
      
      // Check if the file actually exists by making a HEAD request
      try {
        const response = await fetch(urlData.publicUrl, { method: 'HEAD' });
        if (response.ok) {
          return urlData.publicUrl;
        }
      } catch {
        // File doesn't exist
      }
      
      return null;
    } catch (err) {
      console.error('Cache check error:', err);
      return null;
    }
  }, [productId]);

  // Generate new image via edge function
  const generateImage = useCallback(async () => {
    if (!productId || !productName) {
      setError('Product ID and name are required');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-product-image', {
        body: {
          productId,
          productName,
          originalImageUrl,
        },
      });

      if (fnError) {
        console.error('Function error:', fnError);
        setError(fnError.message || 'Failed to generate image');
        return;
      }

      if (data?.error) {
        console.error('Generation error:', data.error);
        setError(data.error);
        return;
      }

      if (data?.imageUrl) {
        setImageUrl(data.imageUrl);
      }
    } catch (err) {
      console.error('Generate image error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsGenerating(false);
    }
  }, [productId, productName, originalImageUrl]);

  // Initial load - check cache
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      setIsLoading(true);
      
      const cachedUrl = await checkCache();
      
      if (!mounted) return;

      if (cachedUrl) {
        setImageUrl(cachedUrl);
        setIsLoading(false);
      } else if (autoGenerate) {
        // Auto-generate if enabled and not cached
        setIsLoading(false);
        await generateImage();
      } else {
        setIsLoading(false);
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [productId, checkCache, autoGenerate, generateImage]);

  return {
    imageUrl,
    isLoading,
    isGenerating,
    error,
    generateImage,
  };
}
