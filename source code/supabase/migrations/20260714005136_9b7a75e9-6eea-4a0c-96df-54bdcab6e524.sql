
CREATE POLICY "Upload own folder" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'complaint-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Read own or admin" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'complaint-attachments' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(),'admin')));
CREATE POLICY "Delete own or admin" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'complaint-attachments' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(),'admin')));
