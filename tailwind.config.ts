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
        // Primary - Blue for all colored text
        primary: {
          50: '#f5f7ff',
          100: '#eff1ff',
          200: '#e1e7fe',
          300: '#727ef5',
          400: '#727ef5',
          500: '#727ef5',
          600: '#727ef5',
          700: '#727ef5',
          800: '#727ef5',
          900: '#727ef5',
          950: '#727ef5',
        },
        // Secondary - Also blue for consistency
        secondary: {
          50: '#f5f7ff',
          100: '#eff1ff',
          200: '#e1e7fe',
          300: '#727ef5',
          400: '#727ef5',
          500: '#727ef5',
          600: '#727ef5',
          700: '#727ef5',
          800: '#727ef5',
          900: '#727ef5',
          950: '#727ef5',
        },
        // Tertiary - Also blue for consistency
        tertiary: {
          50: '#f5f7ff',
          100: '#eff1ff',
          200: '#e1e7fe',
          300: '#727ef5',
          400: '#727ef5',
          500: '#727ef5',
          600: '#727ef5',
          700: '#727ef5',
          800: '#727ef5',
          900: '#727ef5',
          950: '#727ef5',
        },
        // Neutral greys for text on light backgrounds
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          850: '#1f1f1f',
          900: '#171717',
          950: '#000000',
        },
        // Dark backgrounds - grey base
        'dark-bg': '#282828',
        'dark-card': '#323232',
        'dark-elevated': '#3c3c3c',
        'dark-border': '#464646',
        'dark-hover': '#505050',
        // Category colors for hangouts - all using #727EF5
        category: {
          sports: '#727ef5',
          food: '#727ef5',
          shopping: '#727ef5',
          learning: '#727ef5',
          chill: '#727ef5',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'bounce-soft': 'bounceSoft 1s ease-in-out infinite',
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
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.3), 0 10px 20px -2px rgba(0, 0, 0, 0.2)',
        'soft-lg': '0 10px 40px -10px rgba(0, 0, 0, 0.4), 0 2px 10px -2px rgba(0, 0, 0, 0.2)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.2)',
        'glow': '0 0 20px rgba(114, 126, 245, 0.6)',
        'glow-purple': '0 0 20px rgba(114, 126, 245, 0.6)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-dark': 'linear-gradient(135deg, #282828 0%, #323232 50%, #3c3c3c 100%)',
        'gradient-primary': 'linear-gradient(135deg, #727ef5 0%, #727ef5 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #727ef5 0%, #727ef5 100%)',
        'mesh-dark': 'radial-gradient(at 40% 20%, rgba(114, 126, 245, 0.12) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(114, 126, 245, 0.08) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(114, 126, 245, 0.06) 0px, transparent 50%)',
      },
    },
  },
  plugins: [],
}

export default config
