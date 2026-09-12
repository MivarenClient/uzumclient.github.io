import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type Profile = {
  id: string;
  username: string;
  email: string | null;
  avatar_url: string | null;
  hwid: string | null;
  is_admin: boolean;
  is_blocked: boolean;
  subscription_type: 'none' | '30day' | '90day' | 'lifetime';
  subscription_expires_at: string | null;
  created_at: string;
};

export type NewsItem = {
  id: string;
  title: string;
  content: string;
  version: string | null;
  created_at: string;
};

export type MediaApplication = {
  id: string;
  user_id: string;
  channel_name: string;
  channel_url: string;
  subscriber_count: number;
  avg_views: number;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_at: string | null;
  plan_type?: string | null;
  amount?: string | null;
  card_number?: string | null;
  promo_code?: string | null;
  discount_percent?: number | null;
};

export type PromoCode = {
  id: string;
  code: string;
  discount_percent: number;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  created_at: string;
};

export type PaymentRequest = {
  id: string;
  user_id: string;
  plan_type: '30day' | '90day' | 'lifetime';
  amount: string;
  card_number: string;
  proof_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_at: string | null;
  profiles?: Profile;
};
