import { useState } from 'react';
import { Loader2, Sparkles, ImageIcon } from 'lucide-react';
import { useGeneratedImage } from '@/hooks/useGeneratedImage';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface GeneratedProductImageProps {
  productId: string;
  productName: string;
  originalImageUrl: string;
  className?: string;
  onImageLoaded?: (url: string) => void;
}

export function GeneratedProductImage({
  productId,
  productName,
  originalImageUrl,
  className,
  onImageLoaded,
}: GeneratedProductImageProps) {
  const [imageError, setImageError] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  const {
    imageUrl: generatedUrl,
    isLoading,
    isGenerating,
    error,
    generateImage,
  } = useGeneratedImage({
    productId,
    productName,
    originalImageUrl,
    autoGenerate: false, // Manual trigger for now
  });

  // Determine which image to display
  const displayUrl = showOriginal || imageError || (!generatedUrl && !isGenerating)
    ? originalImageUrl
    : generatedUrl || originalImageUrl;

  const handleImageLoad = () => {
    if (generatedUrl && onImageLoaded) {
      onImageLoaded(generatedUrl);
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center bg-muted/30", className)}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Main image */}
      <img
        src={displayUrl}
        alt={productName}
        className={cn(
          "w-full h-full object-contain transition-all duration-500",
          isGenerating && "opacity-50",
          className
        )}
        loading="lazy"
        onLoad={handleImageLoad}
        onError={handleImageError}
      />

      {/* Generating overlay */}
      {isGenerating && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
          <span className="text-sm font-medium text-foreground">Generating 4K image...</span>
          <span className="text-xs text-muted-foreground mt-1">This may take a moment</span>
        </div>
      )}

      {/* Generate button - only show if no generated image and not generating */}
      {!generatedUrl && !isGenerating && !error && (
        <div className="absolute bottom-3 right-3">
          <Button
            size="sm"
            variant="secondary"
            className="h-8 px-3 text-xs font-medium shadow-lg backdrop-blur-sm bg-background/80 hover:bg-background"
            onClick={(e) => {
              e.stopPropagation();
              generateImage();
            }}
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Generate 4K
          </Button>
        </div>
      )}

      {/* Toggle to show original */}
      {generatedUrl && !isGenerating && (
        <button
          className="absolute bottom-3 right-3 p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg hover:bg-background transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            setShowOriginal(!showOriginal);
          }}
          title={showOriginal ? "Show generated image" : "Show original image"}
        >
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
        </button>
      )}

      {/* Error indicator */}
      {error && (
        <div className="absolute bottom-3 left-3 right-3 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}
