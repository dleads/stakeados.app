'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslation, getLocalizedUrl } from '@/lib/i18n';
import type { Locale } from '@/types/content';

export interface FooterProps {
  locale: Locale;
}

export default function Footer({ locale }: FooterProps) {
  const { t } = useTranslation(locale);

  const footerSections = [
    {
      title: 'Platform',
      links: [
        {
          label: t('nav.articles'),
          href: getLocalizedUrl('/articles', locale),
        },
        { label: t('nav.news'), href: getLocalizedUrl('/news', locale) },
        {
          label: t('nav.community'),
          href: getLocalizedUrl('/community', locale),
        },
      ],
    },
    {
      title: 'Resources',
      links: [
        { label: 'Documentation', href: '#' },
        { label: 'API', href: '#' },
        { label: 'Help Center', href: '#' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About', href: '#' },
        { label: 'Blog', href: '#' },
        { label: 'Careers', href: '#' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy Policy', href: '#' },
        { label: 'Terms of Service', href: '#' },
        { label: 'Cookie Policy', href: '#' },
      ],
    },
  ];

  const socialLinks = [
    {
      name: 'GitHub',
      href: 'https://github.com/stakeados',
      icon: '🐙',
    },
    {
      name: 'Twitter',
      href: 'https://twitter.com/stakeados',
      icon: '🐦',
    },
    {
      name: 'Discord',
      href: 'https://discord.gg/stakeados',
      icon: '💬',
    },
    {
      name: 'Email',
      href: 'mailto:hello@stakeados.com',
      icon: '📧',
    },
  ];

  return (
    <footer className="bg-black border-t border-green-500/20">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Link
              href={getLocalizedUrl('/', locale)}
              className="flex items-center space-x-3 mb-4"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-green-600 rounded-lg flex items-center justify-center">
                <span className="text-black font-bold text-sm">S</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-green-400 via-green-300 to-green-500 bg-clip-text text-transparent">
                STAKEADOS
              </span>
            </Link>
            <p className="text-gray-400 mb-6 max-w-sm">
              {t('home.hero.subtitle')}
            </p>

            {/* Social Links */}
            <div className="flex space-x-4">
              {socialLinks.map(social => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors text-xl"
                  aria-label={social.name}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Footer Links */}
          {footerSections.map(section => (
            <div key={section.title}>
              <h3 className="text-white font-semibold mb-4">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map(link => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors flex items-center group"
                    >
                      {link.label}
                      {link.href.startsWith('http') && (
                        <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          ↗
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter Signup */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="max-w-md">
            <h3 className="text-white font-semibold mb-2">Stay Updated</h3>
            <p className="text-gray-400 text-sm mb-4">
              Get the latest news and updates from the Web3 world.
            </p>
            <div className="flex">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-l-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-400"
              />
              <button className="stakeados-button-primary rounded-l-none rounded-r-lg">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-400 text-sm mb-4 md:mb-0">
            © {new Date().getFullYear()} Stakeados. All rights reserved.
          </div>

          <div className="flex items-center space-x-6 text-sm text-gray-400">
            <span>Built with ❤️ for the Web3 community</span>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span>Platform Online</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
