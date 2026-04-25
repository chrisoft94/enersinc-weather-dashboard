/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#007BFF',
          sky: '#87CEFA',
          gray: '#808080',
        },
        surface: {
          bg: '#F8F9FA',
          card: '#FFFFFF',
          border: '#E2E8F0',
        },
        telemetry: {
          ok: '#10B981',
          warning: '#F59E0B',
          critical: '#EF4444',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'gradient-infinity': 'linear-gradient(135deg, #007BFF 0%, #87CEFA 100%)',
      }
    },
  },
  plugins: [],
}
