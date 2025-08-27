'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/utils/navigation';
import { Zap, Twitter, Github, Mail } from 'lucide-react';

export default function Footer() {
  const t = useTranslations();

  const footerLinks = {
    platform: [
      { href: '/courses', label: t('navigation.courses') },
      { href: '/community', label: t('navigation.community') },
      { href: '/news', label: t('navigation.news') },
      { href: '/genesis', label: t('navigation.genesis') },
    ],
    resources: [
      { href: '/docs', label: 'Documentation' },
      { href: '/api', label: 'API Reference' },
      { href: '/help', label: t('common.help') },
      { href: '/support', label: 'Support' },
    ],
    company: [
      { href: '/about', label: t('common.about') },
      { href: '/careers', label: 'Careers' },
      { href: '/blog', label: 'Blog' },
      { href: '/press', label: 'Press Kit' },
    ],
    legal: [
      { href: '/privacy', label: t('common.privacy') },
      { href: '/terms', label: t('common.terms') },
      { href: '/cookies', label: 'Cookie Policy' },
      { href: '/security', label: 'Security' },
    ],
  };

  const socialLinks = [
    { href: 'https://twitter.com/stakeados', icon: Twitter, label: 'Twitter' },
    { href: 'https://github.com/stakeados', icon: Github, label: 'GitHub' },
    { href: 'mailto:hello@stakeados.com', icon: Mail, label: 'Email' },
  ];

  return (
    <footer className="bg-stakeados-gray-900 border-t border-stakeados-gray-700">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-8">
            {/* Brand Section */}
            <div className="lg:col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-4 group">
                <div className="w-8 h-8 bg-gradient-to-r from-stakeados-primary to-stakeados-primary-light rounded-gaming flex items-center justify-center group-hover:shadow-glow transition-all">
                  <Zap className="w-5 h-5 text-stakeados-dark" />
                </div>
                <span className="text-xl font-bold text-neon">Stakeados</span>
              </Link>

              <p className="text-stakeados-gray-300 mb-6 leading-relaxed">
                The premier Web3 educational platform combining blockchain
                education with NFT certifications on Base network.
              </p>

              {/* Social Links */}
              <div className="flex items-center gap-4">
                {socialLinks.map(social => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-stakeados-gray-400 hover:text-stakeados-primary hover:bg-stakeados-primary/10 rounded-gaming transition-colors"
                    aria-label={social.label}
                  >
                    <social.icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>

            {/* Platform Links */}
            <div>
              <h3 className="font-semibold text-white mb-4">Platform</h3>
              <ul className="space-y-3">
                {footerLinks.platform.map(link => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-stakeados-gray-400 hover:text-stakeados-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources Links */}
            <div>
              <h3 className="font-semibold text-white mb-4">Resources</h3>
              <ul className="space-y-3">
                {footerLinks.resources.map(link => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-stakeados-gray-400 hover:text-stakeados-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h3 className="font-semibold text-white mb-4">Company</h3>
              <ul className="space-y-3">
                {footerLinks.company.map(link => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-stakeados-gray-400 hover:text-stakeados-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h3 className="font-semibold text-white mb-4">Legal</h3>
              <ul className="space-y-3">
                {footerLinks.legal.map(link => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-stakeados-gray-400 hover:text-stakeados-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Newsletter Signup */}
          <div className="border-t border-stakeados-gray-700 pt-8 mb-8">
            <div className="max-w-md">
              <h3 className="font-semibold text-white mb-2">Stay Updated</h3>
              <p className="text-stakeados-gray-400 text-sm mb-4">
                Get the latest Web3 education updates and exclusive content.
              </p>
              <div className="flex gap-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 bg-stakeados-gray-800 border border-stakeados-gray-600 text-white rounded-gaming px-4 py-2 text-sm focus:border-stakeados-primary focus:ring-2 focus:ring-stakeados-primary/20 transition-all"
                />
                <button className="btn-primary text-sm px-4 py-2">
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-stakeados-gray-700 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-stakeados-gray-400 text-sm">
                © 2025 Stakeados. All rights reserved.
              </div>

              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-stakeados-primary rounded-full animate-pulse" />
                  <span className="text-stakeados-gray-400">
                    Built on Base Network
                  </span>
                </div>

                <div className="text-stakeados-gray-500">
                  Made with ❤️ for the Web3 community
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
