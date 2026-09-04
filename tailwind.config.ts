
import type { Config } from "tailwindcss";
import flattenColorPalette from "tailwindcss/lib/util/flattenColorPalette";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: '#7516E2',
					foreground: '#ffffff'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				// Colores personalizados para Conciertos Latam
				brand: {
					blue: '#7516E2',
					white: '#ffffff'
				},
				// Manual de Marca v2.0 — la noche en vivo (morado → violeta → fucsia → naranja)
				noche: '#070D1F',
				superficie: {
					DEFAULT: '#0E1830',
					2: '#131F3D'
				},
				morado: '#7516E2',
				violeta: '#AB0DC4',
				fucsia: '#E70485',
				naranja: '#FE670C',
				texto: {
					DEFAULT: '#FFFFFF',
					2: '#94A0BD'
				},
				linea: 'rgba(231,4,133,.2)',
				// Deprecated: alias de la identidad anterior, re-apuntados a la paleta v2.0.
				// Migrar a morado/fucsia/naranja al tocar cada archivo.
				cobalto: '#7516E2',
				periwinkle: '#E70485',
				'azul-claro': '#94A0BD',
				verde: '#FE670C'
			},
			fontFamily: {
				// Evolución Nocturna: Fira Sans es la fuente de UI y cuerpo del manual
				'sans': ['"Fira Sans"', 'system-ui', 'sans-serif'],
				'display': ['"Big Shoulders Display"', '"Fira Sans"', 'system-ui', 'sans-serif'],
				'fira': ['"Fira Sans"', 'system-ui', 'sans-serif'],
				// Legacy aliases: kept to avoid breaking older code; resolven a Fira Sans
				'spotify': ['"Fira Sans"', 'system-ui', 'sans-serif'],
				'roboto': ['"Fira Sans"', 'sans-serif'],
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'fade-in': {
					'0%': { opacity: '0', transform: 'translateY(20px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'slide-in': {
					'0%': { transform: 'translateX(-100%)' },
					'100%': { transform: 'translateX(0)' }
				},
				'pulse-glow': {
					'0%, 100%': {
						boxShadow: '0 0 20px rgba(117, 22, 226, 0.3)',
						transform: 'scale(1)'
					},
					'50%': {
						boxShadow: '0 0 40px rgba(117, 22, 226, 0.6)',
						transform: 'scale(1.02)'
					}
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0px)' },
					'50%': { transform: 'translateY(-10px)' }
				},
				'aurora': {
					from: {
						backgroundPosition: '50% 50%, 50% 50%'
					},
					to: {
						backgroundPosition: '350% 50%, 350% 50%'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.6s ease-out',
				'slide-in': 'slide-in 0.5s ease-out',
				'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
				'float': 'float 3s ease-in-out infinite',
				'aurora': 'aurora 60s linear infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography"), addVariablesForColors],
} satisfies Config;

// This plugin adds each Tailwind color as a global CSS variable
function addVariablesForColors({ addBase, theme }: any) {
	const allColors = flattenColorPalette(theme("colors"));
	const newVars = Object.fromEntries(
		Object.entries(allColors).map(([key, val]) => [`--${key}`, val])
	);

	addBase({
		":root": newVars,
	});
}
