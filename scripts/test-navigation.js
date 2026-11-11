const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const esbuild = require('esbuild');

const root = path.resolve(__dirname, '..');
fs.mkdirSync(path.join(root, '.temp'), { recursive: true });
const directory = fs.mkdtempSync(path.join(root, '.temp', 'navigation-'));

async function main() {
    const executable = process.env.VSCODE_EXECUTABLE || path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Microsoft VS Code', 'Code.exe');
    if (!fs.existsSync(executable)) throw new Error('Set VSCODE_EXECUTABLE to an installed VS Code executable.');
    const workspace = path.join(directory, 'workspace');
    fs.mkdirSync(path.join(workspace, 'nested'), { recursive: true });
    fs.mkdirSync(path.join(workspace, '.vscode'));
    fs.writeFileSync(path.join(workspace, '.vscode/settings.json'), JSON.stringify({
        'unityshader.engineType': 'unity',
        'workbench.startupEditor': 'none',
        'extensions.ignoreRecommendations': true
    }));
    fs.writeFileSync(path.join(workspace, 'root.hlsl'), '// A root file must not expand the recursive search glob.\n');
    fs.writeFileSync(path.join(workspace, 'other.hlsl'), '// A second root file must not become an rg argument.\n');
    fs.writeFileSync(path.join(workspace, 'nested/defs.hlsl'), [
        '#define ISSUE_MACRO 1',
        '#define MixedMacro(x) (x)',
        '#define UV(x) (x)',
        '#define lowerValue 2',
        'float TestFunction(float x) { return x; }',
        '// A literal $ and "quote" must survive argument passing.',
        '#define F(x) (x)',
        '#define FN(x) (x)'
    ].join('\n'));
    fs.writeFileSync(path.join(workspace, 'nested/other.cginc'), '#define INCLUDE_MACRO 3\n');
    fs.writeFileSync(path.join(workspace, 'nested/use.shader'), [
        '#include "defs.hlsl"',
        '#define LOCAL_MACRO 4',
        'float test() {',
        '    return ISSUE_MACRO + MixedMacro(1) + UV(2) + lowerValue + LOCAL_MACRO + TestFunction(1) + F(1) + FN(2);',
        '}'
    ].join('\n'));
    await esbuild.build({
        entryPoints: [path.join(root, 'src/test/navigation/index.ts')],
        bundle: true, platform: 'node', format: 'cjs', external: ['vscode'],
        outfile: path.join(directory, 'tests.js')
    });
    const env = { ...process.env, NAVIGATION_TEST_DIRECTORY: directory };
    delete env.ELECTRON_RUN_AS_NODE;
    const log = fs.openSync(path.join(directory, 'vscode.log'), 'w');
    let exitCode;
    try {
        exitCode = await new Promise((resolve, reject) => {
            const child = spawn(executable, [
                '--new-window', '--wait', '--disable-extensions', '--disable-workspace-trust',
                '--skip-welcome', '--skip-release-notes', '--locale', 'en',
                '--user-data-dir', path.join(directory, 'user-data'),
                '--extensions-dir', path.join(directory, 'extensions'),
                `--extensionDevelopmentPath=${root}`,
                `--extensionTestsPath=${path.join(directory, 'tests.js')}`, workspace
            ], { env, stdio: ['ignore', log, log] });
            child.on('error', reject);
            child.on('exit', resolve);
        });
    } finally {
        fs.closeSync(log);
    }
    const result = JSON.parse(fs.readFileSync(path.join(directory, 'result.json'), 'utf8'));
    console.log(JSON.stringify({ directory, exitCode, ...result }, null, 2));
    if (exitCode !== 0 || !result.passed) throw new Error('Navigation regression failed; see result.json and vscode.log.');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
