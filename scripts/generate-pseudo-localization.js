const fs = require('node:fs');
const path = require('node:path');
const { getL10nPseudoLocalized } = require('@vscode/l10n-dev');

const root = path.resolve(__dirname, '..');
for (const file of ['package.nls.json', 'l10n/bundle.l10n.json']) {
    const source = JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
    const pseudo = getL10nPseudoLocalized(source);
    // This manifest entry selects an asset; it is not display text.
    if (file === 'package.nls.json') pseudo['snippets.path'] = source['snippets.path'];
    const output = file.replace(/\.json$/, '.qps-ploc.json');
    fs.writeFileSync(path.join(root, output), JSON.stringify(pseudo, null, 2) + '\n');
    console.log(`Generated ${output}`);
}
