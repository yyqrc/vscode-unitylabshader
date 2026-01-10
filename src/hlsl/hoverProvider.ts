
import { HoverProvider, Hover, SymbolInformation, SymbolKind, MarkdownString, TextDocument, CancellationToken, Range, Position, commands, workspace } from 'vscode';
import hlslGlobals = require('./hlslGlobals');
import {
    unityBuiltinVariables,
    unityBuiltinFunctions,
    unityBuiltinMacros,
    shaderLabKeywords,
    shaderLabPropertyTypes,
    pragmaDirectives,
    UnityVariable,
    UnityFunction,
    UnityMacro,
    ShaderLabKeyword
} from '../unity/unityGlobals';
import { SemanticAnalyzer } from '../analysis/semanticAnalyzer';
import { VariantAnalyzer } from '../analysis/variantAnalyzer';
import {
    urpBuiltinVariables,
    urpBuiltinFunctions,
    urpBuiltinMacros,
    URPVariable,
    URPFunction,
    URPMacro
} from '../unity/urpGlobals';

// 构建查找表以提高性能
const unityVariableMap = new Map<string, UnityVariable>();
const unityFunctionMap = new Map<string, UnityFunction>();
const unityMacroMap = new Map<string, UnityMacro>();
const shaderLabKeywordMap = new Map<string, ShaderLabKeyword>();

// 初始化查找表
unityBuiltinVariables.forEach(v => unityVariableMap.set(v.name, v));
unityBuiltinFunctions.forEach(f => unityFunctionMap.set(f.name, f));
unityBuiltinMacros.forEach(m => unityMacroMap.set(m.name, m));
shaderLabKeywords.forEach(k => shaderLabKeywordMap.set(k.name, k));

// 构建 URP 查找表
const urpVariableMap = new Map<string, URPVariable>();
const urpFunctionMap = new Map<string, URPFunction>();
const urpMacroMap = new Map<string, URPMacro>();

urpBuiltinVariables.forEach(v => urpVariableMap.set(v.name, v));
urpBuiltinFunctions.forEach(f => urpFunctionMap.set(f.name, f));
urpBuiltinMacros.forEach(m => urpMacroMap.set(m.name, m));

// ShaderLab 渲染状态关键字悬停提示
const shaderLabRenderStates: { [key: string]: { description: string; values?: string } } = {
    'Blend': { description: '设置混合模式', values: 'Blend SrcFactor DstFactor\nBlend SrcFactor DstFactor, SrcFactorA DstFactorA\n\n常用值: One, Zero, SrcColor, SrcAlpha, DstColor, DstAlpha, OneMinusSrcAlpha, OneMinusDstAlpha' },
    'BlendOp': { description: '设置混合操作', values: 'BlendOp Op\n\n可选值: Add, Sub, RevSub, Min, Max' },
    'Cull': { description: '设置剔除模式', values: 'Cull Back | Front | Off\n\nBack: 剔除背面（默认）\nFront: 剔除正面\nOff: 禁用剔除（双面渲染）' },
    'ZWrite': { description: '设置深度写入', values: 'ZWrite On | Off\n\nOn: 启用深度写入（默认）\nOff: 禁用深度写入' },
    'ZTest': { description: '设置深度测试模式', values: 'ZTest Less | Greater | LEqual | GEqual | Equal | NotEqual | Always\n\nLEqual: 小于等于时通过（默认）\nAlways: 总是通过' },
    'ColorMask': { description: '设置颜色写入遮罩', values: 'ColorMask RGB | A | 0 | RGBA\n\nRGB: 只写入RGB通道\nA: 只写入Alpha通道\n0: 不写入任何颜色' },
    'Offset': { description: '设置深度偏移', values: 'Offset factor, units\n\n用于解决Z-fighting问题' },
    'Stencil': { description: '设置模板测试', values: 'Stencil {\n  Ref [value]\n  Comp [comparison]\n  Pass [operation]\n  Fail [operation]\n  ZFail [operation]\n}' },
    'AlphaToMask': { description: '启用Alpha到Coverage', values: 'AlphaToMask On | Off' },
};

export function textToMarkedString(text: string): MarkdownString {
	return new MarkdownString(text.replace(/[\\`*_{}[\]()#+\-.!]/g, '\\$&'));
}

export default class HLSLHoverProvider implements HoverProvider {
    private semanticAnalyzer: SemanticAnalyzer;
    private variantAnalyzer: VariantAnalyzer;

    constructor(semanticAnalyzer: SemanticAnalyzer, variantAnalyzer: VariantAnalyzer) {
        this.semanticAnalyzer = semanticAnalyzer;
        this.variantAnalyzer = variantAnalyzer;
    }

    private getSymbols(document: TextDocument): Thenable<SymbolInformation[]> {
        return commands.executeCommand<SymbolInformation[]>('vscode.executeDocumentSymbolProvider', document.uri);
    }

    dispose() {
        this.semanticAnalyzer.dispose();
        this.variantAnalyzer.dispose();
    }

    public async provideHover(document: TextDocument, position: Position, token: CancellationToken): Promise<Hover | null | undefined> {
        
        let enableBasic = workspace.getConfiguration('unityshader').get<boolean>('suggest.basic', true);
        let enableUnity = workspace.getConfiguration('unityshader').get<boolean>('suggest.unity', true);
        let enableURP = workspace.getConfiguration('unityshader').get<boolean>('suggest.urp', true);

        if (!enableBasic && !enableUnity && !enableURP) {
            return null;
        }

        // ============================================================================
        // Shader 变体分析悬停提示
        // ============================================================================
        const line = document.lineAt(position.line).text;
        if (line.match(/^\s*#pragma\s+(multi_compile|shader_feature)/)) {
            const variantDetails = this.variantAnalyzer.getVariantDetails(document, position.line);
            if (variantDetails) {
                return new Hover(new MarkdownString(variantDetails));
            }
        }

        let wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) {
            return null;
        }

        let name = document.getText(wordRange);
        
        let backchar = '';
        if(wordRange.start.character > 0) {
            let backidx = wordRange.start.translate({characterDelta: -1});
            backchar = backidx.character < 0 ? '' : document.getText(new Range(backidx, wordRange.start));
        }
        
        // ============================================================================
        // 变量类型推断悬停提示（优先级最高，排除预处理器）
        // ============================================================================
        if (backchar !== '#') {
            const varType = this.semanticAnalyzer.getVariableType(name, position.line);
            if (varType) {
                let contents: MarkdownString[] = [];
                const signature = new MarkdownString(`(*variable*) \`${varType}\` **${name}**`);
                contents.push(signature);
                contents.push(new MarkdownString('类型推断 (Type Inference)'));
                return new Hover(contents, wordRange);
            }
        }

        // ============================================================================
        // 预处理器悬停提示
        // ============================================================================
        if (backchar === '#') {
            const key = name.substr(1);
            var entry = hlslGlobals.preprocessors[name.toUpperCase()];
            if (entry && entry.description) {
                let signature = '(*preprocessor*) ';
                signature += '**#' + name + '**';
                let contents: MarkdownString[] = [];
                contents.push(new MarkdownString(signature));
                contents.push(textToMarkedString(entry.description));
                
                return new Hover(contents, wordRange);
            }
        }

        // ============================================================================
        // Unity 内置变量悬停提示
        // ============================================================================
        if (enableUnity) {
            const unityVar = unityVariableMap.get(name);
            if (unityVar) {
                let contents: MarkdownString[] = [];
                const signature = new MarkdownString(`(*Unity ${unityVar.category}*) \`${unityVar.type}\` **${unityVar.name}**`);
                contents.push(signature);
                contents.push(new MarkdownString(unityVar.description));
                return new Hover(contents, wordRange);
            }

            // Unity 内置函数悬停提示
            const unityFunc = unityFunctionMap.get(name);
            if (unityFunc) {
                let contents: MarkdownString[] = [];
                const signature = new MarkdownString(`(*Unity ${unityFunc.category}*) **${unityFunc.name}**`);
                contents.push(signature);
                
                // 函数签名
                const sigMd = new MarkdownString();
                sigMd.appendCodeblock(unityFunc.signature, 'hlsl');
                contents.push(sigMd);
                
                // 描述
                contents.push(new MarkdownString(unityFunc.description));
                
                // 参数说明
                if (unityFunc.parameters.length > 0) {
                    let paramMd = new MarkdownString('**参数**:\n');
                    unityFunc.parameters.forEach(p => {
                        paramMd.appendMarkdown(`- \`${p.type}\` **${p.name}**: ${p.description}\n`);
                    });
                    contents.push(paramMd);
                }
                
                // 返回值
                contents.push(new MarkdownString(`**返回**: \`${unityFunc.returnType}\``));
                
                return new Hover(contents, wordRange);
            }

            // Unity 宏悬停提示
            const unityMacro = unityMacroMap.get(name);
            if (unityMacro) {
                let contents: MarkdownString[] = [];
                const signature = new MarkdownString(`(*Unity Macro - ${unityMacro.category}*) **${unityMacro.name}**`);
                contents.push(signature);
                contents.push(new MarkdownString(unityMacro.description));
                
                if (unityMacro.usage) {
                    const usageMd = new MarkdownString('**用法**:');
                    usageMd.appendCodeblock(unityMacro.usage, 'hlsl');
                    contents.push(usageMd);
                }
                
                return new Hover(contents, wordRange);
            }

            // ShaderLab 关键字悬停提示
            const shaderLabKw = shaderLabKeywordMap.get(name);
            if (shaderLabKw) {
                let contents: MarkdownString[] = [];
                const signature = new MarkdownString(`(*ShaderLab ${shaderLabKw.category}*) **${shaderLabKw.name}**`);
                contents.push(signature);
                contents.push(new MarkdownString(shaderLabKw.description));
                return new Hover(contents, wordRange);
            }

            // ShaderLab 渲染状态悬停提示
            const renderState = shaderLabRenderStates[name];
            if (renderState) {
                let contents: MarkdownString[] = [];
                const signature = new MarkdownString(`(*ShaderLab RenderState*) **${name}**`);
                contents.push(signature);
                contents.push(new MarkdownString(renderState.description));
                
                if (renderState.values) {
                    const valuesMd = new MarkdownString('**语法**:');
                    valuesMd.appendCodeblock(renderState.values, 'shaderlab');
                    contents.push(valuesMd);
                }
                
                return new Hover(contents, wordRange);
            }
        }

        // ============================================================================
        // URP 内置变量/函数/宏悬停提示
        // ============================================================================
        if (enableURP) {
            // URP 变量悬停提示
            const urpVar = urpVariableMap.get(name);
            if (urpVar) {
                let contents: MarkdownString[] = [];
                const signature = new MarkdownString(`(*URP ${urpVar.category}*) \`${urpVar.type}\` **${urpVar.name}**`);
                contents.push(signature);
                contents.push(new MarkdownString(urpVar.description));
                return new Hover(contents, wordRange);
            }

            // URP 函数悬停提示
            const urpFunc = urpFunctionMap.get(name);
            if (urpFunc) {
                let contents: MarkdownString[] = [];
                const signature = new MarkdownString(`(*URP ${urpFunc.category}*) **${urpFunc.name}**`);
                contents.push(signature);
                
                // 函数签名
                const sigMd = new MarkdownString();
                sigMd.appendCodeblock(urpFunc.signature, 'hlsl');
                contents.push(sigMd);
                
                // 描述
                contents.push(new MarkdownString(urpFunc.description));
                
                // 参数说明
                if (urpFunc.parameters.length > 0) {
                    let paramMd = new MarkdownString('**参数**:\n');
                    urpFunc.parameters.forEach(p => {
                        paramMd.appendMarkdown(`- \`${p.type}\` **${p.name}**: ${p.description}\n`);
                    });
                    contents.push(paramMd);
                }
                
                // 返回值
                contents.push(new MarkdownString(`**返回**: \`${urpFunc.returnType}\``));
                
                return new Hover(contents, wordRange);
            }

            // URP 宏悬停提示
            const urpMacro = urpMacroMap.get(name);
            if (urpMacro) {
                let contents: MarkdownString[] = [];
                const signature = new MarkdownString(`(*URP Macro - ${urpMacro.category}*) **${urpMacro.name}**`);
                contents.push(signature);
                contents.push(new MarkdownString(urpMacro.description));
                
                if (urpMacro.usage) {
                    const usageMd = new MarkdownString('**用法**:');
                    usageMd.appendCodeblock(urpMacro.usage, 'hlsl');
                    contents.push(usageMd);
                }
                
                return new Hover(contents, wordRange);
            }
        }

        // ============================================================================
        // HLSL 内置函数悬停提示
        // ============================================================================
        if (enableBasic) {
            var entry = hlslGlobals.intrinsicfunctions[name];
            if (entry && entry.description) {
                let signature = '(*function*) ';
                signature += '**' + name + '**';
                signature += '(';
                if (entry.parameters && entry.parameters.length !== 0) {
                    let params = '';
                    entry.parameters.forEach(p => params += p.label + ',');
                    signature += params.slice(0, -1);
                }
                signature += ')';
                let contents: MarkdownString[] = [];
                contents.push(new MarkdownString(signature));
                contents.push(textToMarkedString(entry.description));
                return new Hover(contents, wordRange);
            }

            entry = hlslGlobals.datatypes[name];
            if (entry && entry.description) {
                let signature = '(*datatype*) ';
                signature += '**' + name + '**';
                let contents: MarkdownString[] = [];
                contents.push(new MarkdownString(signature));
                contents.push(textToMarkedString(entry.description));
                
                return new Hover(contents, wordRange);
            }

            entry = hlslGlobals.semantics[name.toUpperCase()];
            if (entry && entry.description) {
                let signature = '(*semantic*) ';
                signature += '**' + name + '**';
                let contents: MarkdownString[] = [];
                contents.push(new MarkdownString(signature));
                contents.push(textToMarkedString(entry.description));
                
                return new Hover(contents, wordRange);
            }

            let key = name.replace(/\d+$/, '');
            entry = hlslGlobals.semanticsNum[key.toUpperCase()];
            if (entry && entry.description) {
                let signature = '(*semantic*) ';
                signature += '**' + name + '**';
                let contents: MarkdownString[] = [];
                contents.push(new MarkdownString(signature));
                contents.push(textToMarkedString(entry.description));
                
                return new Hover(contents, wordRange);
            }

            entry = hlslGlobals.keywords[name];
            if (entry && entry.description) {
                let signature = '(*keyword*) ';
                signature += '**' + name + '**';
                let contents: MarkdownString[] = [];
                contents.push(new MarkdownString(signature));
                contents.push(textToMarkedString(entry.description));
                return new Hover(contents, wordRange);
            }
        }

        // ============================================================================
        // 文档内符号悬停提示
        // ============================================================================
        let symbols = await this.getSymbols(document);

        for (let s of symbols) {
            if (s.name === name) {
                let contents: MarkdownString[] = [];
                let signature = '(*' + SymbolKind[s.kind].toLowerCase() + '*) ';
                signature += s.containerName ? s.containerName + '.' : '';
                signature += '**' + name + '**';

                contents.push(new MarkdownString(signature));

                if (s.location.uri.toString() === document.uri.toString()) {
                    contents.push( new MarkdownString( document.getText(s.location.range)) );
                }
                
            return new Hover(contents, wordRange);
            }
        }
    } 
}
