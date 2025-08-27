'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import StakeadosLayout from '@/components/layout/StakeadosLayout';
import {
  Newspaper,
  TrendingUp,
  Globe,
  Bot,
  Zap,
  Grid,
  List,
  Clock,
  Eye,
} from 'lucide-react';
import type { Locale } from '@/types/content';

export default function NewsPage() {
  const params = useParams();
  const locale = params.locale as Locale;
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Mock news data
  const news = [
    {
      id: 1,
      title:
        locale === 'es'
          ? 'Bitcoin Alcanza Nuevo Máximo Histórico'
          : 'Bitcoin Reaches New All-Time High',
      summary:
        locale === 'es'
          ? 'El precio de Bitcoin supera los $100,000 por primera vez en la historia.'
          : 'Bitcoin price surpasses $100,000 for the first time in history.',
      category: locale === 'es' ? 'Mercados' : 'Markets',
      date: '2025-01-08',
      time: '2h',
      views: '1.2K',
      image: '📈',
      trending: true,
    },
    {
      id: 2,
      title:
        locale === 'es'
          ? 'Ethereum 2.0: Actualización de Staking'
          : 'Ethereum 2.0: Staking Update',
      summary:
        locale === 'es'
          ? 'Nueva actualización mejora la eficiencia del staking en Ethereum 2.0.'
          : 'New update improves staking efficiency on Ethereum 2.0.',
      category: locale === 'es' ? 'Tecnología' : 'Technology',
      date: '2025-01-08',
      time: '4h',
      views: '856',
      image: '⚡',
      trending: false,
    },
    {
      id: 3,
      title:
        locale === 'es'
          ? 'DeFi TVL Supera los $200B'
          : 'DeFi TVL Surpasses $200B',
      summary:
        locale === 'es'
          ? 'El valor total bloqueado en protocolos DeFi alcanza un nuevo récord.'
          : 'Total value locked in DeFi protocols reaches a new record.',
      category: 'DeFi',
      date: '2025-01-07',
      time: '1d',
      views: '634',
      image: '🚀',
      trending: true,
    },
  ];

  const categories =
    locale === 'es'
      ? ['Todos', 'Mercados', 'Tecnología', 'DeFi', 'Regulación']
      : ['All', 'Markets', 'Technology', 'DeFi', 'Regulation'];
  const [activeCategory, setActiveCategory] = useState(categories[0]);

  const filteredNews =
    activeCategory === categories[0]
      ? news
      : news.filter(item => item.category === activeCategory);

  return (
    <StakeadosLayout locale={locale}>
      <div className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-16">
              <div className="flex items-center justify-center gap-3 mb-6">
                <Newspaper className="w-12 h-12 text-green-400" />
                <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
                  {locale === 'es' ? 'Noticias Crypto' : 'Crypto News'}
                </h1>
              </div>
              <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                {locale === 'es'
                  ? 'Mantente actualizado con las últimas noticias del mundo cripto'
                  : 'Stay updated with the latest cryptocurrency and blockchain news'}
              </p>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              <div className="stakeados-card text-center p-6">
                <div className="flex items-center justify-center mb-3">
                  <Globe className="w-8 h-8 text-green-400" />
                </div>
                <div className="text-2xl font-bold text-white mb-1">500+</div>
                <div className="text-sm text-gray-300">
                  {locale === 'es' ? 'Noticias Diarias' : 'Daily News'}
                </div>
              </div>

              <div className="stakeados-card text-center p-6">
                <div className="flex items-center justify-center mb-3">
                  <Bot className="w-8 h-8 text-green-400" />
                </div>
                <div className="text-2xl font-bold text-white mb-1">AI</div>
                <div className="text-sm text-gray-300">
                  {locale === 'es' ? 'Curación Inteligente' : 'Smart Curation'}
                </div>
              </div>

              <div className="stakeados-card text-center p-6">
                <div className="flex items-center justify-center mb-3">
                  <TrendingUp className="w-8 h-8 text-green-400" />
                </div>
                <div className="text-2xl font-bold text-white mb-1">9.2/10</div>
                <div className="text-sm text-gray-300">
                  {locale === 'es' ? 'Calidad Promedio' : 'Average Quality'}
                </div>
              </div>

              <div className="stakeados-card text-center p-6">
                <div className="flex items-center justify-center mb-3">
                  <Zap className="w-8 h-8 text-green-400" />
                </div>
                <div className="text-2xl font-bold text-white mb-1">50+</div>
                <div className="text-sm text-gray-300">
                  {locale === 'es' ? 'Fuentes Verificadas' : 'Verified Sources'}
                </div>
              </div>
            </div>

            {/* Filters and View Mode */}
            <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
              {/* Category Filters */}
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeCategory === category
                        ? 'stakeados-button-primary'
                        : 'stakeados-button-secondary'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-2 bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-green-500 text-black'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <Grid className="w-4 h-4 mr-2 inline" />
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                    viewMode === 'list'
                      ? 'bg-green-500 text-black'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <List className="w-4 h-4 mr-2 inline" />
                  {locale === 'es' ? 'Lista' : 'List'}
                </button>
              </div>
            </div>

            {/* News Grid/List */}
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                  : 'space-y-4'
              }
            >
              {filteredNews.map(newsItem => (
                <div
                  key={newsItem.id}
                  className={`stakeados-card group cursor-pointer ${
                    viewMode === 'list' ? 'p-4' : 'p-6'
                  }`}
                >
                  {viewMode === 'grid' ? (
                    // Grid View
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs px-2 py-1 rounded-full font-semibold bg-green-500/20 text-green-400">
                          {newsItem.category}
                        </span>
                        {newsItem.trending && (
                          <div className="flex items-center text-green-400">
                            <TrendingUp className="w-4 h-4" />
                          </div>
                        )}
                      </div>

                      <div className="text-4xl mb-4 text-center group-hover:scale-110 transition-transform duration-300">
                        {newsItem.image}
                      </div>

                      <h3 className="text-lg font-semibold text-white mb-3 group-hover:text-green-400 transition-colors">
                        {newsItem.title}
                      </h3>

                      <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                        {newsItem.summary}
                      </p>

                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {newsItem.time}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {newsItem.views}
                          </span>
                        </div>
                        <span>{newsItem.date}</span>
                      </div>
                    </>
                  ) : (
                    // List View
                    <div className="flex items-center gap-4">
                      <div className="text-3xl">{newsItem.image}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs px-2 py-1 rounded-full font-semibold bg-green-500/20 text-green-400">
                            {newsItem.category}
                          </span>
                          {newsItem.trending && (
                            <TrendingUp className="w-4 h-4 text-green-400" />
                          )}
                        </div>
                        <h3 className="font-semibold text-white mb-1 group-hover:text-green-400 transition-colors">
                          {newsItem.title}
                        </h3>
                        <p className="text-gray-300 text-sm mb-2">
                          {newsItem.summary}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {newsItem.time}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {newsItem.views}
                          </span>
                          <span>{newsItem.date}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Load More Button */}
            <div className="text-center mt-12">
              <button className="stakeados-button-primary">
                {locale === 'es' ? 'Cargar Más Noticias' : 'Load More News'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </StakeadosLayout>
  );
}
