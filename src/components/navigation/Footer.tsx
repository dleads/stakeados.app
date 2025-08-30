'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Twitter, Github, Mail } from 'lucide-react';
import { useTranslation, getLocalizedUrl } from '@/lib/i18n';
import { useNavigation } from './NavigationProvider';
import type { Locale } from '@/types/content';

export interface FooterProps {
  locale?: Locale;
}

export default function Footer({ locale: propLocale }: FooterProps) {
  const { currentPath } = useNavigation();
  
  // Extract locale from current path or use prop
  const locale = propLocale || (currentPath.split('/')[1] as Locale) || 'es';
  const { t } = useTranslation(locale);
  

  const socialLinks = [
    { name: 'Twitter', href: 'https://twitter.com/stakeados', icon: Twitter },
    { name: 'GitHub', href: 'https://github.com/stakeados', icon: Github },
    { name: 'Email', href: 'mailto:hello@stakeados.com', icon: Mail },
  ];

  return (
    <footer className="bg-black border-t border-green-500/20">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content - single row: logo | text | socials */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10 items-center">
          {/* Brand (Logo) */}
          <div className="lg:col-span-1">
            <Link
              href={getLocalizedUrl('/', locale)}
              className="flex items-center space-x-3 mb-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400 rounded-md"
              aria-label="Stakeados Home"
            >
              <Image
                src="https://res.cloudinary.com/dvmtkwrme/image/upload/v1756440936/logo_2_yrsudy.svg"
                alt="Stakeados logo"
                width={64}
                height={64}
                priority
                sizes="(min-width: 1024px) 56px, (min-width: 768px) 48px, 40px"
                className="h-10 w-auto md:h-12 lg:h-14 drop-shadow-[0_0_6px_rgba(0,0,0,0.35)]"
              />
              <span className="sr-only">Stakeados</span>
            </Link>
            {/* Empty below logo to keep alignment */}
          </div>

          {/* Middle text */}
          <div className="lg:col-span-1 flex items-center justify-center">
            <p className="text-gray-400 leading-relaxed text-center max-w-xl">
              {t('home.hero.subtitle')}
            </p>
          </div>

          {/* Socials (right) */}
          <div className="lg:col-span-1 flex items-center justify-center lg:justify-end">
            <div className="flex space-x-4">
              {socialLinks.map(social => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                  aria-label={social.name}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-400 text-sm mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} Stakeados. All rights reserved.
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
