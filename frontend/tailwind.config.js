/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './hooks/**/*.{js,jsx,ts,tsx}',
    './constants/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Add custom colors here if needed
        primary: {
          50: '#E6F4FE',
          100: '#CCE9FD',
          200: '#99D3FB',
          300: '#66BDF9',
          400: '#33A7F7',
          500: '#0091F5',
          600: '#0074C4',
          700: '#005793',
          800: '#003A62',
          900: '#001D31',
        },
      },
      fontFamily: {
        // Add custom fonts here if needed
      },
    },
  },
  plugins: [],
};

