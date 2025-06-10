/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  safelist: ['font-regular'],
  theme: {
    extend: {
      colors: {
        dark: '#001312',
        light: '#f5f5f5',
        // 'teal-50': '#f0fdfa',
        // 'teal-100': '#ccfbf1',
        // 'teal-200': '#99f6e4',
        // 'teal-300': '#5eead4',
        // 'teal-400': '#2dd4bf',
        // 'teal-500': '#14b8a6',
        // 'teal-600': '#0d9488',
        // 'teal-700': '#0f766e',
        // 'teal-800': '#115e59',
        // 'teal-900': '#134e4a',
        // 'teal-950': '#042f2e',
      },
      fontSize: {
        xxs: '0.625rem', // 10px
        inherit: 'inherit',
      },
      fontFamily: {
        body: [
          // 'purna_shrestha',
          // 'Syne',
          '"Bricolage Grotesque"',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],
      },
      fontWeight: {
        regular: 400,
      },
      textShadow: {
        dark: '0px 0px 2px rgba(0, 0, 0, 1)',
        light: '0px 0px 2px rgba(255, 255, 255, 1)',
        red: '2px 2px 4px rgba(255, 0, 0, 0.5)',
        'light-glow':
          '1px 1px 2px #F8F8FF,  0 0 1em #F8F8FF, 0 0 0.2em #F8F8FF',
        'dark-glow': '1px 1px 2px #000111,  0 0 1em #000111, 0 0 0.2em #000111',
      },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1600px',
        '3xl': '1920px',
      },
      container: {
        center: true,
        padding: '1rem',
        screens: {
          sm: '100%',
          md: '100%',
          lg: '1024px',
          xl: '1280px',
          '2xl': '1600px',
        },
      },
      keyframes: {
        floating: {
          '0%': { transform: 'translateX(0)' },
          '50%': { transform: 'translateX(-20px)' },
          '100%': { transform: 'translateX(0)' },
        },
        floatingY: {
          '0%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
          '100%': { transform: 'translateY(0)' },
        },
        'move-left-right': {
          '0%': { transform: 'translateX(-50%)' },
          '50%': { transform: 'translateX(50%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        glitter: {
          '0%, 100%': { opacity: 0 },
          '50%': { opacity: 1, transform: 'scale(1.2)' },
        },
        slide: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        wave: {
          '0%': { transform: 'rotate(0deg)' },
          '10%': { transform: 'rotate(14deg)' },
          '20%': { transform: 'rotate(-8deg)' },
          '30%': { transform: 'rotate(14deg)' },
          '40%': { transform: 'rotate(-4deg)' },
          '50%': { transform: 'rotate(10deg)' },
          '60%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
      },
      animation: {
        floating: 'floating 3s ease-in-out infinite',
        'floating-up': 'floatingY 3s ease-in-out infinite',
        'custom-pulse': 'pulse 2s infinite, move-left-right 5s infinite linear',
        glitter: 'glitter 1.5s infinite ease-in-out',
        slide: 'slide 2s linear infinite',
        wave: 'wave 2.5s infinite',
      },
    },
  },
  plugins: [require('tailwindcss-textshadow')],
};
