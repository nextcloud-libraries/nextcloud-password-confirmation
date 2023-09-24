import * as fs from 'node:fs'
import { resolve } from 'node:path'
import gettextParser from 'gettext-parser'
import { createLibConfig } from '@nextcloud/vite-config'

const translations = fs
	.readdirSync('./l10n')
	.filter((name) => name !== 'messages.pot' && name.endsWith('.pot'))
	.map((file) => {
		const path = `./l10n/${file}`
		const locale = file.slice(0, -'.pot'.length)

		const po = fs.readFileSync(path)
		const json = gettextParser.po.parse(po)

		return { locale, json }
	})

export default createLibConfig({
	index: resolve(__dirname, 'src/main.ts'),
}, {
	libraryFormats: ['cjs', 'es'],
	replace: {
		__TRANSLATIONS__: JSON.stringify(translations),
	},
	DTSPluginOptions: {
		rollupTypes: true,
	},
})
