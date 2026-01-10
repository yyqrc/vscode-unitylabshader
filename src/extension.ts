// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';

import { setHlslExtensions, setRgPath } from './common';
import { EngineContextManager } from './common/engineContext';

import HLSLHoverProvider from './hlsl/hoverProvider';
import HLSLCompletionItemProvider from './hlsl/completionProvider';
import HLSLSignatureHelpProvider from './hlsl/signatureProvider';
import HLSLSymbolProvider from './hlsl/symbolProvider';
import HLSLDefinitionProvider from './hlsl/definitionProvider';
import HLSLReferenceProvider from './hlsl/referenceProvider';
import HLSLFoldingRangeProvider from './hlsl/foldingProvider';
import HLSLRenameProvider from './hlsl/renameProvider';
import HLSLFormattingProvider from './hlsl/formattingProvider';
import { SemanticAnalyzer } from './analysis/semanticAnalyzer';
import { VariantAnalyzer } from './analysis/variantAnalyzer';

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

    // 初始化引擎上下文管理器
    const engineContext = EngineContextManager.getInstance();
    engineContext.initialize(context);
    console.log('Engine context manager initialized');

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

    // 初始化语义分析器和变体分析器
    const semanticAnalyzer = new SemanticAnalyzer();
    const variantAnalyzer = new VariantAnalyzer();
    context.subscriptions.push(semanticAnalyzer);
    context.subscriptions.push(variantAnalyzer);

    // 注册 Hover 提供器（传入analyzer实例）
    const hoverProvider = new HLSLHoverProvider(semanticAnalyzer, variantAnalyzer);
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

    // 注册重命名提供器
    context.subscriptions.push(vscode.languages.registerRenameProvider(documentSelector, new HLSLRenameProvider()));

    // 注册代码格式化提供器
    const formattingProvider = new HLSLFormattingProvider();
    context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider(documentSelector, formattingProvider));
    context.subscriptions.push(vscode.languages.registerDocumentRangeFormattingEditProvider(documentSelector, formattingProvider));

    // 监听文档变化，触发语义分析
    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(event => {
            if (event.document.languageId === 'unityshader') {
                // 检查配置选项
                const config = vscode.workspace.getConfiguration('unityshader');
                const enableSemanticAnalysis = config.get<boolean>('analysis.semanticAnalysis', true);
                const enableVariantAnalysis = config.get<boolean>('analysis.variantAnalysis', true);
                
                // 延迟分析，避免频繁触发
                setTimeout(() => {
                    if (enableSemanticAnalysis) {
                        semanticAnalyzer.analyzeDocument(event.document);
                    }
                    if (enableVariantAnalysis) {
                        const editor = vscode.window.activeTextEditor;
                        if (editor && editor.document === event.document) {
                            variantAnalyzer.analyzeDocument(event.document, editor);
                        }
                    }
                }, 500);
            }
        })
    );

    // 监听文档打开，触发初始分析
    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument(document => {
            if (document.languageId === 'unityshader') {
                const config = vscode.workspace.getConfiguration('unityshader');
                const enableSemanticAnalysis = config.get<boolean>('analysis.semanticAnalysis', true);
                const enableVariantAnalysis = config.get<boolean>('analysis.variantAnalysis', true);
                
                if (enableSemanticAnalysis) {
                    semanticAnalyzer.analyzeDocument(document);
                }
                if (enableVariantAnalysis) {
                    const editor = vscode.window.activeTextEditor;
                    if (editor && editor.document === document) {
                        variantAnalyzer.analyzeDocument(document, editor);
                    }
                }
            }
        })
    );

    // 监听活动编辑器变化
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(editor => {
            if (editor && editor.document.languageId === 'unityshader') {
                const config = vscode.workspace.getConfiguration('unityshader');
                const enableSemanticAnalysis = config.get<boolean>('analysis.semanticAnalysis', true);
                const enableVariantAnalysis = config.get<boolean>('analysis.variantAnalysis', true);
                
                if (enableSemanticAnalysis) {
                    semanticAnalyzer.analyzeDocument(editor.document);
                }
                if (enableVariantAnalysis) {
                    variantAnalyzer.analyzeDocument(editor.document, editor);
                }
            }
        })
    );

    // 对当前打开的文档进行初始分析
    if (vscode.window.activeTextEditor) {
        const document = vscode.window.activeTextEditor.document;
        if (document.languageId === 'unityshader') {
            const config = vscode.workspace.getConfiguration('unityshader');
            const enableSemanticAnalysis = config.get<boolean>('analysis.semanticAnalysis', true);
            const enableVariantAnalysis = config.get<boolean>('analysis.variantAnalysis', true);
            
            if (enableSemanticAnalysis) {
                semanticAnalyzer.analyzeDocument(document);
            }
            if (enableVariantAnalysis) {
                variantAnalyzer.analyzeDocument(document, vscode.window.activeTextEditor);
            }
        }
    }

}

// This method is called when your extension is deactivated
export function deactivate() {}
