'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import PageLayout from '@/components/layout/PageLayout';
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

export default function NoticiasPage() {
  const params = useParams();
  const locale = params.locale as Locale;
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Mock news data
  const noticias = [
    {
      id: 1,
      titulo: 'Bitcoin Alcanza Nuevo Máximo Histórico',
      resumen:
        'El precio de Bitcoin supera los $100,000 por primera vez en la historia, impulsado por la adopción institucional.',
      categoria: 'Mercados',
      fecha: '2025-01-08',
      tiempo: '2h',
      vistas: '1.2K',
      imagen: '📈',
      trending: true,
    },
    {
      id: 2,
      titulo: 'Ethereum 2.0: Actualización de Staking',
      resumen:
        'Nueva actualización mejora la eficiencia del staking en Ethereum 2.0, reduciendo las comisiones.',
      categoria: 'Tecnología',
      fecha: '2025-01-08',
      tiempo: '4h',
      vistas: '856',
      imagen: '⚡',
      trending: false,
    },
    {
      id: 3,
      titulo: 'DeFi TVL Supera los $200B',
      resumen:
        'El valor total bloqueado en protocolos DeFi alcanza un nuevo récord histórico.',
      categoria: 'DeFi',
      fecha: '2025-01-07',
      tiempo: '1d',
      vistas: '634',
      imagen: '🚀',
      trending: true,
    },
    {
      id: 4,
      titulo: 'Regulación Crypto en Europa',
      resumen:
        'La Unión Europea aprueba nuevas regulaciones para el mercado de criptomonedas.',
      categoria: 'Regulación',
      fecha: '2025-01-07',
      tiempo: '1d',
      vistas: '945',
      imagen: '🏛️',
      trending: false,
    },
    {
      id: 5,
      titulo: 'NFTs Educativos Ganan Popularidad',
      resumen:
        'Los NFTs educativos se posicionan como una nueva forma de certificación académica.',
      categoria: 'Educación',
      fecha: '2025-01-06',
      tiempo: '2d',
      vistas: '423',
      imagen: '🎓',
      trending: false,
    },
    {
      id: 6,
      titulo: 'Web3 Gaming: El Futuro del Entretenimiento',
      resumen:
        'Los juegos Web3 experimentan un crecimiento exponencial con nuevas mecánicas play-to-earn.',
      categoria: 'Gaming',
      fecha: '2025-01-06',
      tiempo: '2d',
      vistas: '789',
      imagen: '🎮',
      trending: true,
    },
  ];

  const categorias = [
    'Todos',
    'Mercados',
    'Tecnología',
    'DeFi',
    'Regulación',
    'Educación',
    'Gaming',
  ];
  const [categoriaActiva, setCategoriaActiva] = useState('Todos');

  const noticiasFiltradas =
    categoriaActiva === 'Todos'
      ? noticias
      : noticias.filter(noticia => noticia.categoria === categoriaActiva);

  return (
    <PageLayout showBreadcrumbs={true} className="bg-gradient-to-br from-black via-gray-900 to-black text-white">
      <div className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-16">
              <div className="flex items-center justify-center gap-3 mb-6">
                <Newspaper className="w-12 h-12 text-green-400" />
                <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
                  Noticias Crypto
                </h1>
              </div>
              <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Mantente actualizado con las últimas noticias del mundo cripto y
                blockchain
              </p>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              <div className="stakeados-card text-center p-6">
                <div className="flex items-center justify-center mb-3">
                  <Globe className="w-8 h-8 text-green-400" />
                </div>
                <div className="text-2xl font-bold text-white mb-1">500+</div>
                <div className="text-sm text-gray-300">Noticias Diarias</div>
              </div>

              <div className="stakeados-card text-center p-6">
                <div className="flex items-center justify-center mb-3">
                  <Bot className="w-8 h-8 text-green-400" />
                </div>
                <div className="text-2xl font-bold text-white mb-1">AI</div>
                <div className="text-sm text-gray-300">
                  Curación Inteligente
                </div>
              </div>

              <div className="stakeados-card text-center p-6">
                <div className="flex items-center justify-center mb-3">
                  <TrendingUp className="w-8 h-8 text-green-400" />
                </div>
                <div className="text-2xl font-bold text-white mb-1">9.2/10</div>
                <div className="text-sm text-gray-300">Calidad Promedio</div>
              </div>

              <div className="stakeados-card text-center p-6">
                <div className="flex items-center justify-center mb-3">
                  <Zap className="w-8 h-8 text-green-400" />
                </div>
                <div className="text-2xl font-bold text-white mb-1">50+</div>
                <div className="text-sm text-gray-300">Fuentes Verificadas</div>
              </div>
            </div>

            {/* Filters and View Mode */}
            <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
              {/* Category Filters */}
              <div className="flex flex-wrap gap-2">
                {categorias.map(categoria => (
                  <button
                    key={categoria}
                    onClick={() => setCategoriaActiva(categoria)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      categoriaActiva === categoria
                        ? 'stakeados-button-primary'
                        : 'stakeados-button-secondary'
                    }`}
                  >
                    {categoria}
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
                  Lista
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
              {noticiasFiltradas.map(noticia => (
                <div
                  key={noticia.id}
                  className={`stakeados-card group cursor-pointer ${
                    viewMode === 'list' ? 'p-4' : 'p-6'
                  }`}
                >
                  {viewMode === 'grid' ? (
                    // Grid View
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-semibold ${
                            noticia.categoria === 'Mercados'
                              ? 'bg-green-500/20 text-green-400'
                              : noticia.categoria === 'Tecnología'
                                ? 'bg-blue-500/20 text-blue-400'
                                : noticia.categoria === 'DeFi'
                                  ? 'bg-purple-500/20 text-purple-400'
                                  : noticia.categoria === 'Regulación'
                                    ? 'bg-yellow-500/20 text-yellow-400'
                                    : noticia.categoria === 'Educación'
                                      ? 'bg-pink-500/20 text-pink-400'
                                      : 'bg-cyan-500/20 text-cyan-400'
                          }`}
                        >
                          {noticia.categoria}
                        </span>
                        {noticia.trending && (
                          <div className="flex items-center text-green-400">
                            <TrendingUp className="w-4 h-4" />
                          </div>
                        )}
                      </div>

                      <div className="text-4xl mb-4 text-center group-hover:scale-110 transition-transform duration-300">
                        {noticia.imagen}
                      </div>

                      <h3 className="text-lg font-semibold text-white mb-3 group-hover:text-green-400 transition-colors">
                        {noticia.titulo}
                      </h3>

                      <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                        {noticia.resumen}
                      </p>

                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {noticia.tiempo}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {noticia.vistas}
                          </span>
                        </div>
                        <span>{noticia.fecha}</span>
                      </div>
                    </>
                  ) : (
                    // List View
                    <div className="flex items-center gap-4">
                      <div className="text-3xl">{noticia.imagen}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-semibold ${
                              noticia.categoria === 'Mercados'
                                ? 'bg-green-500/20 text-green-400'
                                : noticia.categoria === 'Tecnología'
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : noticia.categoria === 'DeFi'
                                    ? 'bg-purple-500/20 text-purple-400'
                                    : noticia.categoria === 'Regulación'
                                      ? 'bg-yellow-500/20 text-yellow-400'
                                      : noticia.categoria === 'Educación'
                                        ? 'bg-pink-500/20 text-pink-400'
                                        : 'bg-cyan-500/20 text-cyan-400'
                            }`}
                          >
                            {noticia.categoria}
                          </span>
                          {noticia.trending && (
                            <TrendingUp className="w-4 h-4 text-green-400" />
                          )}
                        </div>
                        <h3 className="font-semibold text-white mb-1 group-hover:text-green-400 transition-colors">
                          {noticia.titulo}
                        </h3>
                        <p className="text-gray-300 text-sm mb-2">
                          {noticia.resumen}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {noticia.tiempo}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {noticia.vistas}
                          </span>
                          <span>{noticia.fecha}</span>
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
                Cargar Más Noticias
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
