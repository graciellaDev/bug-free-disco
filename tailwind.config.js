const animate = require('tailwindcss-animate');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  safelist: ['dark'],
  prefix: '',

  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        xl: '1239px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        // custom colors
        space: '#2f353d',
        zumthor: '#e8f1ff',
        dodger: '#5898ff',
        hoverbtn: 'rgba(255, 255, 255, 0.1)',
        borderAvatar: 'rgba(0, 82, 208, 0.3)',
        athens: '#edeff5',
        'athens-gray': '#f4f6f8',
        'slate-custom': '#79869a',
        'red-custom': '#f50a0a',
        gallery: '#f0f0f0',
        bali: '#9098b4',
        violet: '#8d47ff',
        feta: '#e4fde4',
        orange: '#ff6b00',
        serenade: '#fff0e5',
        'border-editor': 'rgba(0, 82, 208, 0.2)',
        green: '#04b600',
        cinderella: '#fdcece',
        pink: '#ffeaea',
        catskill: '#f9fafc',
        chilean: '#fffce4',
        semired: '#f50a0a33',
        'border-feta': 'rgba(4, 182, 0, 0.1)',
        'science-opacity': 'rgba(0, 82, 208, 0.2)',
        pattens: '#d2e3ff',
        malachite: '#1bd741',
        picton: '#41b4e6',
        royal: '#7d3daf',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
          border: 'hsl(var(--destructive-border))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        xl: 'calc(var(--radius) + 4px)',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        three: '3px',
        plus: '5px',
        seven: '7px',
        ten: '10px',
        fifteen: '15px',
        sixteen: '16px',
        twentyfive: '25px',
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
        'collapsible-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-collapsible-content-height)' },
        },
        'collapsible-up': {
          from: { height: 'var(--radix-collapsible-content-height)' },
          to: { height: 0 },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'collapsible-down': 'collapsible-down 0.2s ease-in-out',
        'collapsible-up': 'collapsible-up 0.2s ease-in-out',
      },
      spacing: {
        '1px': '1px',
        '5px': '5px',
        '6px': '6px',
        '7px': '7px',
        '8px': '8px',
        '9px': '9px',
        '10.5px': '10.5px',
        '11px': '11px',
        '11.5px': '11.5px',
        '12.5px': '12.5px',
        '13px': '13px',
        '15px': '15px',
        '16px': '16px',
        '17px': '17px',
        '18px': '18px',
        '19px': '19px',
        '20px': '20px',
        '22px': '22px',
        '23px': '23px',
        '25px': '25px',
        '26px': '26px',
        '27px': '27px',
        '30px': '30px',
        '35px': '35px',
        '38px': '38px',
        '45px': '45px',
        '50px': '50px',
        '60px': '60px',
        '70px': '70px',
        '75px': '75px',
        '128px': '32rem',
        '275px': '275px',
        '300px': '300px',
        border: 'hsl(var(--destructive-border))',
        '330px': '330px',
        '400px': '400px',
      },
      maxWidth: {
        '2xl': '100rem',
        'card-width': '235.8px',
      },
      fontSize: {
        '13px': '13px',
        '15px': '15px',
        '18px': '18px',
        '20px': '20px',
        '25px': '25px',
      },
      padding: {
        btn: '11.5px 15.5px',
        'semi-btn': '11.5px 20px',
        'border-btn': '10.5px 15.5px',
        'border-semi-btn': '10.5px 20px',
        'padding-gray': '10px 20px',
        '3px': '3px',
        '4.5px': '4.5px',
        '10px': '10px',
      },
      lineHeight: {
        normal: 'normal',
        125: '125%',
        130: '130%',
        150: '150%',
      },
      boxShadow: {
        'shadow-cards': '0 0 15px 0 rgba(0, 0, 0, 0.05);',
        'shadow-droplist': '0 0 15px 0 rgba(0, 0, 0, 0.15)',
        'shadow-combolist': '0 10px 15px 0 rgba(0, 0, 0, 0.15)',
      },
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            '--tw-prose-bullets': theme('colors.slate-custom'),
            ul: {
              'padding-left': '25px',
              'margin-bottom': '22px',
            },
            li: {
              margin: '0px',
              p: {
                margin: '0px',
                color: theme('colors.space'),
              },
            },
            h4: {
              'margin-top': '0px',
              'font-size': '15px',
              'font-weight': '500',
              color: theme('colors.space'),
              'margin-bottom': '7px',
            },
          },
        },
      }),
      keyframes: {
        'dot-up': {
          '0%': {
            transform: 'translateY(20px)',
          },
          '50%': {
            transform: 'translateY(-20px)',
          },
          '100%': {
            transform: 'translateY(20px)',
          },
        },
        'dot-down': {
          '0%': {
            transform: 'translateY(-20px)',
          },
          '50%': {
            transform: 'translateY(20px)',
          },
          '100%': {
            transform: 'translateY(-20px)',
          },
        },
      },
      animation: {
        'dot-up': 'dot-up 1s ease-in-out infinite',
        'dot-down': 'dot-down 1s ease-in-out infinite',
      },
    },
  },
  plugins: [animate, require('@tailwindcss/typography')],
};
