/*!
 * SPDX-FileCopyrightText: 2022 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: MIT
 */

import { GettextExtractor, JsExtractors, HtmlExtractors } from 'gettext-extractor'

const extractor = new GettextExtractor()

const jsParser = extractor.createJsParser([
	JsExtractors.callExpression('t', {
		arguments: {
			text: 0,
		},
	}),
	JsExtractors.callExpression('n', {
		arguments: {
			text: 0,
			textPlural: 1,
		},
	}),
])
	.parseFilesGlob('./src/**/*.@(ts|js)')

extractor.createHtmlParser([
	HtmlExtractors.embeddedJs('*', jsParser),
	HtmlExtractors.embeddedAttributeJs(/:[a-z]+/, jsParser),
])
	.parseFilesGlob('./src/**/*.vue')

// remove references to avoid conflicts
extractor.getMessages().forEach((msg) => {
	msg.references = []
})

extractor.savePotFile('./l10n/messages.pot')

extractor.printStats()
