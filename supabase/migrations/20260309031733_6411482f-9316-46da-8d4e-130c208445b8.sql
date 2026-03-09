CREATE POLICY "Admins can manage all subscriptions"
ON public.push_subscriptions
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());