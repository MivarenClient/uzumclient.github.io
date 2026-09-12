import { Check, Crown, Zap, Star, Shield, Copy, Upload, Loader2, X, CheckCircle } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Page } from '@/components/Navbar';
import { useState } from 'react';

type SubscriptionsPageProps = {
  onNavigate: (page: Page) => void;
};

type Plan = {
  id: '30day' | '90day' | 'lifetime';
  name: string;
  price: string;
  duration: string;
  icon: typeof Zap;
  features: string[];
  popular?: boolean;
  gradient: string;
};

const CARD_NUMBER = '4466 1369 5196 8727';
const CARD_HOLDER = 'Berdibaev A';

const plans: Plan[] = [
  {
    id: '30day',
    name: '30 kunlik obuna',
    price: '20.000',
    duration: '30 kun',
    icon: Zap,
    gradient: 'from-primary-500 to-primary-700',
    features: [
      'Barcha modullarga ruxsat',
      'ESP & X-Ray',
      'KillAura, AutoTotem',
      'FPS Boost smooth tajriba',
      'HWID himoyasi',
      'Qollab-quvatlash 24/7',
    ],
  },
  {
    id: '90day',
    name: '90 kunlik obuna',
    price: '50.000',
    duration: '90 kun',
    icon: Star,
    popular: true,
    gradient: 'from-secondary-500 to-secondary-700',
    features: [
      'Barcha 30 kunlik xususiyatlar',
      'Tezroq yangilanishlar',
      'Maxsus modullar',
      'Anti-Catch bypass yangilanishlari',
      'Maxsus ranglar va sozlamalar',
      'Tezkor qollab-quvatlash',
    ],
  },
  {
    id: 'lifetime',
    name: 'Umrbodlik obuna',
    price: '80.000',
    duration: 'Cheksiz',
    icon: Crown,
    gradient: 'from-warning-500 to-warning-700',
    features: [
      'Barcha xususiyatlar',
      'Umrbodlik ruxsat',
      'Barcha kelajakdagi yangilanishlar',
      'Maxsus VIP modullar',
      'Yuqori ustuvorlik qollab-quvatlash',
      'Maxsus badge saytda',
    ],
  },
];

export function SubscriptionsPage({ onNavigate }: SubscriptionsPageProps) {
  const { user, profile } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promoInput, setPromoInput] = useState('');
  const [promoDiscount, setPromoDiscount] = useState<number | null>(null);
  const [promoMsg, setPromoMsg] = useState<string | null>(null);
  const [promoChecking, setPromoChecking] = useState(false);

  const handlePurchase = (plan: Plan) => {
    if (!user || !profile) {
      onNavigate('auth');
      return;
    }
    setSelectedPlan(plan);
    setProofFile(null);
    setSubmitted(false);
    setError(null);
    setPromoInput('');
    setPromoDiscount(null);
    setPromoMsg(null);
  };

  const planPrice = (plan: Plan) => parseInt(plan.price.replace(/\D/g, '')) || 0;
  const finalPrice = (plan: Plan) => {
    const base = planPrice(plan);
    if (promoDiscount) return Math.round(base * (100 - promoDiscount) / 100);
    return base;
  };
  const formatPrice = (n: number) => n.toLocaleString('uz-UZ');

  const applyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoChecking(true);
    setPromoMsg(null);
    const { data, error: rpcError } = await supabase.rpc('validate_promo', { p_code: promoInput.trim() });
    if (rpcError) {
      setPromoMsg('Tekshirishda xatolik.');
      setPromoDiscount(null);
    } else {
      const res = data as { ok: boolean; discount_percent?: number; error?: string };
      if (res?.ok && res.discount_percent) {
        setPromoDiscount(res.discount_percent);
        setPromoMsg(`${res.discount_percent}% chegirma qo'llandi!`);
      } else {
        setPromoDiscount(null);
        setPromoMsg(res?.error || 'Promokod noto\'g\'ri.');
      }
    }
    setPromoChecking(false);
  };

  const copyCard = () => {
    navigator.clipboard.writeText(CARD_NUMBER.replace(/\s/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async () => {
    if (!user || !selectedPlan || !proofFile) return;

    setSubmitting(true);
    setError(null);

    let proofBase64: string | null = null;

    if (proofFile) {
      try {
        const reader = new FileReader();
        proofBase64 = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(proofFile);
        });
      } catch (e) {
        console.warn('File read failed:', e);
      }
    }

    const { error: insertError } = await supabase
      .from('media_applications')
      .insert({
        user_id: user.id,
        channel_name: profile?.username || user.email || '',
        channel_url: selectedPlan.id,
        subscriber_count: 0,
        avg_views: finalPrice(selectedPlan),
        description: proofBase64 || 'Chek yuklanmagan',
        status: 'pending',
        promo_code: promoDiscount ? promoInput.trim() : null,
        discount_percent: promoDiscount || 0,
      });

    if (insertError) {
      console.error('Payment insert error:', insertError);
      setError('Xatolik yuz berdi: ' + insertError.message);
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
  };

  const closeModal = () => {
    setSelectedPlan(null);
    setProofFile(null);
    setSubmitted(false);
    setError(null);
    setPromoInput('');
    setPromoDiscount(null);
    setPromoMsg(null);
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="font-display font-bold text-4xl sm:text-5xl text-white mb-4">
            Obuna <span className="gradient-text">rejalari</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            O'zingizga mos obunani tanlang va UZUM CLIENT barcha xususiyatlaridan foydalaning.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <div key={plan.id} className="relative">
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-secondary-500 to-secondary-700 text-white text-xs font-semibold shadow-lg shadow-secondary-500/30">
                    Eng mashhur
                  </div>
                </div>
              )}

              <GlassCard reveal delay={i * 100} className="relative h-full flex flex-col">
                {/* Icon */}
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center shadow-lg mb-5`}>
                  <plan.icon className="w-7 h-7 text-white" />
                </div>

                {/* Name */}
                <h3 className="font-display font-bold text-xl text-white mb-2">{plan.name}</h3>
                <p className="text-sm text-gray-400 mb-4">{plan.duration} davomida</p>

                {/* Price */}
                <div className="mb-6">
                  <span className="font-display font-bold text-4xl text-white">{plan.price}</span>
                  <span className="text-lg text-gray-400 ml-2">so'm</span>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                      <div className="w-5 h-5 rounded-full bg-primary-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-primary-400" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => handlePurchase(plan)}
                  className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
                    plan.popular ? 'btn-primary' : 'btn-secondary'
                  }`}
                >
                  Sotib olish
                </button>
              </GlassCard>
            </div>
          ))}
        </div>

        {/* Info banner */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="glass-card p-6 flex flex-col sm:flex-row items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-primary-400" />
            </div>
            <div className="text-center sm:text-left">
              <h4 className="font-semibold text-white mb-1">Xavfsiz to'lov kafolati</h4>
              <p className="text-sm text-gray-400">
                To'lovni amalga oshiring va skrinshot yuboring. Admin 24 soat ichida tekshirib obunangizni faollashtiradi.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative glass-strong rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            {/* Close */}
            <button onClick={closeModal} className="absolute top-4 right-4 w-8 h-8 rounded-lg glass-card flex items-center justify-center">
              <X className="w-4 h-4 text-gray-400" />
            </button>

            {submitted ? (
              /* Success */
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-success-500/10 border border-success-500/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-success-400" />
                </div>
                <h3 className="font-display font-bold text-xl text-white mb-2">So'rov yuborildi!</h3>
                <p className="text-sm text-gray-400 mb-6">
                  Admin 24 soat ichida tekshirib obunangizni faollashtiradi.
                </p>
                <button onClick={closeModal} className="btn-primary px-8">
                  Yaxshi
                </button>
              </div>
            ) : (
              /* Payment form */
              <>
                <h3 className="font-display font-bold text-xl text-white mb-1">To'lov</h3>
                <p className="text-sm text-gray-400 mb-6">
                  {selectedPlan.name} —{' '}
                  {promoDiscount ? (
                    <>
                      <span className="line-through text-gray-500">{selectedPlan.price}</span>{' '}
                      <span className="text-success-300 font-semibold">{formatPrice(finalPrice(selectedPlan))} so'm</span>
                    </>
                  ) : (
                    <>{selectedPlan.price} so'm</>
                  )}
                </p>

                {/* Card number */}
                <div className="glass-card p-4 mb-4">
                  <p className="text-xs text-gray-400 mb-2">Karta raqami:</p>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-lg text-white tracking-wider">{CARD_NUMBER}</span>
                    <button
                      onClick={copyCard}
                      className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      {copied ? (
                        <CheckCircle className="w-4 h-4 text-success-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Karta egasi: {CARD_HOLDER}</p>
                </div>

                {/* Promo code */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Promokod (chegirma uchun)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      placeholder="PROMO10"
                      className="glass-input flex-1 px-4 py-3 text-sm uppercase"
                    />
                    <button
                      onClick={applyPromo}
                      disabled={promoChecking || !promoInput.trim()}
                      className="btn-secondary px-5 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {promoChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : "Qo'llash"}
                    </button>
                  </div>
                  {promoMsg && (
                    <p className={`text-xs mt-2 ${promoDiscount ? 'text-success-300' : 'text-error-300'}`}>
                      {promoMsg}
                    </p>
                  )}
                </div>

                {/* Proof upload */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    To'lov skrinshoti <span className="text-error-400">*</span>
                  </label>
                  <label className="glass-card p-4 flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors">
                    <Upload className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-400">
                      {proofFile ? proofFile.name : 'Fayl tanlash'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                    />
                  </label>
                </div>

                {error && (
                  <div className="mb-4 p-3 rounded-xl bg-error-500/10 border border-error-500/20 text-sm text-error-300">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={submitting || !proofFile}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Yuborilmoqda...
                    </>
                  ) : (
                    'Tasdiqlash'
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
