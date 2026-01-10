// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';

import { setHlslExtensions, setRgPath } from './common';

import HLSLHoverProvider from './hlsl/hoverProvider';
import HLSLCompletionItemProvider from './hlsl/completionProvider';
import HLSLSignatureHelpProvider from './hlsl/signatureProvider';
import HLSLSymbolProvider from './hlsl/symbolProvider';
import HLSLDefinitionProvider from './hlsl/definitionProvider';
import HLSLReferenceProvider from './hlsl/referenceProvider';
import HLSLFoldingRangeProvider from './hlsl/foldingProvider';

// Unity Shader 支持的文件类型
const documentSelector = [
    { language: 'unityshader', scheme: 'file' },
    { language: 'unityshader', scheme: 'untitled' },
];

/**
 * 获取 VS Code 内置的 ripgrep 路径
 */
function getVscodeRgPath(): string {
    const vscodeAppRoot = vscode.env.appRoot;
    // VS Code 内置 ripgrep 的路径
    // Windows: node_modules/@vscode/ripgrep/bin/rg.exe
    // macOS/Linux: node_modules/@vscode/ripgrep/bin/rg
    const rgExe = process.platform === 'win32' ? 'rg.exe' : 'rg';
    return path.join(vscodeAppRoot, 'node_modules', '@vscode', 'ripgrep', 'bin', rgExe);
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // 控制台输出激活信息
    console.log('Unity Shader extension is now active!');

    // 初始化 ripgrep 路径（使用 VS Code 内置的 ripgrep）
    const rgPath = getVscodeRgPath();
    setRgPath(rgPath);
    console.log('Using ripgrep at:', rgPath);

    // 处理文件关联配置
    const associations = vscode.workspace.getConfiguration('files.associations');
    for (const fileType of Object.keys(associations)) {
        if (associations[fileType] === 'hlsl' || associations[fileType] === 'unityshader') {
            setHlslExtensions(fileType.substring(1));
        }
    }

    // 注册 Hover 提供器（需要保存实例以确保命令正确注册）
    const hoverProvider = new HLSLHoverProvider();
    context.subscriptions.push(vscode.languages.registerHoverProvider(documentSelector, hoverProvider));
    context.subscriptions.push(hoverProvider);
    
    // 注册代码补全提供器
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider(documentSelector, new HLSLCompletionItemProvider(), '.'));
    
    // 注册函数签名帮助提供器
    context.subscriptions.push(vscode.languages.registerSignatureHelpProvider(documentSelector, new HLSLSignatureHelpProvider(), '(', ','));
    
    // 注册引用查找提供器
    context.subscriptions.push(vscode.languages.registerReferenceProvider(documentSelector, new HLSLReferenceProvider()));

    // 注册符号提供器（文档符号 + 工作区符号）
    let symbolProvider = new HLSLSymbolProvider();
    context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider(documentSelector, symbolProvider));
    context.subscriptions.push(vscode.languages.registerWorkspaceSymbolProvider(symbolProvider));

    // 注册定义跳转提供器
    let definitionProvider = new HLSLDefinitionProvider();
    context.subscriptions.push(vscode.languages.registerDefinitionProvider(documentSelector, definitionProvider));
    context.subscriptions.push(vscode.languages.registerImplementationProvider(documentSelector, definitionProvider));
    context.subscriptions.push(vscode.languages.registerTypeDefinitionProvider(documentSelector, definitionProvider));

    // 注册折叠提供器（支持 #if/#else/#endif 分段折叠）
    context.subscriptions.push(vscode.languages.registerFoldingRangeProvider(documentSelector, new HLSLFoldingRangeProvider()));

}

// This method is called when your extension is deactivated
export function deactivate() {}
