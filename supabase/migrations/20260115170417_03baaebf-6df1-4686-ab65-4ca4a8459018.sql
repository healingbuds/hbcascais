-- Create articles table for The Wire news section
CREATE TABLE public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  summary TEXT NOT NULL,
  content TEXT NOT NULL,
  featured_image TEXT,
  category TEXT DEFAULT 'news',
  author TEXT DEFAULT 'Healing Buds',
  is_featured BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Public read access for articles (news is public)
CREATE POLICY "Articles are publicly readable"
ON public.articles
FOR SELECT
USING (true);

-- Only admins can modify articles (insert, update, delete)
CREATE POLICY "Admins can manage articles"
ON public.articles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Create index for faster slug lookups
CREATE INDEX idx_articles_slug ON public.articles(slug);

-- Create index for featured and published_at sorting
CREATE INDEX idx_articles_featured_published ON public.articles(is_featured DESC, published_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_articles_updated_at
BEFORE UPDATE ON public.articles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();