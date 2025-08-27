/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: ['bg-stakeados-gray-800'],
  theme: {
    extend: {
      // Stakeados Brand Colors
      colors: {
        // Primary Neon Green
        'stakeados-primary': '#00FF88',
        'stakeados-primary-dark': '#00CC6A',
        'stakeados-primary-light': '#33FF99',

        // Gaming/Futuristic Dark Palette
        'stakeados-dark': '#0A0A0A',
        'stakeados-gray': {
          900: '#111111',
          800: '#1A1A1A',
          700: '#2A2A2A',
          600: '#3A3A3A',
          500: '#5A5A5A',
          400: '#7A7A7A',
          300: '#9A9A9A',
          200: '#BABABA',
          100: '#DADADA',
        },

        // Accent Colors
        'stakeados-blue': '#00AAFF',
        'stakeados-purple': '#AA00FF',
        'stakeados-orange': '#FF6600',
        'stakeados-red': '#FF3366',
        'stakeados-yellow': '#FFCC00',
      },

      // Custom spacing for 8px system
      spacing: {
        18: '4.5rem',
        88: '22rem',
      },

      // Gaming-inspired typography
      fontFamily: {
        gaming: ['Inter', 'system-ui', 'sans-serif'],
      },

      // Custom animations
      animation: {
        glow: 'glow 2s ease-in-out infinite alternate',
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        float: 'float 3s ease-in-out infinite',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'progress-bar': 'progress-bar 5s linear',
      },

      keyframes: {
        glow: {
          '0%': {
            boxShadow: '0 0 20px rgba(0, 255, 136, 0.3)',
            transform: 'scale(1)',
          },
          '100%': {
            boxShadow: '0 0 30px rgba(0, 255, 136, 0.6)',
            transform: 'scale(1.02)',
          },
        },
        'pulse-glow': {
          '0%, 100%': {
            boxShadow: '0 0 20px rgba(0, 255, 136, 0.4)',
          },
          '50%': {
            boxShadow: '0 0 40px rgba(0, 255, 136, 0.8)',
          },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'progress-bar': {
          '0%': { width: '100%' },
          '100%': { width: '0%' },
        },
      },

      // Custom gradients
      backgroundImage: {
        'gradient-gaming':
          'linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 50%, #0A0A0A 100%)',
        'gradient-neon': 'linear-gradient(135deg, #00FF88 0%, #00CC6A 100%)',
        'gradient-card':
          'linear-gradient(135deg, rgba(26, 26, 26, 0.8) 0%, rgba(42, 42, 42, 0.6) 100%)',
      },

      // Custom box shadows for glow effects
      boxShadow: {
        'glow-sm': '0 0 10px rgba(0, 255, 136, 0.3)',
        glow: '0 0 20px rgba(0, 255, 136, 0.4)',
        'glow-lg': '0 0 30px rgba(0, 255, 136, 0.6)',
        'glow-xl': '0 0 40px rgba(0, 255, 136, 0.8)',
        'inner-glow': 'inset 0 0 20px rgba(0, 255, 136, 0.2)',
      },

      // Custom border radius for gaming aesthetics
      borderRadius: {
        gaming: '0.5rem',
        'gaming-lg': '1rem',
      },

      // Responsive breakpoints (mobile-first)
      screens: {
        xs: '475px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    // Custom plugin for gaming utilities
    function ({ addUtilities, theme }) {
      const newUtilities = {
        // Glow text utilities
        '.text-glow': {
          textShadow: '0 0 10px rgba(0, 255, 136, 0.8)',
        },
        '.text-glow-strong': {
          textShadow: '0 0 20px rgba(0, 255, 136, 1)',
        },

        // Gaming border utilities
        '.border-glow': {
          borderColor: theme('colors.stakeados-primary'),
          boxShadow: '0 0 10px rgba(0, 255, 136, 0.3)',
        },

        // Backdrop blur for gaming cards
        '.backdrop-gaming': {
          backdropFilter: 'blur(10px) saturate(180%)',
          backgroundColor: 'rgba(26, 26, 26, 0.8)',
        },

        // Neon button utilities
        '.btn-neon': {
          background: 'linear-gradient(135deg, #00FF88 0%, #00CC6A 100%)',
          color: '#0A0A0A',
          fontWeight: '600',
          padding: '0.75rem 1.5rem',
          borderRadius: '0.5rem',
          border: 'none',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          boxShadow: '0 0 20px rgba(0, 255, 136, 0.4)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 0 30px rgba(0, 255, 136, 0.6)',
          },
        },

        // Gaming card utilities
        '.card-gaming': {
          background:
            'linear-gradient(135deg, rgba(26, 26, 26, 0.8) 0%, rgba(42, 42, 42, 0.6) 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(0, 255, 136, 0.2)',
          borderRadius: '1rem',
          padding: '1.5rem',
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: 'rgba(0, 255, 136, 0.4)',
            boxShadow: '0 0 20px rgba(0, 255, 136, 0.2)',
          },
        },

        // Gaming card background
        '.bg-gaming-card': {
          background:
            'linear-gradient(135deg, rgba(26, 26, 26, 0.9) 0%, rgba(42, 42, 42, 0.7) 100%)',
          backdropFilter: 'blur(10px)',
        },

        // Rounded gaming border
        '.rounded-gaming': {
          borderRadius: '0.5rem',
        },
      };

      addUtilities(newUtilities);
    },
  ],
};
