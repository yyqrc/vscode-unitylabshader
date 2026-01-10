import { window, CompletionItemProvider, CompletionItem, CompletionItemKind, CancellationToken, TextDocument, Position, Range, TextEdit, workspace, MarkdownString, SnippetString } from 'vscode';
import hlslGlobals = require('./hlslGlobals');
import { EngineContextManager, EngineType } from '../common/engineContext';
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
import {
    unrealBuiltinVariables,
    unrealMaterialFunctions,
    unrealBuiltinMacros,
    createUnrealVariableCompletionItem,
    createUnrealFunctionCompletionItem,
    createUnrealMacroCompletionItem
} from '../unreal/unrealGlobals';

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

    // 缓存 Unreal 补全项
    private unrealVariableCompletions: CompletionItem[] | null = null;
    private unrealFunctionCompletions: CompletionItem[] | null = null;
    private unrealMacroCompletions: CompletionItem[] | null = null;

    public provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken): Promise<CompletionItem[]> {
        let result: CompletionItem[] = [];

        // 获取当前引擎类型
        const engineContext = EngineContextManager.getInstance();
        const currentEngine = engineContext.getCurrentEngine();
        const isUnityMode = currentEngine === EngineType.Unity || currentEngine === EngineType.Unknown;
        const isUnrealMode = currentEngine === EngineType.Unreal;

        let enableBasic = workspace.getConfiguration('unityshader').get<boolean>('suggest.basic', true);
        let enableUnity = workspace.getConfiguration('unityshader').get<boolean>('suggest.unity', true) && isUnityMode;
        let enableURP = workspace.getConfiguration('unityshader').get<boolean>('suggest.urp', true) && isUnityMode;

        if (!enableBasic && !enableUnity && !enableURP) {
            return Promise.resolve(result);
        }

        // 获取当前行的文本
        const lineText = document.lineAt(position.line).text;
        const linePrefix = lineText.substring(0, position.character);

        // 检测是否在成员访问（.）之后
        let prefix = '';
        let range = document.getWordRangeAtPosition(position);
        let memberAccessObject = ''; // 记录成员访问的对象名
        
        // 检查是否在 . 之后
        const dotMatch = linePrefix.match(/(\w+)\.(\w*)$/);
        if (dotMatch) {
            // 在成员访问之后，例如：View.xxx
            // dotMatch[1] 是对象名（View），dotMatch[2] 是成员前缀（xxx）
            memberAccessObject = dotMatch[1];
            prefix = dotMatch[2];
            // 创建一个从成员开始的 range
            const memberStart = position.character - prefix.length;
            range = new Range(position.line, memberStart, position.line, position.character);
        } else {
            // 正常的单词补全
            prefix = range ? document.getText(range) : '';
            if (!range) {
                range = new Range(position, position);
            }
        }

        // 检测是否在 pragma 行
        const isPragmaLine = linePrefix.trimStart().startsWith('#pragma');

        // 检测是否在 CGPROGRAM/HLSLPROGRAM 块内
        const isInCodeBlock = this.isInsideCodeBlock(document, position);

        // 检测是否在 Properties 块内
        const isInProperties = this.isInsidePropertiesBlock(document, position);

        var added: any = {};
        
        /**
         * 计算匹配度得分，用于排序
         * 返回格式：{score}_{length}_{name}
         * score 越小越靠前
         */
        var calculateMatchScore = function(name: string, prefix: string): string {
            // 如果在成员访问模式下，使用成员名而不是完整名称
            let matchName = name;
            if (memberAccessObject) {
                const memberPrefix = memberAccessObject + '.';
                const memberPrefixLower = memberPrefix.toLowerCase();
                const nameLower = name.toLowerCase();
                
                if (nameLower.startsWith(memberPrefixLower)) {
                    matchName = name.substring(memberPrefix.length);
                }
            }
            
            if (prefix.length === 0) {
                // 无输入时，按名称长度和字母顺序排序
                return `50_${matchName.length.toString().padStart(4, '0')}_${matchName.toLowerCase()}`;
            }
            
            const nameLower = matchName.toLowerCase();
            const prefixLower = prefix.toLowerCase();
            
            // 1. 完全匹配（大小写一致）- 最高优先级
            if (matchName === prefix) {
                return `00_${matchName.length.toString().padStart(4, '0')}_${nameLower}`;
            }
            
            // 2. 完全匹配（忽略大小写）
            if (nameLower === prefixLower) {
                return `01_${matchName.length.toString().padStart(4, '0')}_${nameLower}`;
            }
            
            // 3. 前缀匹配（大小写一致）
            if (matchName.startsWith(prefix)) {
                return `10_${matchName.length.toString().padStart(4, '0')}_${nameLower}`;
            }
            
            // 4. 前缀匹配（忽略大小写）
            if (nameLower.startsWith(prefixLower)) {
                return `20_${matchName.length.toString().padStart(4, '0')}_${nameLower}`;
            }
            
            // 5. 包含匹配（驼峰匹配优先）
            // 例如：输入 "gmp" 可以匹配 "GetMaterialParameter"
            if (isCamelCaseMatch(matchName, prefix)) {
                return `30_${matchName.length.toString().padStart(4, '0')}_${nameLower}`;
            }
            
            // 6. 包含匹配（普通包含）
            if (nameLower.includes(prefixLower)) {
                const index = nameLower.indexOf(prefixLower);
                // 包含位置越靠前，优先级越高
                return `40_${index.toString().padStart(4, '0')}_${matchName.length.toString().padStart(4, '0')}_${nameLower}`;
            }
            
            // 7. 其他情况
            return `99_${matchName.length.toString().padStart(4, '0')}_${nameLower}`;
        };
        
        /**
         * 驼峰匹配：检查 prefix 的每个字符是否按顺序匹配 name 的大写字母
         * 例如：gmp 匹配 GetMaterialParameter
         */
        var isCamelCaseMatch = function(name: string, prefix: string): boolean {
            if (prefix.length === 0) return false;
            
            let prefixIndex = 0;
            const prefixLower = prefix.toLowerCase();
            
            for (let i = 0; i < name.length && prefixIndex < prefix.length; i++) {
                const char = name[i];
                const prefixChar = prefix[prefixIndex];
                
                // 匹配大写字母或下划线后的字母
                if (char === prefixChar || char.toLowerCase() === prefixLower[prefixIndex]) {
                    if (i === 0 || char === char.toUpperCase() || name[i-1] === '_') {
                        prefixIndex++;
                    }
                }
            }
            
            return prefixIndex === prefix.length;
        };
        
        var createNewProposal = function (kind: CompletionItemKind, name: string, entry: hlslGlobals.IEntry | null, type?: string): CompletionItem {
            var proposal: CompletionItem = new CompletionItem(name);
            proposal.kind = kind;
            // 使用匹配度计算排序
            proposal.sortText = calculateMatchScore(name, prefix);
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
            // 如果在成员访问模式下（如 View.xxx）
            if (memberAccessObject) {
                // 只匹配以 "对象名." 开头的补全项（大小写不敏感）
                const memberPrefix = memberAccessObject + '.';
                const memberPrefixLower = memberPrefix.toLowerCase();
                const nameLower = name.toLowerCase();
                
                if (!nameLower.startsWith(memberPrefixLower)) {
                    return false;
                }
                // 提取成员名（去掉 "对象名." 前缀）
                const memberName = name.substring(memberPrefix.length);
                // 如果没有输入成员前缀，显示所有该对象的成员
                if (prefix.length === 0) return true;
                // 否则匹配成员名
                const memberNameLower = memberName.toLowerCase();
                const prefixLower = prefix.toLowerCase();
                return memberNameLower.startsWith(prefixLower) || 
                       memberNameLower.includes(prefixLower) || 
                       isCamelCaseMatch(memberName, prefix);
            }
            
            // 正常模式
            if (prefix.length === 0) return true;
            const nameLower = name.toLowerCase();
            const prefixLower = prefix.toLowerCase();
            // 支持前缀匹配、包含匹配和驼峰匹配
            return nameLower.startsWith(prefixLower) || 
                   nameLower.includes(prefixLower) || 
                   isCamelCaseMatch(name, prefix);
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
                    item.sortText = calculateMatchScore(pragmaName, prefix);
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
                    item.sortText = calculateMatchScore(item.label as string, prefix);
                    result.push(item);
                }
            }

            // Unity 函数补全
            for (const item of this.unityFunctionCompletions!) {
                if (matches(item.label as string) && !added[item.label as string]) {
                    added[item.label as string] = true;
                    item.sortText = calculateMatchScore(item.label as string, prefix);
                    result.push(item);
                }
            }

            // Unity 宏补全
            for (const item of this.unityMacroCompletions!) {
                if (matches(item.label as string) && !added[item.label as string]) {
                    added[item.label as string] = true;
                    item.sortText = calculateMatchScore(item.label as string, prefix);
                    result.push(item);
                }
            }

            // ShaderLab 关键字补全（在代码块外部）
            if (!isInCodeBlock) {
                for (const item of this.shaderLabCompletions!) {
                    if (matches(item.label as string) && !added[item.label as string]) {
                        added[item.label as string] = true;
                        item.sortText = calculateMatchScore(item.label as string, prefix);
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
                            item.sortText = calculateMatchScore(propType.name, prefix);
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
                    item.sortText = calculateMatchScore(item.label as string, prefix);
                    result.push(item);
                }
            }

            // URP 函数补全
            for (const item of this.urpFunctionCompletions!) {
                if (matches(item.label as string) && !added[item.label as string]) {
                    added[item.label as string] = true;
                    item.sortText = calculateMatchScore(item.label as string, prefix);
                    result.push(item);
                }
            }

            // URP 宏补全
            for (const item of this.urpMacroCompletions!) {
                if (matches(item.label as string) && !added[item.label as string]) {
                    added[item.label as string] = true;
                    item.sortText = calculateMatchScore(item.label as string, prefix);
                    result.push(item);
                }
            }
        }

        // ============================================================================
        // Unreal 内置变量/函数/宏补全
        // ============================================================================
        if (isUnrealMode) {
            // 初始化 Unreal 缓存
            this.initializeUnrealCaches();

            // Unreal 变量补全
            for (const item of this.unrealVariableCompletions!) {
                if (matches(item.label as string) && !added[item.label as string]) {
                    added[item.label as string] = true;
                    item.sortText = calculateMatchScore(item.label as string, prefix);
                    result.push(item);
                }
            }

            // Unreal 函数补全
            for (const item of this.unrealFunctionCompletions!) {
                if (matches(item.label as string) && !added[item.label as string]) {
                    added[item.label as string] = true;
                    item.sortText = calculateMatchScore(item.label as string, prefix);
                    result.push(item);
                }
            }

            // Unreal 宏补全
            for (const item of this.unrealMacroCompletions!) {
                if (matches(item.label as string) && !added[item.label as string]) {
                    added[item.label as string] = true;
                    item.sortText = calculateMatchScore(item.label as string, prefix);
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
     * 初始化 Unreal 补全项缓存
     */
    private initializeUnrealCaches(): void {
        if (this.unrealVariableCompletions === null) {
            this.unrealVariableCompletions = unrealBuiltinVariables.map(v => createUnrealVariableCompletionItem(v));
        }
        if (this.unrealFunctionCompletions === null) {
            this.unrealFunctionCompletions = unrealMaterialFunctions.map(f => createUnrealFunctionCompletionItem(f));
        }
        if (this.unrealMacroCompletions === null) {
            this.unrealMacroCompletions = unrealBuiltinMacros.map(m => createUnrealMacroCompletionItem(m));
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