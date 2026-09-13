/*
# Plan prices + HWID reset product

- plan_prices stores editable prices for SubscriptionsPage.
- hwid_reset is a purchasable product (10 000 som) that clears HWID on approval.
*/

CREATE TABLE IF NOT EXISTS public.plan_prices (
  id text PRIMARY KEY,
  price int NOT NULL CHECK (price >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.plan_prices (id, price) VALUES
  ('30day', 20000),
  ('90day', 50000),
  ('lifetime', 80000),
  ('hwid_reset', 10000)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.plan_prices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "plan_prices_select_all" ON public.plan_prices;
CREATE POLICY "plan_prices_select_all" ON public.plan_prices
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "plan_prices_admin_all" ON public.plan_prices;
CREATE POLICY "plan_prices_admin_all" ON public.plan_prices
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

NOTIFY pgrst, 'reload schema';
