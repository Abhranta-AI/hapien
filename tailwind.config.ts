import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary - Amber (Warmth & Joy)
        amber: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        // Secondary - Sage (Safety & Trust)
        sage: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
          900: '#14532D',
        },
        // Tertiary - Rose (Intimacy & Connection)
        rose: {
          50: '#FFF1F2',
          100: '#FFE4E6',
          200: '#FECDD3',
          300: '#FDA4AF',
          400: '#FB7185',
          500: '#F43F5E',
          600: '#E11D48',
          700: '#BE123C',
          800: '#9F1239',
          900: '#881337',
        },
        // Neutral - Warm Stone (Grounding)
        stone: {
          50: '#FAFAF9',
          100: '#F5F5F4',
          200: '#E7E5E4',
          300: '#D6D3D1',
          400: '#A8A29E',
          500: '#78716C',
          600: '#57534E',
          700: '#44403C',
          800: '#292524',
          900: '#1C1917',
          950: '#0C0A09',
        },
        // Premium Accent - Gold
        gold: {
          light: '#F5E6D3',
          DEFAULT: '#D4A574',
          dark: '#B8956A',
        },
        // Legacy support - map old colors to new
        primary: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
          950: '#78350F',
        },
        secondary: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
          900: '#14532D',
          950: '#14532D',
        },
        tertiary: {
          50: '#FFF1F2',
          100: '#FFE4E6',
          200: '#FECDD3',
          300: '#FDA4AF',
          400: '#FB7185',
          500: '#F43F5E',
          600: '#E11D48',
          700: '#BE123C',
          800: '#9F1239',
          900: '#881337',
          950: '#881337',
        },
        // Keep neutral for backwards compatibility
        neutral: {
          50: '#FAFAF9',
          100: '#F5F5F4',
          200: '#E7E5E4',
          300: '#D6D3D1',
          400: '#A8A29E',
          500: '#78716C',
          600: '#57534E',
          700: '#44403C',
          800: '#292524',
          850: '#1C1917',
          900: '#1C1917',
          950: '#0C0A09',
        },
        // Category colors for hangouts - warm palette
        category: {
          sports: '#F59E0B',    // amber
          food: '#F43F5E',      // rose
          shopping: '#D4A574',  // gold
          learning: '#22C55E',  // sage
          chill: '#FBBF24',     // amber-400
          coffee: '#B45309',    // amber-700
          walk: '#86EFAC',      // sage-300
          hobby: '#FDA4AF',     // rose-300
        },
        // Connection strength colors
        connection: {
          new: '#D6D3D1',       // stone-300
          growing: '#FCD34D',   // amber-300
          strong: '#F59E0B',    // amber-500
          deep: '#F43F5E',      // rose-500
          kindred: '#E11D48',   // rose-600
        },
        // Dark mode colors
        dark: {
          bg: '#1C1917',        // stone-900
          card: '#292524',      // stone-800
          surface: '#292524',   // stone-800
          elevated: '#44403C',  // stone-700
          hover: '#44403C',     // stone-700
          border: '#57534E',    // stone-600
        },
        // Text colors for dark mode
        text: {
          primary: '#FAFAF9',   // stone-50
          secondary: '#D6D3D1', // stone-300
          muted: '#A8A29E',     // stone-400
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
        body: ['Plus Jakarta Sans', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        // Display sizes
        'display-xl': ['3.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-lg': ['2.75rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        'display-md': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        // Heading sizes
        'heading-lg': ['1.75rem', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
        'heading-md': ['1.5rem', { lineHeight: '1.35', letterSpacing: '-0.01em' }],
        'heading-sm': ['1.25rem', { lineHeight: '1.4' }],
        // Body sizes
        'body-lg': ['1.125rem', { lineHeight: '1.6' }],
        'body-md': ['1rem', { lineHeight: '1.6' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5' }],
        // Caption sizes
        'caption': ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.02em' }],
        'overline': ['0.625rem', { lineHeight: '1.4', letterSpacing: '0.1em' }],
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      animation: {
        // Existing animations
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'bounce-soft': 'bounceSoft 1s ease-in-out infinite',
        // New living animations
        'breathe': 'breathe 4s ease-in-out infinite',
        'breathe-slow': 'breathe 6s ease-in-out infinite',
        'warm-glow': 'warmGlow 3s ease-in-out infinite',
        'soft-bounce': 'softBounce 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
        'gentle-float': 'gentleFloat 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        // New living keyframes
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.02)', opacity: '0.95' },
        },
        warmGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(251, 191, 36, 0)' },
          '50%': { boxShadow: '0 0 20px 10px rgba(251, 191, 36, 0.15)' },
        },
        softBounce: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '60%': { transform: 'scale(1.02)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        gentleFloat: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      boxShadow: {
        // Soft shadows for premium feel
        'soft-sm': '0 2px 8px -2px rgba(28, 25, 23, 0.08)',
        'soft-md': '0 4px 16px -4px rgba(28, 25, 23, 0.1)',
        'soft-lg': '0 8px 32px -8px rgba(28, 25, 23, 0.12)',
        'soft-xl': '0 16px 48px -12px rgba(28, 25, 23, 0.15)',
        // Intimate glow for connection moments
        'intimate': '0 4px 20px -4px rgba(244, 63, 94, 0.15)',
        'intimate-lg': '0 8px 30px -4px rgba(244, 63, 94, 0.2)',
        // Warm glow for active states
        'warm': '0 4px 20px -4px rgba(251, 191, 36, 0.2)',
        'warm-lg': '0 8px 30px -4px rgba(251, 191, 36, 0.25)',
        // Safe glow for trust indicators
        'safe': '0 4px 20px -4px rgba(34, 197, 94, 0.15)',
        // Premium shadow
        'premium': '0 1px 2px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.04), 0 16px 32px rgba(0,0,0,0.04)',
        // Inner shadows
        'inner-soft': 'inset 0 2px 4px 0 rgba(28, 25, 23, 0.05)',
        // Legacy support
        'soft': '0 4px 16px -4px rgba(28, 25, 23, 0.1)',
        'glow': '0 0 20px rgba(251, 191, 36, 0.3)',
        'glow-purple': '0 0 20px rgba(244, 63, 94, 0.3)',
      },
      backgroundImage: {
        // Gradient utilities
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        // Warm gradients for light mode
        'gradient-warm': 'linear-gradient(135deg, #FFFBEB 0%, #FFF1F2 50%, #F0FDF4 100%)',
        'gradient-amber-rose': 'linear-gradient(135deg, #FEF3C7 0%, #FFE4E6 100%)',
        'gradient-hero': 'linear-gradient(180deg, #FEF3C7 0%, #FAFAF9 100%)',
        // Card gradients
        'gradient-intimate': 'linear-gradient(135deg, #FFF1F2 0%, #FFFFFF 100%)',
        'gradient-safe': 'linear-gradient(135deg, #F0FDF4 0%, #FFFFFF 100%)',
        'gradient-premium': 'linear-gradient(135deg, #F5F5F4 0%, #FFFFFF 100%)',
        // Dark mode gradients (optional)
        'gradient-dark': 'linear-gradient(135deg, #1C1917 0%, #292524 100%)',
        'gradient-dark-warm': 'linear-gradient(135deg, #292524 0%, #44403C 100%)',
        // Mesh backgrounds
        'mesh-warm': 'radial-gradient(at 40% 20%, rgba(254, 243, 199, 0.4) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(255, 228, 230, 0.3) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(220, 252, 231, 0.2) 0px, transparent 50%)',
        'mesh-dark': 'radial-gradient(at 40% 20%, rgba(69, 48, 15, 0.2) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(136, 19, 55, 0.15) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(20, 83, 45, 0.1) 0px, transparent 50%)',
        // Shimmer gradient
        'shimmer': 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
      },
      spacing: {
        // Premium spacing
        '18': '4.5rem',
        '22': '5.5rem',
      },
      transitionTimingFunction: {
        'soft-out': 'cubic-bezier(0.23, 1, 0.32, 1)',
        'soft-in': 'cubic-bezier(0.68, 0, 0.27, 0.5)',
        'gentle': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'organic': 'cubic-bezier(0.22, 1, 0.36, 1)',
        'breathe': 'cubic-bezier(0.45, 0, 0.55, 1)',
      },
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
      },
    },
  },
  plugins: [],
}

export default config
