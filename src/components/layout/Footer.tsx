'use client';

import React from 'react';
import { Link } from '@/lib/utils/navigation';
import Image from 'next/image';
import { Twitter, Github, Mail } from 'lucide-react';

export default function Footer() {

  const socialLinks = [
    { href: 'https://twitter.com/stakeados', icon: Twitter, label: 'Twitter' },
    { href: 'https://github.com/stakeados', icon: Github, label: 'GitHub' },
    { href: 'mailto:hello@stakeados.com', icon: Mail, label: 'Email' },
  ];

  return (
    <footer className="bg-stakeados-gray-900 border-t border-stakeados-gray-700">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Main Footer Content - single row: logo | text | socials */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10 mb-10 items-center">
            {/* Brand (Logo) */}
            <div className="lg:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4 group focus:outline-none focus-visible:ring-2 focus-visible:ring-stakeados-primary rounded-md" aria-label="Stakeados Home">
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

              {/* Empty below logo on purpose to keep grid alignment */}
            </div>

            {/* Middle text */}
            <div className="lg:col-span-1 flex items-center justify-center">
              <p className="text-stakeados-gray-300 leading-relaxed text-center max-w-xl">
                Plataforma de aprendizaje descentralizada para educación Web3. Descubre artículos,
                noticias y cursos sobre tecnología blockchain.
              </p>
            </div>

            {/* Socials (right) */}
            <div className="lg:col-span-1 flex items-center justify-center lg:justify-end">
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
