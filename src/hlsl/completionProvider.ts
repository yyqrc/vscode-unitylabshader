import { window, CompletionItemProvider, CompletionItem, CompletionItemKind, CancellationToken, TextDocument, Position, Range, TextEdit, workspace, MarkdownString, SnippetString } from 'vscode';
import hlslGlobals = require('./hlslGlobals');
import {
    unityBuiltinVariables,
    unityBuiltinFunctions,
    unityBuiltinMacros,
    shaderLabKeywords,
    shaderLabPropertyTypes,
    pragmaDirectives,
    createVariableCompletionItem,
    createFunctionCompletionItem,
    createMacroCompletionItem,
    createKeywordCompletionItem
} from '../unity/unityGlobals';
import {
    urpBuiltinVariables,
    urpBuiltinFunctions,
    urpBuiltinMacros,
    createURPVariableCompletionItem,
    createURPFunctionCompletionItem,
    createURPMacroCompletionItem
} from '../unity/urpGlobals';

export default class HLSLCompletionItemProvider implements CompletionItemProvider {

    public triggerCharacters = ['.', '#'];

    // 缓存 Unity 补全项
    private unityVariableCompletions: CompletionItem[] | null = null;
    private unityFunctionCompletions: CompletionItem[] | null = null;
    private unityMacroCompletions: CompletionItem[] | null = null;
    private shaderLabCompletions: CompletionItem[] | null = null;

    // 缓存 URP 补全项
    private urpVariableCompletions: CompletionItem[] | null = null;
    private urpFunctionCompletions: CompletionItem[] | null = null;
    private urpMacroCompletions: CompletionItem[] | null = null;

    public provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken): Promise<CompletionItem[]> {
        let result: CompletionItem[] = [];

        let enableBasic = workspace.getConfiguration('unityshader').get<boolean>('suggest.basic', true);
        let enableUnity = workspace.getConfiguration('unityshader').get<boolean>('suggest.unity', true);
        let enableURP = workspace.getConfiguration('unityshader').get<boolean>('suggest.urp', true);

        if (!enableBasic && !enableUnity && !enableURP) {
            return Promise.resolve(result);
        }

        var range = document.getWordRangeAtPosition(position);
        var prefix = range ? document.getText(range) : '';
        if (!range) {
            range = new Range(position, position);
        }

        // 获取当前行的文本
        const lineText = document.lineAt(position.line).text;
        const linePrefix = lineText.substring(0, position.character);

        // 检测是否在 pragma 行
        const isPragmaLine = linePrefix.trimStart().startsWith('#pragma');

        // 检测是否在 CGPROGRAM/HLSLPROGRAM 块内
        const isInCodeBlock = this.isInsideCodeBlock(document, position);

        // 检测是否在 Properties 块内
        const isInProperties = this.isInsidePropertiesBlock(document, position);

        var added: any = {};
        var createNewProposal = function (kind: CompletionItemKind, name: string, entry: hlslGlobals.IEntry | null, type?: string): CompletionItem {
            var proposal: CompletionItem = new CompletionItem(name);
            proposal.kind = kind;
            if (entry) {
                if (entry.description) {
                    proposal.documentation = entry.description;
                }
                if (entry.parameters) {
                    let signature = type ? '(' + type + ') ' : '';
                    signature += name;
                    signature += '(';
                    if (entry.parameters && entry.parameters.length !== 0) {
                        let params = '';
                        entry.parameters.forEach(p => params += p.label + ',');
                        signature += params.slice(0, -1);
                    }
                    signature += ')';
                    proposal.detail = signature;
                }
            }
            return proposal;
        };

        var matches = (name: string) => {
            return prefix.length === 0 || name.length >= prefix.length && name.substr(0, prefix.length).toLowerCase() === prefix.toLowerCase();
        };

        // ============================================================================
        // Pragma 指令补全
        // ============================================================================
        if (isPragmaLine) {
            for (const pragma of pragmaDirectives) {
                const pragmaName = pragma.name.replace('#pragma ', '');
                if (matches(pragmaName) || matches(pragma.name)) {
                    const item = new CompletionItem(pragmaName, CompletionItemKind.Keyword);
                    item.detail = pragma.example;
                    item.documentation = new MarkdownString(`**${pragma.name}**\n\n${pragma.description}\n\n**示例**: \`${pragma.example}\``);
                    result.push(item);
                    added[pragmaName] = true;
                }
            }
            return Promise.resolve(result);
        }

        // ============================================================================
        // HLSL 基础补全
        // ============================================================================
        if (enableBasic) {
            for (var name in hlslGlobals.datatypes) {
                if (hlslGlobals.datatypes.hasOwnProperty(name) && matches(name)) {
                    added[name] = true;
                    result.push(createNewProposal(CompletionItemKind.TypeParameter, name, hlslGlobals.datatypes[name], 'datatype'));
                }
            }

            for (var name in hlslGlobals.intrinsicfunctions) {
                if (hlslGlobals.intrinsicfunctions.hasOwnProperty(name) && matches(name)) {
                    added[name] = true;
                    result.push(createNewProposal(CompletionItemKind.Function, name, hlslGlobals.intrinsicfunctions[name], 'function'));
                }
            }

            for (var name in hlslGlobals.semantics) {
                if (hlslGlobals.semantics.hasOwnProperty(name) && matches(name)) {
                    added[name] = true;
                    result.push(createNewProposal(CompletionItemKind.Reference, name, hlslGlobals.semantics[name], 'semantic'));
                }
            }

            for (var name in hlslGlobals.semanticsNum) {
                if (hlslGlobals.semanticsNum.hasOwnProperty(name) && matches(name)) {
                    added[name] = true;
                    result.push(createNewProposal(CompletionItemKind.Reference, name, hlslGlobals.semanticsNum[name], 'semantic'));
                }
            }

            for (var name in hlslGlobals.keywords) {
                if (hlslGlobals.keywords.hasOwnProperty(name) && matches(name)) {
                    added[name] = true;
                    result.push(createNewProposal(CompletionItemKind.Keyword, name, hlslGlobals.keywords[name], 'keyword'));
                }
            }
        }

        // ============================================================================
        // Unity 内置变量/函数/宏补全
        // ============================================================================
        if (enableUnity) {
            // 初始化缓存
            this.initializeUnityCaches();

            // Unity 变量补全
            for (const item of this.unityVariableCompletions!) {
                if (matches(item.label as string) && !added[item.label as string]) {
                    added[item.label as string] = true;
                    result.push(item);
                }
            }

            // Unity 函数补全
            for (const item of this.unityFunctionCompletions!) {
                if (matches(item.label as string) && !added[item.label as string]) {
                    added[item.label as string] = true;
                    result.push(item);
                }
            }

            // Unity 宏补全
            for (const item of this.unityMacroCompletions!) {
                if (matches(item.label as string) && !added[item.label as string]) {
                    added[item.label as string] = true;
                    result.push(item);
                }
            }

            // ShaderLab 关键字补全（在代码块外部）
            if (!isInCodeBlock) {
                for (const item of this.shaderLabCompletions!) {
                    if (matches(item.label as string) && !added[item.label as string]) {
                        added[item.label as string] = true;
                        result.push(item);
                    }
                }

                // Properties 块内添加属性类型补全
                if (isInProperties) {
                    for (const propType of shaderLabPropertyTypes) {
                        if (matches(propType.name) && !added[propType.name]) {
                            added[propType.name] = true;
                            const item = new CompletionItem(propType.name, CompletionItemKind.TypeParameter);
                            item.detail = propType.description;
                            item.documentation = new MarkdownString(`**${propType.name}**\n\n${propType.description}\n\n**默认值**: \`${propType.defaultValue}\`\n\n**示例**:\n\`\`\`\n${propType.example}\n\`\`\``);
                            result.push(item);
                        }
                    }
                }
            }
        }

        // ============================================================================
        // URP 内置变量/函数/宏补全
        // ============================================================================
        if (enableURP) {
            // 初始化 URP 缓存
            this.initializeURPCaches();

            // URP 变量补全
            for (const item of this.urpVariableCompletions!) {
                if (matches(item.label as string) && !added[item.label as string]) {
                    added[item.label as string] = true;
                    result.push(item);
                }
            }

            // URP 函数补全
            for (const item of this.urpFunctionCompletions!) {
                if (matches(item.label as string) && !added[item.label as string]) {
                    added[item.label as string] = true;
                    result.push(item);
                }
            }

            // URP 宏补全
            for (const item of this.urpMacroCompletions!) {
                if (matches(item.label as string) && !added[item.label as string]) {
                    added[item.label as string] = true;
                    result.push(item);
                }
            }
        }

        // ============================================================================
        // 文档内函数补全
        // ============================================================================
        var text = document.getText();
        var functionMatch = /^\w+\s+([a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*)\s*\(/mg;
        var match: RegExpExecArray;
        while (match = functionMatch.exec(text) as RegExpExecArray) {
            var word = match[1];
            if (!added[word] && matches(word)) {
                added[word] = true;
                result.push(createNewProposal(CompletionItemKind.Function, word, null));
            }
        }

        return Promise.resolve(result);
    }

    /**
     * 初始化 Unity 补全项缓存
     */
    private initializeUnityCaches(): void {
        if (this.unityVariableCompletions === null) {
            this.unityVariableCompletions = unityBuiltinVariables.map(v => createVariableCompletionItem(v));
        }
        if (this.unityFunctionCompletions === null) {
            this.unityFunctionCompletions = unityBuiltinFunctions.map(f => createFunctionCompletionItem(f));
        }
        if (this.unityMacroCompletions === null) {
            this.unityMacroCompletions = unityBuiltinMacros.map(m => createMacroCompletionItem(m));
        }
        if (this.shaderLabCompletions === null) {
            this.shaderLabCompletions = shaderLabKeywords.map(k => createKeywordCompletionItem(k));
        }
    }

    /**
     * 初始化 URP 补全项缓存
     */
    private initializeURPCaches(): void {
        if (this.urpVariableCompletions === null) {
            this.urpVariableCompletions = urpBuiltinVariables.map(v => createURPVariableCompletionItem(v));
        }
        if (this.urpFunctionCompletions === null) {
            this.urpFunctionCompletions = urpBuiltinFunctions.map(f => createURPFunctionCompletionItem(f));
        }
        if (this.urpMacroCompletions === null) {
            this.urpMacroCompletions = urpBuiltinMacros.map(m => createURPMacroCompletionItem(m));
        }
    }

    /**
     * 检测当前位置是否在 CGPROGRAM/HLSLPROGRAM 块内
     */
    private isInsideCodeBlock(document: TextDocument, position: Position): boolean {
        const text = document.getText(new Range(new Position(0, 0), position));
        
        // 计算 CGPROGRAM/HLSLPROGRAM 的开始和结束数量
        const cgStart = (text.match(/\bCGPROGRAM\b|\bCGINCLUDE\b/g) || []).length;
        const cgEnd = (text.match(/\bENDCG\b/g) || []).length;
        const hlslStart = (text.match(/\bHLSLPROGRAM\b|\bHLSLINCLUDE\b/g) || []).length;
        const hlslEnd = (text.match(/\bENDHLSL\b/g) || []).length;

        return (cgStart > cgEnd) || (hlslStart > hlslEnd);
    }

    /**
     * 检测当前位置是否在 Properties 块内
     */
    private isInsidePropertiesBlock(document: TextDocument, position: Position): boolean {
        const text = document.getText(new Range(new Position(0, 0), position));
        
        // 简单检测：查找最后一个 Properties 和 }
        const lastPropertiesIndex = text.lastIndexOf('Properties');
        if (lastPropertiesIndex === -1) {
            return false;
        }

        // 从 Properties 开始计算大括号
        const textAfterProperties = text.substring(lastPropertiesIndex);
        const openBraces = (textAfterProperties.match(/{/g) || []).length;
        const closeBraces = (textAfterProperties.match(/}/g) || []).length;

        return openBraces > closeBraces;
    }
}