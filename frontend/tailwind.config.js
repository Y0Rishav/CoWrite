/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sketch: ['Cabin Sketch', 'cursive'],
        handlee: ['Handlee', 'cursive'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        dark: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        warm: {
          50: '#fef3c7',
          100: '#fef08a',
          200: '#fde047',
        },
      },
      boxShadow: {
        sketchy: '4px 4px 0px rgba(0, 0, 0, 0.1), 2px 2px 0px rgba(234, 88, 12, 0.15)',
        'sketchy-lg': '6px 6px 0px rgba(0, 0, 0, 0.1), 3px 3px 0px rgba(234, 88, 12, 0.12)',
        'sketchy-hover': '8px 8px 0px rgba(0, 0, 0, 0.2), 4px 4px 0px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
}
