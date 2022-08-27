import { getGettextBuilder } from '@nextcloud/l10n/lib/gettext.js'

const gtBuilder = getGettextBuilder()
	.detectLocale()

__TRANSLATIONS__
	.map(({ locale, json }) => gtBuilder.addTranslation(locale, json))

const gt = gtBuilder.build()

export const n = gt.ngettext.bind(gt)
export const t = gt.gettext.bind(gt)
