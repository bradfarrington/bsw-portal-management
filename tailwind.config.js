/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#E5040A',
          50: '#FFF1F2',
          100: '#FFE0E1',
          500: '#E5040A',
          600: '#C70309',
          700: '#A80207',
        },
        bg: '#F9F9FB',
        ink: '#111827',
        muted: '#6B7280',
        line: '#E0E0E0',
        soft: '#F0F0F0',
      },
      borderRadius: {
        card: '24px',
      },
      boxShadow: {
        card: '0 10px 20px rgba(0,0,0,0.05)',
        phone: '0 30px 60px rgba(0,0,0,0.18)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
