'use client';

import React, { useState } from 'react';
import { useTranslation, getLocalizedUrl } from '@/lib/i18n';
import Footer from '@/components/navigation/Footer';
import {
  GamingBackground,
  GamingText,
  GamingButton,
  GamingCard,
} from '@/components/effects';
import {
  Zap,
  TrendingUp,
  Users,
  BookOpen,
  Newspaper,
  Star,
} from 'lucide-react';
import type { Locale } from '@/types/content';
import AdUnit from '@/components/ads/AdUnit';

export interface SimpleHomePageProps {
  locale: Locale;
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function SimpleHomePage({ locale }: SimpleHomePageProps) {
  const { t } = useTranslation(locale);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<null | { ok: boolean; msg: string }>(
    null
  );

  return (
    <GamingBackground>
      <div className="bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 text-white">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-16">
          <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-blue-500/10"></div>
          <div className="container mx-auto px-4 py-20 relative">
            <div className="text-center max-w-4xl mx-auto">
              {/* Title */}
              <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight">
                <span className="bg-gradient-to-r from-green-400 via-green-300 to-green-500 bg-clip-text text-transparent">
                  STAKEADOS
                </span>
                <br />
                <span className="text-white">
                  {locale === 'es' ? 'WEB3 Y BLOCKCHAIN' : 'WEB3 & BLOCKCHAIN'}
                </span>
              </h1>

              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                {locale === 'es'
                  ? 'Descubre el mundo de las criptomonedas, blockchain y tecnologías descentralizadas con contenido educativo de calidad'
                  : 'Discover the world of cryptocurrencies, blockchain and decentralized technologies with quality educational content'}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <GamingButton
                  href={getLocalizedUrl('/articles', locale)}
                  variant="primary"
                  size="lg"
                >
                  <BookOpen className="w-5 h-5" />
                  {t('home.hero.cta.articles')}
                </GamingButton>

                <GamingButton
                  href={getLocalizedUrl('/news', locale)}
                  variant="neon"
                  size="lg"
                >
                  <Newspaper className="w-5 h-5" />
                  {t('home.hero.cta.news')}
                </GamingButton>
              </div>
            </div>
          </div>
        </section>

        {/* AdSense Banner */}
        <div className="container mx-auto px-4 mt-6">
          <AdUnit slot="6373701520" className="my-4" />
        </div>

        {/* Featured News Section */}
        <section className="py-16 bg-gray-800/30 scan-lines">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-4xl font-bold text-center">
                <span className="bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
                  {t('home.news.title')}
                </span>
              </h2>
              <GamingButton
                href={getLocalizedUrl('/news', locale)}
                variant="secondary"
                size="sm"
              >
                {t('home.news.viewAll')}
              </GamingButton>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  title:
                    locale === 'es'
                      ? 'Bitcoin Alcanza Nuevo Máximo Histórico'
                      : 'Bitcoin Reaches New All-Time High',
                  category: locale === 'es' ? 'Mercados' : 'Markets',
                  time: '2h',
                  trend: 'up',
                  image:
                    'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400&h=200&fit=crop&crop=center',
                  summary:
                    locale === 'es'
                      ? 'El precio de Bitcoin supera los $100,000 por primera vez en la historia, impulsado por la adopción institucional.'
                      : 'Bitcoin price surpasses $100,000 for the first time in history, driven by institutional adoption.',
                },
                {
                  title:
                    locale === 'es'
                      ? 'Ethereum 2.0: Actualización de Staking'
                      : 'Ethereum 2.0: Staking Update',
                  category: locale === 'es' ? 'Tecnología' : 'Technology',
                  time: '4h',
                  trend: 'neutral',
                  image:
                    'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=200&fit=crop&crop=center',
                  summary:
                    locale === 'es'
                      ? 'Nueva actualización mejora la eficiencia del staking en Ethereum 2.0, reduciendo las comisiones.'
                      : 'New update improves staking efficiency on Ethereum 2.0, reducing transaction fees.',
                },
                {
                  title:
                    locale === 'es'
                      ? 'DeFi TVL Supera los $200B'
                      : 'DeFi TVL Surpasses $200B',
                  category: 'DeFi',
                  time: '6h',
                  trend: 'up',
                  image:
                    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=200&fit=crop&crop=center',
                  summary:
                    locale === 'es'
                      ? 'El valor total bloqueado en protocolos DeFi alcanza un nuevo récord histórico de $200 billones.'
                      : 'Total value locked in DeFi protocols reaches a new historical record of $200 billion.',
                },
                {
                  title:
                    locale === 'es'
                      ? 'Regulación Crypto en Europa'
                      : 'Crypto Regulation in Europe',
                  category: locale === 'es' ? 'Regulación' : 'Regulation',
                  time: '8h',
                  trend: 'neutral',
                  image:
                    'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=200&fit=crop&crop=center',
                  summary:
                    locale === 'es'
                      ? 'La Unión Europea aprueba nuevas regulaciones para el mercado de criptomonedas.'
                      : 'The European Union approves new regulations for the cryptocurrency market.',
                },
                {
                  title:
                    locale === 'es'
                      ? 'NFTs Educativos Ganan Popularidad'
                      : 'Educational NFTs Gain Popularity',
                  category: locale === 'es' ? 'Educación' : 'Education',
                  time: '12h',
                  trend: 'up',
                  image:
                    'https://images.unsplash.com/photo-1617957718614-8c8e8c6e7d7b?w=400&h=200&fit=crop&crop=center',
                  summary:
                    locale === 'es'
                      ? 'Los NFTs educativos se posicionan como una nueva forma de certificación académica.'
                      : 'Educational NFTs are positioned as a new form of academic certification.',
                },
                {
                  title:
                    locale === 'es'
                      ? 'Web3 Gaming: El Futuro del Entretenimiento'
                      : 'Web3 Gaming: The Future of Entertainment',
                  category: 'Gaming',
                  time: '1d',
                  trend: 'up',
                  image:
                    'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=200&fit=crop&crop=center',
                  summary:
                    locale === 'es'
                      ? 'Los juegos Web3 experimentan un crecimiento exponencial con nuevas mecánicas play-to-earn.'
                      : 'Web3 games experience exponential growth with new play-to-earn mechanics.',
                },
              ].map((news, i) => (
                <GamingCard
                  key={i}
                  variant="cyber"
                  className="group cursor-pointer overflow-hidden"
                >
                  <div className="relative mb-4">
                    <img
                      src={news.image}
                      alt={news.title}
                      className="w-full h-32 object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2 flex items-center space-x-2">
                      {news.trend === 'up' && (
                        <TrendingUp className="w-4 h-4 text-green-400" />
                      )}
                      <span className="text-xs bg-black/70 text-white px-2 py-1 rounded">
                        {news.time}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-cyan-400 font-semibold">
                      {news.category}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-3 group-hover:text-cyan-400 transition-colors line-clamp-2">
                    {news.title}
                  </h3>
                  <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                    {news.summary}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {locale === 'es' ? 'Última hora' : 'Breaking News'}
                    </span>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                </GamingCard>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Articles Section */}
        <section className="py-16 cyber-grid">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-4xl font-bold text-center">
                <span className="bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
                  {t('home.articles.title')}
                </span>
              </h2>
              <GamingButton
                href={getLocalizedUrl('/articles', locale)}
                variant="secondary"
                size="sm"
              >
                {t('home.articles.viewAll')}
              </GamingButton>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  title:
                    locale === 'es'
                      ? 'Guía Completa de DeFi para Principiantes'
                      : 'Complete DeFi Guide for Beginners',
                  level: locale === 'es' ? 'Principiante' : 'Beginner',
                  readTime: '8 min',
                  rating: 4.8,
                  image:
                    'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=200&fit=crop&crop=center',
                  summary:
                    locale === 'es'
                      ? 'Aprende los fundamentos de las finanzas descentralizadas y cómo participar de forma segura.'
                      : 'Learn the fundamentals of decentralized finance and how to participate safely.',
                },
                {
                  title:
                    locale === 'es'
                      ? 'Seguridad en Smart Contracts'
                      : 'Smart Contract Security',
                  level: locale === 'es' ? 'Avanzado' : 'Advanced',
                  readTime: '12 min',
                  rating: 4.9,
                  image:
                    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=200&fit=crop&crop=center',
                  summary:
                    locale === 'es'
                      ? 'Domina las mejores prácticas de seguridad para el desarrollo de contratos inteligentes.'
                      : 'Master security best practices for smart contract development.',
                },
                {
                  title:
                    locale === 'es'
                      ? 'Análisis de Mercados NFT'
                      : 'NFT Marketplace Analysis',
                  level: locale === 'es' ? 'Intermedio' : 'Intermediate',
                  readTime: '6 min',
                  rating: 4.7,
                  image:
                    'https://images.unsplash.com/photo-1617957718614-8c8e8c6e7d7b?w=400&h=200&fit=crop&crop=center',
                  summary:
                    locale === 'es'
                      ? 'Entiende cómo funcionan los mercados de NFTs y las oportunidades de inversión.'
                      : 'Understand how NFT markets work and investment opportunities.',
                },
                {
                  title:
                    locale === 'es'
                      ? 'Introducción a Blockchain'
                      : 'Introduction to Blockchain',
                  level: locale === 'es' ? 'Principiante' : 'Beginner',
                  readTime: '10 min',
                  rating: 4.6,
                  image:
                    'https://images.unsplash.com/photo-1639322537228-f710d846310a?w=400&h=200&fit=crop&crop=center',
                  summary:
                    locale === 'es'
                      ? 'Conceptos básicos de la tecnología blockchain explicados de forma sencilla.'
                      : 'Basic blockchain technology concepts explained in simple terms.',
                },
                {
                  title:
                    locale === 'es'
                      ? 'Staking y Validación'
                      : 'Staking and Validation',
                  level: locale === 'es' ? 'Intermedio' : 'Intermediate',
                  readTime: '9 min',
                  rating: 4.5,
                  image:
                    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=200&fit=crop&crop=center',
                  summary:
                    locale === 'es'
                      ? 'Aprende cómo generar ingresos pasivos mediante el staking de criptomonedas.'
                      : 'Learn how to generate passive income through cryptocurrency staking.',
                },
                {
                  title:
                    locale === 'es'
                      ? 'Web3 y el Futuro de Internet'
                      : 'Web3 and the Future of Internet',
                  level: locale === 'es' ? 'Intermedio' : 'Intermediate',
                  readTime: '11 min',
                  rating: 4.8,
                  image:
                    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=200&fit=crop&crop=center',
                  summary:
                    locale === 'es'
                      ? 'Explora cómo Web3 está transformando la forma en que interactuamos con internet.'
                      : 'Explore how Web3 is transforming the way we interact with the internet.',
                },
              ].map((article, i) => (
                <GamingCard
                  key={i}
                  variant="holographic"
                  className="group cursor-pointer overflow-hidden"
                >
                  <div className="relative mb-4">
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-32 object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2 flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-yellow-400 bg-black/70 px-2 py-1 rounded">
                        {article.rating}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-sm font-semibold px-2 py-1 rounded ${
                        article.level === 'Principiante' ||
                        article.level === 'Beginner'
                          ? 'bg-green-500/20 text-green-400'
                          : article.level === 'Intermedio' ||
                              article.level === 'Intermediate'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {article.level}
                    </span>
                    <span className="text-xs text-gray-400">
                      {article.readTime}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-3 group-hover:text-purple-400 transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                    {article.summary}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>
                      {locale === 'es'
                        ? 'Por Equipo Stakeados'
                        : 'By Stakeados Team'}
                    </span>
                    <span>{article.readTime}</span>
                  </div>
                  <div className="mt-3 h-1 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
                      style={{ width: '75%' }}
                    ></div>
                  </div>
                </GamingCard>
              ))}
            </div>
          </div>
        </section>

        {/* AdSense Banner */}
        <div className="container mx-auto px-4 mt-6">
          <AdUnit slot="6373701520" className="my-4" />
        </div>

        {/* Quick Navigation Section */}
        <section className="py-16 bg-gray-800/30 matrix-bg">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-white text-center mb-12 flex items-center justify-center">
              <Zap className="w-8 h-8 text-yellow-400 mr-3 neon-text" />
              <GamingText text={t('home.navigation.title')} variant="neon" />
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <GamingCard
                variant="neon"
                className="text-center relative group cursor-pointer"
              >
                <div className="absolute top-2 right-2">
                  <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded neon-border">
                    🚧 BETA
                  </span>
                </div>
                <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-16 h-16 text-yellow-400 mx-auto neon-text" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {t('nav.courses')}
                </h3>
                <p className="text-gray-300 text-sm mb-3">
                  Master Web3 development
                </p>
                <div className="text-yellow-400 font-semibold terminal-text">
                  {t('course.comingSoon')}
                </div>
                <div className="mt-3 h-1 bg-gray-700 rounded-full">
                  <div
                    className="h-full bg-yellow-400 rounded-full animate-pulse"
                    style={{ width: '25%' }}
                  ></div>
                </div>
              </GamingCard>

              <GamingCard
                variant="cyber"
                className="text-center group cursor-pointer"
              >
                <a href={getLocalizedUrl('/news', locale)} className="block">
                  <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">
                    <Newspaper className="w-16 h-16 text-cyan-400 mx-auto neon-text" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                    {t('nav.news')}
                  </h3>
                  <p className="text-gray-300 text-sm mb-3">
                    Real-time crypto updates
                  </p>
                  <div className="text-cyan-400 font-semibold terminal-text">
                    <GamingText text="342" variant="neon" />{' '}
                    {t('stats.articles')}
                  </div>
                  <div className="mt-3 flex justify-center">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                  </div>
                </a>
              </GamingCard>

              <GamingCard
                variant="holographic"
                className="text-center group cursor-pointer"
              >
                <a
                  href={getLocalizedUrl('/community', locale)}
                  className="block"
                >
                  <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">
                    <Users className="w-16 h-16 text-purple-400 mx-auto neon-text" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-purple-400 transition-colors">
                    {t('nav.community')}
                  </h3>
                  <p className="text-gray-300 text-sm mb-3">
                    Elite gaming community
                  </p>
                  <div className="text-purple-400 font-semibold terminal-text">
                    <GamingText text="1.2K" variant="neon" />{' '}
                    {t('stats.members')}
                  </div>
                  <div className="mt-3 flex justify-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1 h-4 bg-purple-400 rounded animate-pulse"
                        style={{ animationDelay: `${i * 0.1}s` }}
                      ></div>
                    ))}
                  </div>
                </a>
              </GamingCard>

              <GamingCard
                variant="default"
                className="text-center group cursor-pointer"
              >
                <a
                  href={getLocalizedUrl('/articles', locale)}
                  className="block"
                >
                  <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">
                    <BookOpen className="w-16 h-16 text-yellow-300 mx-auto neon-text" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-yellow-300 transition-colors">
                    {t('nav.articles')}
                  </h3>
                  <p className="text-gray-300 text-sm mb-3">
                    Educational content
                  </p>
                  <div className="text-yellow-300 font-semibold terminal-text">
                    <GamingText text="500+" variant="neon" />{' '}
                    {t('stats.articles')}
                  </div>
                  <div className="mt-3 h-1 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-300 to-orange-300 rounded-full animate-pulse"
                      style={{ width: '85%' }}
                    ></div>
                  </div>
                </a>
              </GamingCard>
            </div>
          </div>
        </section>

        {/* Courses Preview Section - En Desarrollo */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-white">
                {t('home.courses.title')}
              </h2>
              <span className="text-yellow-400 text-sm font-medium">
                {t('course.comingSoon')}
              </span>
            </div>

            {/* Coming Soon Message with inline CTA */}
            <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg p-8 text-center mb-8">
              <div className="text-4xl mb-4">🚧</div>
              <h3 className="text-xl font-semibold text-yellow-400 mb-3">
                {t('course.comingSoon')}
              </h3>
              <p className="text-gray-300 mb-4">{t('course.inDevelopment')}</p>
              <div className="text-sm text-gray-400 mb-4">
                {t('course.stayTuned')}
              </div>

              {/* Inline newsletter CTA */}
              <form
                className="mx-auto max-w-xl flex flex-col sm:flex-row gap-3 justify-center"
                onSubmit={async e => {
                  e.preventDefault();
                  if (!email) return;
                  setLoading(true);
                  setStatus(null);
                  try {
                    const res = await fetch('/api/newsletter', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email, locale }),
                    });
                    const data = await res.json();
                    if (res.ok) {
                      setStatus({ ok: true, msg: '¡Gracias por suscribirte!' });
                      setEmail('');
                    } else {
                      setStatus({
                        ok: false,
                        msg: data?.error || 'No se pudo suscribir',
                      });
                    }
                  } catch {
                    setStatus({ ok: false, msg: 'Error de red' });
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="Tu email"
                  aria-label="Correo electrónico"
                  className="w-full sm:w-auto flex-1 min-w-[260px] bg-gray-900/60 border border-yellow-500/30 text-white rounded-gaming px-4 h-10 text-sm focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all"
                />
                <button
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-500 text-white font-semibold px-6 h-10 rounded-gaming transition-colors disabled:opacity-60"
                >
                  {loading ? 'Enviando…' : 'Suscribirse'}
                </button>
              </form>
              {status && (
                <div
                  role="status"
                  className={`mt-3 text-sm text-center ${status.ok ? 'text-green-400' : 'text-red-400'}`}
                >
                  {status.msg}
                </div>
              )}
            </div>

            {/* Preview of Future Courses removed intentionally to avoid empty placeholders */}
          </div>
        </section>

        {/* Footer */}
        <Footer />
      </div>
    </GamingBackground>
  );
}
