/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'primary-bg': '#0a0e1a',
        'card-bg': '#1e2535',
        'card-hover': '#252d40',
        'primary-blue': '#3b82f6',
        'primary-blue-hover': '#2563eb',
        'border-color': '#2d3748',
        'text-primary': '#f7fafc',
        'text-secondary': '#a0aec0',
        'success': '#10b981',
        'danger': '#ef4444',
        'warning': '#f59e0b',
      },
    },
  },
  plugins: [],
}
