/*
# Fix admin profile updates + promo code system

1. FIX: admin obuna berish/olib tashlash ishlamayotgani.
   Sabab: profiles UPDATE policy faqat o'z qatoriga ruxsat beradi,
   admin boshqa user'ni yangilaganda 0 qator o'zgaradi (jimgina).
   Yechim: public.is_admin() helper orqali admin'ga ham ruxsat.
2. Promo kodlar tizimi: promo_codes jadvali + validate_promo RPC +
   media_applications ga promo_code/discount_percent ustunlari.
*/

-- 1. Admin UPDATE policy (is_admin helper SECURITY DEFINER bo'lgani uchun rekursiya yo'q)
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_update_own_or_admin" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- 2. Promo codes table
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  discount_percent int NOT NULL DEFAULT 10 CHECK (discount_percent >= 1 AND discount_percent <= 90),
  max_uses int NULL,
  used_count int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "promo_admin_all" ON public.promo_codes;
CREATE POLICY "promo_admin_all" ON public.promo_codes
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 3. Payment rows store used promo
ALTER TABLE public.media_applications ADD COLUMN IF NOT EXISTS promo_code text;
ALTER TABLE public.media_applications ADD COLUMN IF NOT EXISTS discount_percent int NOT NULL DEFAULT 0;

-- 4. Validate promo (SECURITY DEFINER: kodlar ro'yxatini oshkor qilmaydi)
DROP FUNCTION IF EXISTS public.validate_promo(text);

CREATE OR REPLACE FUNCTION public.validate_promo(p_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_promo RECORD;
BEGIN
  SELECT * INTO v_promo FROM public.promo_codes
  WHERE lower(code) = lower(TRIM(p_code));
  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'Promokod topilmadi');
  END IF;
  IF NOT v_promo.is_active THEN
    RETURN json_build_object('ok', false, 'error', 'Promokod faol emas');
  END IF;
  IF v_promo.max_uses IS NOT NULL AND v_promo.used_count >= v_promo.max_uses THEN
    RETURN json_build_object('ok', false, 'error', 'Promokod limiti tugagan');
  END IF;
  RETURN json_build_object('ok', true, 'discount_percent', v_promo.discount_percent);
END;
$$;

NOTIFY pgrst, 'reload schema';
