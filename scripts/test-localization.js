const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const esbuild = require('esbuild');

const root = path.resolve(__dirname, '..');
let executable = process.env.VSCODE_EXECUTABLE || path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Microsoft VS Code', 'Code.exe');
const version = process.argv.includes('--version') ? process.argv[process.argv.indexOf('--version') + 1] : undefined;
const extensionRoot = process.env.LOCALIZATION_EXTENSION_PATH || root;
const review = process.argv.includes('--ui');
const renameReview = process.argv.includes('--rename-ui');
const renameAutomatic = process.argv.includes('--rename');
const locales = process.argv.includes('--locale') ? [process.argv[process.argv.indexOf('--locale') + 1]] : ['en', 'zh-cn'];

async function main() {
    if (version && !process.env.VSCODE_EXECUTABLE) executable = await require('@vscode/test-electron').downloadAndUnzipVSCode({ version, cachePath: path.join(root, '.vscode-test') });
    if (!fs.existsSync(executable)) throw new Error('Set VSCODE_EXECUTABLE to an installed VS Code executable.');
    await esbuild.build({
        entryPoints: [path.join(root, 'src/test/localization/index.ts')],
        bundle: true,
        platform: 'node',
        format: 'cjs',
        external: ['vscode'],
        outfile: path.join(root, 'out/test/localization/index.js')
    });
    for (const locale of locales) {
        if (!['en', 'zh-cn'].includes(locale)) throw new Error(`Unsupported test locale: ${locale}`);
        const directory = path.join(root, '.temp', 'localization', ...(version ? [version] : []), locale);
        const workspace = path.join(directory, 'workspace');
        fs.mkdirSync(path.join(workspace, '.vscode'), { recursive: true });
        const userData = path.join(directory, 'user-data');
        fs.mkdirSync(userData, { recursive: true });
        if (locale === 'zh-cn') {
            // VS Code resolves the UI language before scanning installed extensions on first launch.
            const languagePacks = process.env.VSCODE_LANGUAGE_PACK_CONFIG || path.join(process.env.APPDATA || '', 'Code', 'languagepacks.json');
            if (!fs.existsSync(languagePacks)) throw new Error('Install the Chinese language pack, or set VSCODE_LANGUAGE_PACK_CONFIG to its languagepacks.json.');
            fs.copyFileSync(languagePacks, path.join(userData, 'languagepacks.json'));
        }
        for (const marker of ['ui-ready', 'ui-complete', 'result.json']) {
            const file = path.join(directory, marker);
            if (fs.existsSync(file)) fs.unlinkSync(file);
        }
        fs.writeFileSync(path.join(workspace, '.vscode', 'settings.json'), JSON.stringify({
            'unityshader.mobile.enabled': true,
            'unityshader.engineType': 'unity',
            'window.title': `Localization ${locale} - ${'${activeEditorShort}'} - ${'${appName}'}`,
            'workbench.startupEditor': 'none',
            'extensions.ignoreRecommendations': true
        }, null, 2));
        const env = { ...process.env, LOCALIZATION_TEST_DIRECTORY: directory, LOCALIZATION_TEST_LOCALE: locale, LOCALIZATION_EXPECTED_EXTENSION_PATH: extensionRoot, LOCALIZATION_UI_REVIEW: review ? '1' : '0', LOCALIZATION_RENAME_REVIEW: renameReview ? '1' : '0', LOCALIZATION_RENAME_AUTOMATIC: renameAutomatic ? '1' : '0' };
        if (renameReview || renameAutomatic) env.VSCODE_DEBUG_MODE = 'true';
        delete env.ELECTRON_RUN_AS_NODE;
        const logFile = path.join(directory, 'vscode.log');
        const log = fs.openSync(logFile, 'w');
        const exitCode = await new Promise((resolve, reject) => {
            const child = spawn(executable, [
                '--new-window', '--wait', '--disable-extensions', '--disable-workspace-trust',
                '--skip-welcome', '--skip-release-notes', '--locale', locale,
                '--user-data-dir', userData,
                `--extensionDevelopmentPath=${extensionRoot}`,
                `--extensionTestsPath=${path.join(root, 'out/test/localization/index.js')}`,
                workspace
            ], { env, stdio: ['ignore', log, log] });
            child.on('error', reject);
            child.on('exit', resolve);
        });
        fs.closeSync(log);
        if (exitCode !== 0) throw new Error(`${locale}: VS Code exited with ${exitCode}; see ${logFile}`);
        const result = JSON.parse(fs.readFileSync(path.join(directory, 'result.json'), 'utf8'));
        if (result.language !== locale) throw new Error(`${locale}: VS Code actually loaded ${result.language}`);
        if (!result.passed) throw new Error(`${locale}: ${result.error}`);
        console.log(`${locale}: ${result.checks.length} extension-host checks passed.`);
    }
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
