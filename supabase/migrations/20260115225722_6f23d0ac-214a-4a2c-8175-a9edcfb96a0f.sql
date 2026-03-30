-- Add RLS policies for prescription-documents bucket
-- Users can only access files in their own folder (user_id as folder name)

-- Policy: Users can upload their own prescription documents
CREATE POLICY "Users can upload their own prescription documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'prescription-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can view their own prescription documents
CREATE POLICY "Users can view their own prescription documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'prescription-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can update their own prescription documents
CREATE POLICY "Users can update their own prescription documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'prescription-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own prescription documents
CREATE POLICY "Users can delete their own prescription documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'prescription-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add RLS policies for prescriptions bucket (legacy)
-- Policy: Users can upload to prescriptions bucket
CREATE POLICY "Users can upload prescriptions"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'prescriptions' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can view their prescriptions
CREATE POLICY "Users can view their prescriptions"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'prescriptions' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their prescriptions
CREATE POLICY "Users can delete their prescriptions"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'prescriptions' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Admin policies for prescription documents
CREATE POLICY "Admins can view all prescription documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id IN ('prescription-documents', 'prescriptions')
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can manage all prescription documents"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id IN ('prescription-documents', 'prescriptions')
  AND public.has_role(auth.uid(), 'admin')
);