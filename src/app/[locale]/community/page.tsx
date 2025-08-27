'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import StakeadosLayout from '@/components/layout/StakeadosLayout';
import ArticleGrid from '@/components/articles/ArticleGrid';
import {
  Users,
  FileText,
  MessageSquare,
  Award,
  TrendingUp,
  Plus,
} from 'lucide-react';
import type { Locale } from '@/types/content';

export default function CommunityPage() {
  const params = useParams();
  const locale = params.locale as Locale;
  const { t } = useTranslation(locale);
  const [activeTab, setActiveTab] = useState<
    'articles' | 'contribute' | 'contributors'
  >('articles');

  return (
    <StakeadosLayout locale={locale}>
      <div className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-16">
              <div className="flex items-center justify-center gap-3 mb-6">
                <Users className="w-12 h-12 text-green-400" />
                <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
                  {t('nav.community')}
                </h1>
              </div>
              <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                {locale === 'es'
                  ? 'Únete a nuestra comunidad de aprendizaje Web3 y comparte conocimiento'
                  : 'Join our Web3 learning community and share knowledge'}
              </p>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              <div className="stakeados-card text-center p-6">
                <div className="flex items-center justify-center mb-3">
                  <FileText className="w-8 h-8 text-green-400" />
                </div>
                <div className="text-2xl font-bold text-white mb-1">25+</div>
                <div className="text-sm text-gray-300">
                  {locale === 'es'
                    ? 'Artículos Publicados'
                    : 'Published Articles'}
                </div>
              </div>

              <div className="stakeados-card text-center p-6">
                <div className="flex items-center justify-center mb-3">
                  <Users className="w-8 h-8 text-green-400" />
                </div>
                <div className="text-2xl font-bold text-white mb-1">1.2K+</div>
                <div className="text-sm text-gray-300">
                  {locale === 'es' ? 'Miembros Activos' : 'Active Members'}
                </div>
              </div>

              <div className="stakeados-card text-center p-6">
                <div className="flex items-center justify-center mb-3">
                  <MessageSquare className="w-8 h-8 text-green-400" />
                </div>
                <div className="text-2xl font-bold text-white mb-1">500+</div>
                <div className="text-sm text-gray-300">
                  {locale === 'es' ? 'Discusiones' : 'Discussions'}
                </div>
              </div>

              <div className="stakeados-card text-center p-6">
                <div className="flex items-center justify-center mb-3">
                  <Award className="w-8 h-8 text-green-400" />
                </div>
                <div className="text-2xl font-bold text-white mb-1">50+</div>
                <div className="text-sm text-gray-300">
                  {locale === 'es'
                    ? 'Contribuidores Premiados'
                    : 'Contributors Rewarded'}
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('articles')}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    activeTab === 'articles'
                      ? 'stakeados-button-primary'
                      : 'stakeados-button-secondary'
                  }`}
                >
                  <FileText className="w-4 h-4 mr-2 inline" />
                  {t('nav.articles')}
                </button>
                <button
                  onClick={() => setActiveTab('contribute')}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    activeTab === 'contribute'
                      ? 'stakeados-button-primary'
                      : 'stakeados-button-secondary'
                  }`}
                >
                  <Plus className="w-4 h-4 mr-2 inline" />
                  {locale === 'es' ? 'Contribuir' : 'Contribute'}
                </button>
                <button
                  onClick={() => setActiveTab('contributors')}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    activeTab === 'contributors'
                      ? 'stakeados-button-primary'
                      : 'stakeados-button-secondary'
                  }`}
                >
                  <Award className="w-4 h-4 mr-2 inline" />
                  {locale === 'es' ? 'Contribuidores' : 'Contributors'}
                </button>
              </div>

              <button className="stakeados-button-primary">
                <Plus className="w-4 h-4 mr-2" />
                {activeTab === 'articles'
                  ? locale === 'es'
                    ? 'Escribir Artículo'
                    : 'Write Article'
                  : locale === 'es'
                    ? 'Comenzar'
                    : 'Get Started'}
              </button>
            </div>

            {/* Content Sections */}
            {activeTab === 'articles' && (
              <div>
                {/* Featured Articles */}
                <div className="mb-12">
                  <div className="flex items-center gap-3 mb-6">
                    <TrendingUp className="w-6 h-6 text-green-400" />
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
                      {locale === 'es'
                        ? 'Artículos Destacados'
                        : 'Trending Articles'}
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="stakeados-card p-6">
                      <div className="text-4xl mb-4">🚀</div>
                      <h3 className="text-xl font-bold text-green-400 mb-3">
                        {locale === 'es'
                          ? 'Introducción a DeFi'
                          : 'Getting Started with DeFi'}
                      </h3>
                      <p className="text-gray-300 mb-4">
                        {locale === 'es'
                          ? 'Una guía completa sobre finanzas descentralizadas y sus beneficios.'
                          : 'A comprehensive guide to decentralized finance and its benefits.'}
                      </p>
                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <span>
                          {locale === 'es' ? '5 min lectura' : '5 min read'}
                        </span>
                        <span>
                          {locale === 'es' ? 'hace 2 días' : '2 days ago'}
                        </span>
                      </div>
                    </div>

                    <div className="stakeados-card p-6">
                      <div className="text-4xl mb-4">💎</div>
                      <h3 className="text-xl font-bold text-green-400 mb-3">
                        {locale === 'es'
                          ? 'NFTs Educativos: El Futuro'
                          : 'Educational NFTs: The Future'}
                      </h3>
                      <p className="text-gray-300 mb-4">
                        {locale === 'es'
                          ? 'Cómo la tecnología blockchain está revolucionando las credenciales educativas.'
                          : 'How blockchain technology is revolutionizing educational credentials.'}
                      </p>
                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <span>
                          {locale === 'es' ? '8 min lectura' : '8 min read'}
                        </span>
                        <span>
                          {locale === 'es' ? 'hace 1 semana' : '1 week ago'}
                        </span>
                      </div>
                    </div>

                    <div className="stakeados-card p-6">
                      <div className="text-4xl mb-4">⚡</div>
                      <h3 className="text-xl font-bold text-green-400 mb-3">
                        {locale === 'es'
                          ? 'Transacciones Sin Gas'
                          : 'Gasless Transactions'}
                      </h3>
                      <p className="text-gray-300 mb-4">
                        {locale === 'es'
                          ? 'Entendiendo cómo funcionan las transacciones sin gas y sus beneficios.'
                          : 'Understanding how gasless transactions work and their benefits.'}
                      </p>
                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <span>
                          {locale === 'es' ? '6 min lectura' : '6 min read'}
                        </span>
                        <span>
                          {locale === 'es' ? 'hace 3 días' : '3 days ago'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* All Articles */}
                <ArticleGrid
                  locale={locale}
                  showFilters={true}
                  showSearch={true}
                />
              </div>
            )}

            {activeTab === 'contribute' && (
              <div className="stakeados-card p-8 text-center">
                <div className="text-6xl mb-6">🚧</div>
                <h3 className="text-2xl font-bold text-green-400 mb-4">
                  {locale === 'es' ? 'Próximamente' : 'Coming Soon'}
                </h3>
                <p className="text-gray-300 mb-6">
                  {locale === 'es'
                    ? 'Estamos trabajando en un sistema de contribuciones increíble. ¡Mantente atento!'
                    : 'We are working on an amazing contribution system. Stay tuned!'}
                </p>
                <button className="stakeados-button-secondary">
                  {locale === 'es' ? 'Notificarme' : 'Notify Me'}
                </button>
              </div>
            )}

            {activeTab === 'contributors' && (
              <div className="stakeados-card p-8 text-center">
                <div className="text-6xl mb-6">🏆</div>
                <h3 className="text-2xl font-bold text-green-400 mb-4">
                  {locale === 'es'
                    ? 'Reconocimiento de Contribuidores'
                    : 'Contributor Recognition'}
                </h3>
                <p className="text-gray-300 mb-6">
                  {locale === 'es'
                    ? 'Pronto podrás ver el ranking de nuestros mejores contribuidores.'
                    : 'Soon you will be able to see the ranking of our best contributors.'}
                </p>
                <button className="stakeados-button-secondary">
                  {locale === 'es' ? 'Ver Más' : 'Learn More'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </StakeadosLayout>
  );
}
