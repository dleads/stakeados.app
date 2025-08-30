'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import PageLayout from '@/components/layout/PageLayout';
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

export default function ComunidadPage() {
  const params = useParams();
  const locale = params.locale as Locale;
  const [activeTab, setActiveTab] = useState<
    'articles' | 'contribute' | 'contributors'
  >('articles');

  return (
    <PageLayout showBreadcrumbs={true} className="bg-gradient-to-br from-black via-gray-900 to-black text-white">
      <div className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-16">
              <div className="flex items-center justify-center gap-3 mb-6">
                <Users className="w-12 h-12 text-green-400" />
                <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
                  Comunidad Stakeados
                </h1>
              </div>
              <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Únete a nuestra comunidad de aprendizaje Web3 y comparte
                conocimiento con expertos
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
                  Artículos Publicados
                </div>
              </div>

              <div className="stakeados-card text-center p-6">
                <div className="flex items-center justify-center mb-3">
                  <Users className="w-8 h-8 text-green-400" />
                </div>
                <div className="text-2xl font-bold text-white mb-1">1.2K+</div>
                <div className="text-sm text-gray-300">Miembros Activos</div>
              </div>

              <div className="stakeados-card text-center p-6">
                <div className="flex items-center justify-center mb-3">
                  <MessageSquare className="w-8 h-8 text-green-400" />
                </div>
                <div className="text-2xl font-bold text-white mb-1">500+</div>
                <div className="text-sm text-gray-300">Discusiones</div>
              </div>

              <div className="stakeados-card text-center p-6">
                <div className="flex items-center justify-center mb-3">
                  <Award className="w-8 h-8 text-green-400" />
                </div>
                <div className="text-2xl font-bold text-white mb-1">50+</div>
                <div className="text-sm text-gray-300">
                  Contribuidores Premiados
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
                  Artículos
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
                  Contribuir
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
                  Contribuidores
                </button>
              </div>

              <button className="stakeados-button-primary">
                <Plus className="w-4 h-4 mr-2" />
                {activeTab === 'articles' ? 'Escribir Artículo' : 'Comenzar'}
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
                      Artículos Destacados
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="stakeados-card p-6">
                      <div className="text-4xl mb-4">🚀</div>
                      <h3 className="text-xl font-bold text-green-400 mb-3">
                        Introducción a DeFi
                      </h3>
                      <p className="text-gray-300 mb-4">
                        Una guía completa sobre finanzas descentralizadas y sus
                        beneficios para el futuro.
                      </p>
                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <span>5 min lectura</span>
                        <span>hace 2 días</span>
                      </div>
                    </div>

                    <div className="stakeados-card p-6">
                      <div className="text-4xl mb-4">💎</div>
                      <h3 className="text-xl font-bold text-green-400 mb-3">
                        NFTs Educativos: El Futuro
                      </h3>
                      <p className="text-gray-300 mb-4">
                        Cómo la tecnología blockchain está revolucionando las
                        credenciales educativas.
                      </p>
                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <span>8 min lectura</span>
                        <span>hace 1 semana</span>
                      </div>
                    </div>

                    <div className="stakeados-card p-6">
                      <div className="text-4xl mb-4">⚡</div>
                      <h3 className="text-xl font-bold text-green-400 mb-3">
                        Transacciones Sin Gas
                      </h3>
                      <p className="text-gray-300 mb-4">
                        Entendiendo cómo funcionan las transacciones sin gas y
                        sus beneficios.
                      </p>
                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <span>6 min lectura</span>
                        <span>hace 3 días</span>
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
                  Próximamente
                </h3>
                <p className="text-gray-300 mb-6">
                  Estamos trabajando en un sistema de contribuciones increíble.
                  ¡Mantente atento para ser parte de nuestra comunidad de
                  creadores!
                </p>
                <button className="stakeados-button-secondary">
                  Notificarme Cuando Esté Listo
                </button>
              </div>
            )}

            {activeTab === 'contributors' && (
              <div className="stakeados-card p-8 text-center">
                <div className="text-6xl mb-6">🏆</div>
                <h3 className="text-2xl font-bold text-green-400 mb-4">
                  Reconocimiento de Contribuidores
                </h3>
                <p className="text-gray-300 mb-6">
                  Pronto podrás ver el ranking de nuestros mejores
                  contribuidores y sus logros en la comunidad.
                </p>
                <button className="stakeados-button-secondary">
                  Conocer Más
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
