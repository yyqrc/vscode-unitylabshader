import * as assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as vscode from 'vscode';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function run(): Promise<void> {
    const directory = process.env.LOCALIZATION_TEST_DIRECTORY!;
    const chinese = vscode.env.language.toLowerCase() === 'zh-cn';
    const checks: string[] = [];
    const result: { passed: boolean; language: string; checks: string[]; error?: string } = {
        passed: false, language: vscode.env.language, checks
    };
    try {
        assert.equal(vscode.env.language.toLowerCase(), process.env.LOCALIZATION_TEST_LOCALE, 'VS Code must actually run in the requested UI language');
        const extension = vscode.extensions.getExtension('ashiqi.UnityShader')!;
        assert.ok(extension, 'Development extension must be loaded');
        assert.equal(path.resolve(extension.extensionPath).toLowerCase(), path.resolve(process.env.LOCALIZATION_EXPECTED_EXTENSION_PATH!).toLowerCase(), 'Checks must target the requested source or unpacked VSIX');
        await extension.activate();
        const nls = JSON.parse(fs.readFileSync(path.join(extension.extensionPath, chinese ? 'package.nls.zh-cn.json' : 'package.nls.json'), 'utf8'));
        const manifest = extension.packageJSON;
        assert.equal(manifest.contributes.configuration.title, nls['configuration.title']);
        for (const [key, setting] of Object.entries(manifest.contributes.configuration.properties)) {
            assert.equal((setting as { description: string }).description, nls[`${key}.description`]);
        }
        checks.push('Localized settings group and all 16 setting descriptions');
        for (const command of manifest.contributes.commands) {
            const title = typeof command.title === 'string' ? command.title : command.title.value;
            assert.equal(title, nls[`${command.command}.title`]);
        }
        checks.push('All five localized command titles');
        assert.equal(manifest.contributes.snippets[0].path, nls['snippets.path']);
        checks.push('Language-specific snippet contribution path');

        const workspace = vscode.workspace.workspaceFolders![0].uri.fsPath;
        const shaderPath = path.join(workspace, 'Localization.shader');
        const text = [
            'Shader "Tests/Localization" {',
            'Properties { _Color ("Color", Color) = (1,1,1,1) }',
            'SubShader {',
            'Blend SrcAlpha OneMinusSrcAlpha',
            'Pass {',
            'HLSLPROGRAM',
            '#pragma multi_compile _ A B C D',
            '#pragma multi_compile _ E F G H',
            '#pragma multi_compile _ I J K L',
            '#pragma multi_compile _ M N O P',
            'float unusedValue = 0.0;',
            'float4 main(float4 value : POSITION) : SV_Target {',
            '    float4 result = abs(value);',
            '    imageLoad(textureImage, int2(0, 0));',
            '    return result;',
            '}',
            'UNITY_MATRIX_MVP',
            'TransformObjectToHClip',
            'ENDHLSL',
            '}',
            '}',
            '}'
        ].join('\n');
        fs.writeFileSync(shaderPath, text);
        const document = await vscode.workspace.openTextDocument(shaderPath);
        const editor = await vscode.window.showTextDocument(document);
        assert.equal(document.languageId, 'unityshader');
        const position = (word: string, offset = 1) => document.positionAt(text.indexOf(word) + offset);
        async function hover(word: string): Promise<string> {
            const items = await vscode.commands.executeCommand<vscode.Hover[]>('vscode.executeHoverProvider', document.uri, position(word));
            return items.flatMap(item => item.contents.map(content => typeof content === 'string' ? content : 'value' in content ? content.value : '')).join('\n');
        }
        const hlsl = await hover('abs(value)');
        assert.ok(hlsl.includes(chinese ? '返回指定值的绝对值' : 'Returns the absolute value'));
        assert.ok(!hlsl.includes(chinese ? 'Returns the absolute value' : '返回指定值的绝对值'));
        checks.push('HLSL hover displays one language');
        const unity = await hover('UNITY_MATRIX_MVP');
        assert.ok(unity.includes(chinese ? '当前模型视图投影矩阵' : 'Current model-view-projection matrix'));
        checks.push('Translated Unity documentation');
        const urp = await hover('TransformObjectToHClip');
        assert.ok(urp.includes(chinese ? '将顶点从模型空间变换到齐次裁剪空间' : 'Transform a vertex from object space to homogeneous clip space'));
        assert.ok(urp.includes(chinese ? '**参数**' : '**Parameters**'));
        checks.push('Translated URP documentation and headings');
        const blend = await hover('Blend SrcAlpha');
        assert.ok(blend.includes(chinese ? '混合模式' : 'Blend mode'), blend);
        checks.push('Translated ShaderLab render state hover');
        const variants = await hover('multi_compile');
        assert.ok(variants.includes(chinese ? '**选项数量**' : '**Option count**'));
        checks.push('Translated variant details');
        const signatures = await vscode.commands.executeCommand<vscode.SignatureHelp>('vscode.executeSignatureHelpProvider', document.uri, position('abs(value)', 4));
        assert.ok(signatures.signatures.length > 0);
        const parameter = signatures.signatures[0].parameters[0].documentation;
        assert.equal(typeof parameter === 'string' ? parameter : parameter?.value, chinese ? '指定的值' : 'The specified value');
        checks.push('Localized signature parameter documentation');
        const completions = await vscode.commands.executeCommand<vscode.CompletionList>('vscode.executeCompletionItemProvider', document.uri, position('UNITY_MATRIX_MVP', 'UNITY_MATRIX_'.length));
        const completion = completions.items.find(item => item.label === 'UNITY_MATRIX_MVP')!;
        assert.ok(completion);
        assert.ok((typeof completion.documentation === 'string' ? completion.documentation : completion.documentation?.value)?.includes(chinese ? '**类型**' : '**Type**'));
        checks.push('Translated completion documentation');

        let diagnostics: readonly vscode.Diagnostic[] = [];
        for (let attempt = 0; attempt < 40; attempt++) {
            diagnostics = vscode.languages.getDiagnostics(document.uri);
            if (diagnostics.some(item => item.code === 'mobile-unsupported-imageLoad') && diagnostics.some(item => item.message.includes(chinese ? '变体数量过多' : 'Too many shader variants'))) break;
            await delay(250);
        }
        const mobile = diagnostics.find(item => item.code === 'mobile-unsupported-imageLoad')!;
        assert.ok(mobile, 'Mobile unsupported-feature diagnostic must be present');
        assert.ok(mobile.message.includes(chinese ? '需要 ES3.1+' : 'ES3.1+ is required'));
        const variant = diagnostics.find(item => item.message.includes(chinese ? '变体数量过多' : 'Too many shader variants'))!;
        assert.ok(variant);
        assert.ok(!variant.message.includes(chinese ? 'Too many shader variants' : 'Shader 变体数量过多'));
        assert.ok(diagnostics.some(item => item.message.includes(chinese ? '已声明但未使用' : 'is declared but never used')));
        if (!chinese) assert.ok(diagnostics.every(item => !/[\u3400-\u9fff]/.test(item.message)));
        checks.push('Localized mobile, variant and unused-symbol diagnostics');

        const unrealPath = path.join(workspace, 'Localization.usf');
        fs.writeFileSync(unrealPath, 'Texture2DSample(Tex, Sampler, UV);\n');
        await vscode.workspace.getConfiguration('unityshader').update('engineType', 'unreal', vscode.ConfigurationTarget.Workspace);
        const unrealDocument = await vscode.workspace.openTextDocument(unrealPath);
        await vscode.window.showTextDocument(unrealDocument);
        const unrealCompletions = await vscode.commands.executeCommand<vscode.CompletionList>('vscode.executeCompletionItemProvider', unrealDocument.uri, new vscode.Position(0, 8));
        const unrealItem = unrealCompletions.items.find(item => item.label === 'Texture2DSample')!;
        const unrealDoc = typeof unrealItem.documentation === 'string' ? unrealItem.documentation : unrealItem.documentation?.value || '';
        assert.ok(unrealDoc.includes(chinese ? '采样 2D 纹理' : 'Sample a 2D texture'));
        assert.ok(!unrealDoc.includes(chinese ? 'Sample a 2D texture' : '采样 2D 纹理'));
        checks.push('Unreal completion displays one language');
        await vscode.workspace.getConfiguration('unityshader').update('engineType', 'unity', vscode.ConfigurationTarget.Workspace);
        await vscode.window.showTextDocument(document);
        editor.selection = new vscode.Selection(position('abs(value)'), position('abs(value)'));
        const automaticRename = process.env.LOCALIZATION_RENAME_AUTOMATIC === '1';
        if (automaticRename || process.env.LOCALIZATION_RENAME_REVIEW === '1') {
            const oldName = 'localizationRenameTarget';
            const newName = 'localizationRenamedValue';
            const firstText = `float ${oldName} = 1.0;\nfloat ReadRenameTarget() {\n    return ${oldName};\n}\n`;
            const secondText = `float ReadOtherRenameTarget() {\n    return ${oldName};\n}\n`;
            const firstPath = path.join(workspace, 'RenameA.hlsl');
            const secondPath = path.join(workspace, 'RenameB.hlsl');
            fs.writeFileSync(firstPath, firstText);
            fs.writeFileSync(secondPath, secondText);
            const firstDocument = await vscode.workspace.openTextDocument(firstPath);
            const secondDocument = await vscode.workspace.openTextDocument(secondPath);
            assert.equal(firstDocument.languageId, 'unityshader');
            const renameEditor = await vscode.window.showTextDocument(firstDocument);
            const renamePosition = new vscode.Position(0, 'float '.length + 1);
            renameEditor.selection = new vscode.Selection(renamePosition, renamePosition);
            for (const stage of ['cancel', 'escape', 'confirm']) {
                // Let the previous quick picker finish hiding before opening the next one.
                await delay(500);
                fs.writeFileSync(path.join(directory, 'ui-ready'), JSON.stringify({ stage: `rename-${stage}`, language: vscode.env.language, oldName, newName, files: 2, references: 3 }));
                let settled = false;
                let actionSent = false;
                const request = vscode.commands.executeCommand<vscode.WorkspaceEdit | undefined>('vscode.executeDocumentRenameProvider', firstDocument.uri, renamePosition, newName).then(edit => {
                    settled = true;
                    return edit;
                }, error => {
                    settled = true;
                    // VS Code reports a provider's cancelled/null result as "No result.".
                    const noResultMessage = chinese ? '无结果。' : 'No result.';
                    if (stage === 'confirm' || !(error instanceof Error) || error.message !== noResultMessage) throw error;
                    return undefined;
                });
                const drivePicker = async () => {
                    if (!automaticRename) return;
                    await delay(300);
                    assert.ok(!settled, `${stage}: picker closed before the requested action`);
                    if (stage === 'escape') {
                        actionSent = true;
                        await vscode.commands.executeCommand('workbench.action.closeQuickOpen');
                    } else {
                        // This fixture has summary + 2 file rows + 3 reference rows + confirm + cancel.
                        const steps = stage === 'cancel' ? 7 : 6;
                        for (let step = 0; step < steps; step++) {
                            await vscode.commands.executeCommand('workbench.action.quickOpenSelectNext');
                        }
                        assert.ok(!settled, `${stage}: picker closed during navigation`);
                        actionSent = true;
                        await vscode.commands.executeCommand('workbench.action.acceptSelectedQuickOpenItem');
                    }
                };
                const [edit] = await Promise.all([request, drivePicker()]);
                if (automaticRename) assert.ok(actionSent, `${stage}: the actual quick-picker action must run`);
                if (stage !== 'confirm') {
                    assert.ok(!edit || edit.size === 0, `${stage}: cancelled rename must return no edits`);
                    assert.equal(firstDocument.getText(), firstText);
                    assert.equal(secondDocument.getText(), secondText);
                    assert.equal(fs.readFileSync(firstPath, 'utf8'), firstText);
                    assert.equal(fs.readFileSync(secondPath, 'utf8'), secondText);
                    checks.push(`Rename ${stage} leaves both documents and files unchanged`);
                } else {
                    assert.ok(edit);
                    assert.equal(edit.size, 2, 'Confirmation must affect both files');
                    assert.equal(edit.entries().reduce((count, [, edits]) => count + edits.length, 0), 3, 'Confirmation must replace all three references');
                    assert.ok(await vscode.workspace.applyEdit(edit));
                    assert.equal(firstDocument.getText(), firstText.replaceAll(oldName, newName));
                    assert.equal(secondDocument.getText(), secondText.replaceAll(oldName, newName));
                    assert.ok(await firstDocument.save());
                    assert.ok(await secondDocument.save());
                    assert.equal(fs.readFileSync(firstPath, 'utf8'), firstText.replaceAll(oldName, newName));
                    assert.equal(fs.readFileSync(secondPath, 'utf8'), secondText.replaceAll(oldName, newName));
                    checks.push('Rename confirmation applies and saves all three references across two files');
                }
            }
        }
        result.passed = true;
        fs.writeFileSync(path.join(directory, 'result.json'), JSON.stringify(result, null, 2));
        if (process.env.LOCALIZATION_UI_REVIEW === '1') {
            await vscode.commands.executeCommand('workbench.action.openSettings', '@ext:ashiqi.UnityShader');
            fs.writeFileSync(path.join(directory, 'ui-ready'), 'ready');
            console.log(`LOCALIZATION_UI_READY ${vscode.env.language}`);
            while (!fs.existsSync(path.join(directory, 'ui-complete'))) await delay(500);
        }
    } catch (error) {
        result.passed = false;
        result.error = error instanceof Error ? error.stack : String(error);
        fs.writeFileSync(path.join(directory, 'result.json'), JSON.stringify(result, null, 2));
        throw error;
    }
}
