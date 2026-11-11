import * as assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as vscode from 'vscode';
import HLSLDefinitionProvider from '../../hlsl/definitionProvider';
import { RipgrepUtils } from '../../utils/CommonUtils';

export async function run(): Promise<void> {
    const directory = process.env.NAVIGATION_TEST_DIRECTORY!;
    const checks: string[] = [];
    try {
        const extension = vscode.extensions.getExtension('ashiqi.UnityShader')!;
        assert.ok(extension, 'Extension is discoverable');
        const root = vscode.workspace.workspaceFolders![0].uri.fsPath;
        const document = await vscode.workspace.openTextDocument(path.join(root, 'nested/use.shader'));
        await vscode.window.showTextDocument(document);
        assert.equal(document.languageId, 'unityshader');
        // Do not call activate(): opening the contributed language must activate it.
        for (let i = 0; i < 100 && !extension.isActive; i++) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        assert.ok(extension.isActive, 'Opening a shader automatically activates the extension');
        checks.push('Shader language association and automatic activation');
        const rg = path.join(extension.extensionPath, 'node_modules/@vscode/ripgrep/bin', process.platform === 'win32' ? 'rg.exe' : 'rg');
        RipgrepUtils.setRgPath(rg);
        const matches = RipgrepUtils.searchMacroDefinitions('ISSUE_MACRO', root, ['.hlsl', '.cginc', '.shader']);
        assert.equal(matches.length, 1, 'Root files must not restrict recursive glob search');
        assert.equal(matches[0].filePath, path.join(root, 'nested/defs.hlsl'));
        checks.push('Recursive macro search with two matching root files');
        assert.equal(RipgrepUtils.searchMacroDefinitions('INCLUDE_MACRO', root, ['.hlsl', '.cginc']).length, 1);
        assert.equal(RipgrepUtils.searchFunctionDefinitions('TestFunction', root, ['.hlsl']).length, 1);
        assert.equal(RipgrepUtils.search({ rootPath: root, extensions: ['.hlsl'], pattern: '\\$ and "quote".*\\.$' }).length, 1);
        assert.equal(RipgrepUtils.searchMacroDefinitions('MISSING_MACRO', root, ['.hlsl']).length, 0);
        assert.ok(RipgrepUtils.searchFiles('defs.hlsl', root).some(file => file.includes('defs.hlsl')));
        checks.push('Multiple extensions, function search, regex quotes/dollar, no matches and include-file search');
        const line = document.lineAt(3).text;
        const coldProvider = new HLSLDefinitionProvider(null);
        const cancellation = new vscode.CancellationTokenSource();
        const executeCommand = vscode.commands.executeCommand;
        try {
            for (const name of ['ISSUE_MACRO', 'MixedMacro', 'UV', 'lowerValue', 'LOCAL_MACRO', 'TestFunction', 'F', 'FN']) {
                const position = new vscode.Position(3, new RegExp(`\\b${name}\\b`).exec(line)!.index);
                // 模拟工作区符号索引尚未就绪，避免后备查询掩盖直接搜索漏掉宏的问题。
                (vscode.commands as any).executeCommand = (command: string, ...args: any[]) =>
                    command === 'vscode.executeWorkspaceSymbolProvider' ? Promise.resolve([]) : executeCommand(command, ...args);
                let cold;
                try {
                    cold = await coldProvider.provideDefinition(document, position, cancellation.token);
                } finally {
                    (vscode.commands as any).executeCommand = executeCommand;
                }
                assert.ok(Array.isArray(cold) && cold.length > 0, `${name}: provider without persistent cache`);
                const locations = await vscode.commands.executeCommand<vscode.Location[]>('vscode.executeDefinitionProvider', document.uri, position);
                assert.ok(locations?.length > 0, `${name}: registered provider`);
                const target = await vscode.workspace.openTextDocument(locations[0].uri);
                const expectedLines: Record<string, number> = { ISSUE_MACRO: 0, MixedMacro: 1, UV: 2, lowerValue: 3, TestFunction: 4, F: 6, FN: 7 };
                assert.equal(locations[0].uri.fsPath, name === 'LOCAL_MACRO' ? document.uri.fsPath : path.join(root, 'nested/defs.hlsl'));
                assert.equal(locations[0].range.start.line, name === 'LOCAL_MACRO' ? 1 : expectedLines[name], `${name}: destination line`);
                assert.ok(target.getText(locations[0].range).includes(name), `${name}: destination covers the symbol`);
                checks.push(`${name}: cold and registered definition providers`);
            }
        } finally {
            cancellation.dispose();
            (coldProvider as any).fileWatcher?.dispose();
        }
        const completions = await vscode.commands.executeCommand<vscode.CompletionList>('vscode.executeCompletionItemProvider', document.uri, new vscode.Position(3, 5));
        assert.ok(completions?.items.length > 0);
        const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>('vscode.executeDocumentSymbolProvider', document.uri);
        assert.ok(symbols?.length > 0);
        const hover = await vscode.commands.executeCommand<vscode.Hover[]>('vscode.executeHoverProvider', document.uri, new vscode.Position(2, 2));
        assert.ok(hover?.length > 0);
        checks.push('Completion, document symbols and hover after automatic activation');
        const references = await vscode.commands.executeCommand<vscode.Location[]>('vscode.executeReferenceProvider', document.uri, new vscode.Position(3, line.indexOf('ISSUE_MACRO')));
        assert.ok(references?.some(location => location.uri.fsPath === document.uri.fsPath && location.range.start.line === 3));
        const includes = await vscode.commands.executeCommand<vscode.Location[]>('vscode.executeDefinitionProvider', document.uri, new vscode.Position(0, 12));
        assert.ok(includes?.some(location => location.uri.fsPath === path.join(root, 'nested/defs.hlsl')));
        checks.push('References and include navigation remain available');
        fs.writeFileSync(path.join(directory, 'result.json'), JSON.stringify({ passed: true, platform: process.platform, version: vscode.version, checks }, null, 2));
    } catch (error) {
        fs.writeFileSync(path.join(directory, 'result.json'), JSON.stringify({ passed: false, platform: process.platform, version: vscode.version, checks, error: String(error) }, null, 2));
        throw error;
    }
}
