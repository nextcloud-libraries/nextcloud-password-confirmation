import * as fs from 'node:fs'
import { resolve } from 'node:path'
import gettextParser from 'gettext-parser'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue2'
import browserslistToEsbuild from 'browserslist-to-esbuild'
import { dependencies } from './package.json'

const translations = fs
	.readdirSync('./l10n')
	.filter(name => name !== 'messages.pot' && name.endsWith('.pot'))
	.map(file => {
		const path = './l10n/' + file
		const locale = file.slice(0, -'.pot'.length)

		const po = fs.readFileSync(path)
		const json = gettextParser.po.parse(po)

		return { locale, json }
	})

export default defineConfig({
	plugins: [vue()],
	define: {
		__TRANSLATIONS__: translations,
	},
	build: {
		target: browserslistToEsbuild(),
		outDir: 'dist',
		sourcemap: true,
		lib: {
			entry: resolve(__dirname, 'src/main.ts'),
			fileName: 'main',
			formats: ['cjs'], // es format removed to fix https://github.com/nextcloud/server build error
		},
		rollupOptions: {
			external: [
		  ...Object.keys(dependencies),
		  '@nextcloud/vue/dist/Components/NcButton.js',
		  '@nextcloud/vue/dist/Components/NcModal.js',
		  '@nextcloud/vue/dist/Components/NcPasswordField.js',
		  '@nextcloud/vue/dist/Components/NcNoteCard.js',
	  ],
			output: {
				globals: { vue: 'Vue' },
			},
		},
	},
})
