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
        // Primary - Grayscale (Black & White theme)
        violet: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0A0A0A',
        },
        // Secondary - Magenta/Pink
        magenta: {
          50: '#0A0A0A',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0A0A0A',
        },
        // Accent - Periwinkle/Lavender
        periwinkle: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0A0A0A',
        },
        // Neutral - Deep Navy/Purple
        stone: {
          50: '#0A0A0A',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0A0A0A',
        },
        // Premium Accent - Electric
        gold: {
          light: '#D4D4D4',
          DEFAULT: '#A3A3A3',
          dark: '#737373',
        },
        // Legacy support - map to new purple palette
        primary: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0A0A0A',
        },
        secondary: {
          50: '#0A0A0A',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0A0A0A',
        },
        tertiary: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0A0A0A',
        },
        // Keep neutral for backwards compatibility
        neutral: {
          50: '#0A0A0A',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          850: '#171717',
          900: '#171717',
          950: '#0A0A0A',
        },
        // Category colors - Euphoria palette
        category: {
          sports: '#A3A3A3',    // periwinkle
          food: '#525252',      // magenta
          shopping: '#A3A3A3',  // light magenta
          learning: '#737373',  // violet
          chill: '#A3A3A3',     // light violet
          coffee: '#404040',    // deep purple
          walk: '#D4D4D4',      // lavender
          hobby: '#D4D4D4',     // pink
        },
        // Connection strength colors
        connection: {
          new: '#A3A3A3',       // muted purple
          growing: '#A3A3A3',   // violet-400
          strong: '#737373',    // violet-500
          deep: '#525252',      // magenta
          kindred: '#A3A3A3',   // bright magenta
        },
        // Dark mode colors
        dark: {
          bg: '#171717',        // deep navy
          card: '#262626',      // dark purple
          surface: '#262626',   // dark purple
          elevated: '#404040',  // medium purple
          hover: '#404040',     // medium purple
          border: '#525252',    // muted purple
        },
        // Text colors for dark mode
        text: {
          primary: '#0A0A0A',   // almost white with purple tint
          secondary: '#D4D4D4', // light purple
          muted: '#A3A3A3',     // muted purple
        },
        // Sage replacement for success states
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
        // Rose for error/warning states
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
        // Amber for warnings
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
        // Soft shadows - purple tinted
        'soft-sm': '0 2px 8px -2px rgba(1, 0, 64, 0.3)',
        'soft-md': '0 4px 16px -4px rgba(1, 0, 64, 0.4)',
        'soft-lg': '0 8px 32px -8px rgba(1, 0, 64, 0.5)',
        'soft-xl': '0 16px 48px -12px rgba(1, 0, 64, 0.6)',
        // Intimate glow - magenta
        'intimate': '0 4px 20px -4px rgba(170, 49, 172, 0.3)',
        'intimate-lg': '0 8px 30px -4px rgba(170, 49, 172, 0.4)',
        // Warm glow - violet for active states
        'warm': '0 4px 20px -4px rgba(139, 92, 246, 0.3)',
        'warm-lg': '0 8px 30px -4px rgba(139, 92, 246, 0.4)',
        // Safe glow
        'safe': '0 4px 20px -4px rgba(34, 197, 94, 0.2)',
        // Premium shadow - purple glow
        'premium': '0 1px 2px rgba(1,0,64,0.1), 0 4px 8px rgba(63,21,122,0.15), 0 16px 32px rgba(110,50,162,0.2)',
        // Inner shadows
        'inner-soft': 'inset 0 2px 4px 0 rgba(1, 0, 64, 0.2)',
        // Legacy support
        'soft': '0 4px 16px -4px rgba(1, 0, 64, 0.4)',
        'glow': '0 0 20px rgba(139, 92, 246, 0.4)',
        'glow-purple': '0 0 20px rgba(170, 49, 172, 0.4)',
      },
      backgroundImage: {
        // Gradient utilities
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        // Warm gradients for light mode
        'gradient-warm': 'linear-gradient(135deg, #FFFBEB 0%, #FFF1F2 50%, #F0FDF4 100%)',
        'gradient-amber-rose': 'linear-gradient(135deg, #FEF3C7 0%, #FFE4E6 100%)',
        'gradient-hero': 'linear-gradient(180deg, #FEF3C7 0%, #FAFAF9 100%)',
        // Card gradients (Euphoria purple)
        'gradient-intimate': 'linear-gradient(135deg, #1A1833 0%, #010040 100%)',
        'gradient-safe': 'linear-gradient(135deg, #1A1833 0%, #010040 100%)',
        'gradient-premium': 'linear-gradient(135deg, #2D2A4D 0%, #1A1833 100%)',
        // Dark mode gradients
        'gradient-dark': 'linear-gradient(135deg, #010040 0%, #1A1833 100%)',
        'gradient-dark-warm': 'linear-gradient(135deg, #1A1833 0%, #2D2A4D 100%)',
        // Mesh backgrounds - Euphoria style
        'mesh-warm': 'radial-gradient(at 40% 20%, rgba(139, 92, 246, 0.15) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(170, 49, 172, 0.12) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(114, 126, 245, 0.1) 0px, transparent 50%)',
        'mesh-dark': 'radial-gradient(at 40% 20%, rgba(63, 21, 122, 0.25) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(110, 50, 162, 0.2) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(114, 126, 245, 0.15) 0px, transparent 50%)',
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
