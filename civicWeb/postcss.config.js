import tailwind from '@tailwindcss/postcss'
import autoprefixer from 'autoprefixer'

export default {
	plugins: [
		// Tailwind v4 PostCSS plugin
		tailwind(),
		autoprefixer(),
	],
};
