import { GettextExtractor, JsExtractors } from 'gettext-extractor'

const extractor = new GettextExtractor()

extractor
    .createJsParser([
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
    .parseFilesGlob('./src/**/*.@(ts|js|vue)')

extractor.savePotFile('./l10n/messages.pot')

extractor.printStats()
