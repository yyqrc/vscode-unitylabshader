const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { getL10nJson } = require('@vscode/l10n-dev');

const root = path.resolve(__dirname, '..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const manifest = read('package.json');
const english = read('package.nls.json');
const chinese = read('package.nls.zh-cn.json');
const references = new Set();
function collect(value) {
    if (typeof value === 'string' && /^%[^%]+%$/.test(value)) {
        references.add(value.slice(1, -1));
    } else if (value && typeof value === 'object') {
        Object.values(value).forEach(collect);
    }
}
collect(manifest);
assert.deepEqual(Object.keys(english).sort(), [...references].sort(), 'Manifest keys must match package.nls.json');

function placeholders(message) {
    return [...message.matchAll(/\{(\d+|[A-Za-z_]\w*)\}/g)].map(match => match[1]).sort();
}
function compare(source, translated, name) {
    assert.deepEqual(Object.keys(translated).sort(), Object.keys(source).sort(), `${name}: missing or obsolete keys`);
    for (const [key, value] of Object.entries(source)) {
        const message = typeof value === 'string' ? value : value.message;
        assert.equal(typeof translated[key], 'string', `${name}: ${key} must be a string`);
        assert.ok(translated[key].trim(), `${name}: ${key} is empty`);
        assert.deepEqual(placeholders(translated[key]), placeholders(message), `${name}: ${key} has mismatched placeholders`);
    }
}
compare(english, chinese, 'Manifest translations');

const sources = [];
function scan(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const file = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            if (entry.name !== 'test') scan(file);
        } else if (entry.name.endsWith('.ts')) {
            const text = fs.readFileSync(file, 'utf8');
            sources.push({ contents: text, extension: '.ts' });
            const tree = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
            function visit(node) {
                if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) ||
                    node.kind === ts.SyntaxKind.TemplateHead || node.kind === ts.SyntaxKind.TemplateMiddle || node.kind === ts.SyntaxKind.TemplateTail) {
                    assert.ok(!/[\u3400-\u9fff]/.test(node.text), `${path.relative(root, file)}:${tree.getLineAndCharacterOfPosition(node.getStart()).line + 1}: Chinese UI text must move to a translation bundle`);
                }
                ts.forEachChild(node, visit);
            }
            visit(tree);
        }
    }
}
scan(path.join(root, 'src'));
async function checkRuntime() {
    const extracted = await getL10nJson(sources);
    const baseline = read('l10n/bundle.l10n.json');
    assert.deepEqual(baseline, extracted, 'Runtime baseline is stale; run npm run l10n:export');
    compare(extracted, read('l10n/bundle.l10n.zh-cn.json'), 'Runtime translations');
    if (fs.existsSync(path.join(root, 'package.nls.qps-ploc.json'))) {
        const pseudo = read('package.nls.qps-ploc.json');
        compare(english, pseudo, 'Pseudo manifest');
        assert.equal(pseudo['snippets.path'], english['snippets.path'], 'Pseudo-localization must preserve the snippet asset path');
        compare(extracted, read('l10n/bundle.l10n.qps-ploc.json'), 'Pseudo runtime');
    }

    const snippets = read(english['snippets.path']);
    const localizedSnippets = read(chinese['snippets.path']);
    assert.deepEqual(Object.keys(snippets), Object.keys(localizedSnippets), 'Snippet names differ');
    for (const [name, snippet] of Object.entries(snippets)) {
        const { description, ...content } = snippet;
        const { description: localizedDescription, ...localizedContent } = localizedSnippets[name];
        assert.deepEqual(content, localizedContent, `${name}: snippet content differs between languages`);
        assert.ok(description && !/[\u3400-\u9fff]/.test(description), `${name}: English description missing`);
        assert.ok(localizedDescription.trim(), `${name}: Chinese description missing`);
    }
    console.log(`Localization checks passed: ${references.size} manifest entries, ${Object.keys(extracted).length} runtime messages, ${Object.keys(snippets).length} snippets.`);
}

checkRuntime().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
});
