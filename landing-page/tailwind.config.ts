import type { Config } from 'tailwindcss';

const palette = {
  brand: {
    DEFAULT: '#FE724C',
    yellow: '#FFC529',
    orange: '#FE724C',
    dark: '#272D2F',
    grey: '#D7D7D7',
    50: '#FFF4F0',
    100: '#FFE6DE',
    200: '#FFC529',
    300: '#FFB08F',
    400: '#FFC529',
    500: '#FE724C',
    600: '#FE724C',
    700: '#E55A35',
    800: '#272D2F',
    900: '#272D2F',
    950: '#272D2F',
  },
  emerald: {
    50: '#FFF8E7',
    100: '#FFEFB8',
    200: '#FFC529',
    300: '#FFC529',
    400: '#FFC529',
    500: '#FE724C',
    600: '#FE724C',
    700: '#E55A35',
    800: '#272D2F',
    900: '#272D2F',
    950: '#272D2F',
  },
  teal: {
    300: '#FFC529',
    400: '#FFC529',
    500: '#FE724C',
    600: '#FE724C',
    700: '#272D2F',
  },
  amber: {
    50: '#FFFBEB',
    100: '#FFF3C4',
    200: '#FFC529',
    300: '#FFC529',
    400: '#FFC529',
    500: '#FFC529',
    600: '#FE724C',
    700: '#272D2F',
    800: '#272D2F',
    900: '#272D2F',
  },
  slate: {
    50: '#F7F7F7',
    100: '#EFEFEF',
    200: '#D7D7D7',
    300: '#D7D7D7',
    400: '#8C9193',
    500: '#5C6265',
    600: '#3E4548',
    700: '#272D2F',
    800: '#272D2F',
    850: '#272D2F',
    900: '#272D2F',
    950: '#272D2F',
  },
  warm: {
    500: '#FE724C',
    600: '#E55A35',
  },
};

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-pinterest-sans)', 'pinterest-sans'],
        mono: ['var(--font-pinterest-sans)', 'pinterest-sans'],
      },
      colors: palette,
    },
  },
  plugins: [],
};

export default config;
