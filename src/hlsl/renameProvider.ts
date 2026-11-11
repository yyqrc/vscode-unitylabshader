import { l10n } from 'vscode';
import * as vscode from 'vscode';
import { join } from 'path';
import { getRgPath } from '../common';
import { RipgrepUtils } from '../utils/CommonUtils';

/**
 * 符号类型枚举
 */
enum SymbolType {
    Macro = 'macro',
    Function = 'function',
    Variable = 'variable',
    Struct = 'struct',
    Unknown = 'unknown'
}

/**
 * HLSL 重命名提供器
 * 支持函数和变量的重命名，自动更新所有引用
 * 支持跨文件重命名，带预览功能
 */
export default class HLSLRenameProvider implements vscode.RenameProvider {
    
    // 支持的文件扩展名
    private _hlslPattern = ['.hlsl', '.hlsli', '.fx', '.fxh', '.vsh', '.psh', '.cginc', '.compute', '.shader', '.cg', '.usf', '.ush'];

    /**
     * 判断是否为开发环境
     */
    private isDevelopment(): boolean {
        return process.env.VSCODE_DEBUG_MODE === 'true' || 
               process.env.NODE_ENV === 'development';
    }

    /**
     * 开发环境日志输出
     */
    private devLog(message: string): void {
        if (this.isDevelopment()) {
            console.log(`[Rename] ${message}`);
        }
    }
    
    /**
     * 准备重命名：验证符号是否可以重命名
     */
    public prepareRename(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Range | { range: vscode.Range; placeholder: string }> {
        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) {
            throw new Error(l10n.t('Cannot rename: no valid symbol selected'));
        }

        const word = document.getText(wordRange);
        
        // 检查是否是关键字（不能重命名）
        if (this.isKeyword(word)) {
            throw new Error(l10n.t('Cannot rename keyword: {0}', word));
        }

        // 检查是否是内置函数（不能重命名）
        if (this.isBuiltInFunction(word)) {
            throw new Error(l10n.t('Cannot rename built-in function: {0}', word));
        }

        return {
            range: wordRange,
            placeholder: word
        };
    }

    /**
     * 执行重命名：查找所有引用并创建编辑操作
     * 支持跨文件重命名，带预览功能
     */
    public async provideRenameEdits(
        document: vscode.TextDocument,
        position: vscode.Position,
        newName: string,
        token: vscode.CancellationToken
    ): Promise<vscode.WorkspaceEdit | null> {
        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) {
            return null;
        }

        const oldName = document.getText(wordRange);
        
        // 验证新名称
        if (!this.isValidIdentifier(newName)) {
            vscode.window.showErrorMessage(l10n.t('Invalid identifier name: {0}', newName));
            return null;
        }

        this.devLog(`Starting rename: ${oldName} → ${newName}`);

        // 确定符号类型
        const symbolType = this.determineSymbolType(document, position);
        this.devLog(`Symbol type: ${symbolType}`);

        // 搜索整个工作区的引用
        const references = await this.searchWorkspaceReferences(oldName, symbolType);
        
        if (references.length === 0) {
            vscode.window.showWarningMessage(l10n.t('No references found for symbol "{0}"', oldName));
            return null;
        }

        this.devLog(`Found ${references.length} references`);

        // 显示预览并等待用户确认
        const confirmed = await this.showRenamePreview(oldName, newName, references);
        
        if (!confirmed) {
            this.devLog('User cancelled rename');
            return null;
        }

        // 创建工作区编辑
        const edit = new vscode.WorkspaceEdit();
        
        for (const ref of references) {
            edit.replace(ref.uri, ref.range, newName);
        }

        this.devLog('Rename edit created successfully');
        return edit;
    }

    /**
     * 搜索整个工作区的引用
     */
    private async searchWorkspaceReferences(
        symbolName: string,
        symbolType: SymbolType
    ): Promise<vscode.Location[]> {
        const references: vscode.Location[] = [];

        if (!vscode.workspace.workspaceFolders) {
            this.devLog('No workspace folders found');
            return references;
        }

        for (const folder of vscode.workspace.workspaceFolders) {
            const rootPath = folder.uri.fsPath;
            this.devLog(`Searching in: ${rootPath}`);

            try {
                // 根据符号类型选择搜索策略
                let searchResults: vscode.Location[] = [];
                
                switch (symbolType) {
                    case SymbolType.Macro:
                        searchResults = await this.searchMacroReferences(symbolName, rootPath);
                        break;
                    case SymbolType.Function:
                        searchResults = await this.searchFunctionReferences(symbolName, rootPath);
                        break;
                    case SymbolType.Struct:
                        searchResults = await this.searchStructReferences(symbolName, rootPath);
                        break;
                    case SymbolType.Variable:
                    case SymbolType.Unknown:
                    default:
                        searchResults = await this.searchVariableReferences(symbolName, rootPath);
                        break;
                }

                references.push(...searchResults);
            } catch (error: any) {
                this.devLog(`Search error in ${rootPath}: ${error.message}`);
            }
        }

        // 去重（同一位置可能被多次找到）
        const uniqueRefs = this.deduplicateLocations(references);
        return uniqueRefs;
    }

    /**
     * 搜索宏引用（#define 和使用）
     */
    private async searchMacroReferences(name: string, rootPath: string): Promise<vscode.Location[]> {
        const results: vscode.Location[] = [];
        
        try {
            // 使用RipgrepUtils统一接口
            const pattern = `\\b${this.escapeRegExp(name)}\\b`;
            const matches = RipgrepUtils.searchReferences(pattern, rootPath, this._hlslPattern);
            
            // 转换为Location并精确定位符号位置
            for (const match of matches) {
                const lineText = match.text;
                const nameMatch = new RegExp(`\\b(${this.escapeRegExp(name)})\\b`).exec(lineText);
                if (nameMatch) {
                    const startCol = lineText.indexOf(nameMatch[1]);
                    const endCol = startCol + name.length;
                    const range = new vscode.Range(
                        new vscode.Position(match.line, startCol),
                        new vscode.Position(match.line, endCol)
                    );
                    results.push(new vscode.Location(vscode.Uri.file(match.filePath), range));
                }
            }
        } catch (error: any) {
            // 错误已在RipgrepUtils中处理
        }
        
        return results;
    }

    /**
     * 搜索函数引用（定义和调用）
     */
    private async searchFunctionReferences(name: string, rootPath: string): Promise<vscode.Location[]> {
        const results: vscode.Location[] = [];
        
        try {
            // 使用RipgrepUtils统一接口
            const pattern = `\\b${this.escapeRegExp(name)}\\s*\\(`;
            const matches = RipgrepUtils.searchReferences(pattern, rootPath, this._hlslPattern);
            
            // 转换为Location并精确定位符号位置
            for (const match of matches) {
                const lineText = match.text;
                const funcNameMatch = new RegExp(`\\b(${this.escapeRegExp(name)})\\s*\\(`).exec(lineText);
                if (funcNameMatch) {
                    const startCol = lineText.indexOf(funcNameMatch[1]);
                    const endCol = startCol + name.length;
                    const range = new vscode.Range(
                        new vscode.Position(match.line, startCol),
                        new vscode.Position(match.line, endCol)
                    );
                    results.push(new vscode.Location(vscode.Uri.file(match.filePath), range));
                }
            }
        } catch (error: any) {
            // 错误已在RipgrepUtils中处理
        }
        
        return results;
    }

    /**
     * 搜索结构体引用（定义和使用）
     */
    private async searchStructReferences(name: string, rootPath: string): Promise<vscode.Location[]> {
        const results: vscode.Location[] = [];
        
        try {
            // 使用RipgrepUtils统一接口
            const pattern = `\\b${this.escapeRegExp(name)}\\b`;
            const matches = RipgrepUtils.searchReferences(pattern, rootPath, this._hlslPattern);
            
            // 转换为Location并精确定位符号位置
            for (const match of matches) {
                const lineText = match.text;
                const structNameMatch = new RegExp(`\\b(${this.escapeRegExp(name)})\\b`).exec(lineText);
                if (structNameMatch) {
                    const startCol = lineText.indexOf(structNameMatch[1]);
                    const endCol = startCol + name.length;
                    const range = new vscode.Range(
                        new vscode.Position(match.line, startCol),
                        new vscode.Position(match.line, endCol)
                    );
                    results.push(new vscode.Location(vscode.Uri.file(match.filePath), range));
                }
            }
        } catch (error: any) {
            // 错误已在RipgrepUtils中处理
        }
        
        return results;
    }

    /**
     * 搜索变量引用
     */
    private async searchVariableReferences(name: string, rootPath: string): Promise<vscode.Location[]> {
        const results: vscode.Location[] = [];
        
        try {
            // 使用RipgrepUtils统一接口
            const pattern = `\\b${this.escapeRegExp(name)}\\b`;
            const matches = RipgrepUtils.searchReferences(pattern, rootPath, this._hlslPattern);
            
            // 转换为Location并精确定位符号位置
            for (const match of matches) {
                const lineText = match.text;
                const varNameMatch = new RegExp(`\\b(${this.escapeRegExp(name)})\\b`).exec(lineText);
                if (varNameMatch) {
                    const startCol = lineText.indexOf(varNameMatch[1]);
                    const endCol = startCol + name.length;
                    const range = new vscode.Range(
                        new vscode.Position(match.line, startCol),
                        new vscode.Position(match.line, endCol)
                    );
                    results.push(new vscode.Location(vscode.Uri.file(match.filePath), range));
                }
            }
        } catch (error: any) {
            // 错误已在RipgrepUtils中处理
        }
        
        return results;
    }

    /**
     * 去除重复的位置
     */
    private deduplicateLocations(locations: vscode.Location[]): vscode.Location[] {
        const uniqueMap = new Map<string, vscode.Location>();
        
        for (const loc of locations) {
            const key = `${loc.uri.fsPath}:${loc.range.start.line}:${loc.range.start.character}`;
            if (!uniqueMap.has(key)) {
                uniqueMap.set(key, loc);
            }
        }
        
        return Array.from(uniqueMap.values());
    }

    /**
     * 显示重命名预览并等待用户确认
     */
    private async showRenamePreview(
        oldName: string,
        newName: string,
        references: vscode.Location[]
    ): Promise<boolean> {
        // 按文件分组
        const groupedRefs = this.groupByFile(references);
        const fileCount = groupedRefs.size;
        const totalRefs = references.length;

        // 创建预览项
        const items: (vscode.QuickPickItem & { confirm?: boolean })[] = [];
        
        // 添加摘要信息
        items.push({
            label: l10n.t('$(info) Rename Summary'),
            description: `${oldName} → ${newName}`,
            detail: l10n.t('Affects {0} files with {1} references', fileCount, totalRefs)
        });

        items.push({
            label: '',
            kind: vscode.QuickPickItemKind.Separator
        });

        // 按文件显示引用
        for (const [filePath, locs] of groupedRefs) {
            const fileName = require('path').basename(filePath);
            const relativePath = vscode.workspace.asRelativePath(filePath);
            
            items.push({
                label: `$(file) ${fileName}`,
                description: l10n.t('{0} references', locs.length),
                detail: relativePath
            });

            // 显示每个引用的预览（最多显示前3个）
            const previewCount = Math.min(locs.length, 3);
            for (let i = 0; i < previewCount; i++) {
                const loc = locs[i];
                const preview = await this.getLinePreview(loc);
                items.push({
                    label: l10n.t('  $(symbol-misc) Line {0}', loc.range.start.line + 1),
                    description: '',
                    detail: preview
                });
            }

            if (locs.length > previewCount) {
                items.push({
                    label: l10n.t('  ...and {0} more references', locs.length - previewCount),
                    description: '',
                    detail: ''
                });
            }
        }

        items.push({
            label: '',
            kind: vscode.QuickPickItemKind.Separator
        });

        items.push({
            label: l10n.t('$(check) Confirm Rename'),
            confirm: true,
            description: l10n.t('Press Enter to continue'),
            detail: l10n.t('Apply all changes listed above')
        });

        items.push({
            label: l10n.t('$(close) Cancel'),
            description: l10n.t('Press Esc to cancel'),
            detail: l10n.t('Leave all files unchanged')
        });

        // 显示预览
        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: l10n.t('Preview rename: {0} → {1}', oldName, newName),
            title: l10n.t('Rename Preview')
        });

        // 用户选择确认才继续
        return selected?.confirm === true;
    }

    /**
     * 获取代码行预览
     */
    private async getLinePreview(location: vscode.Location): Promise<string> {
        try {
            const document = await vscode.workspace.openTextDocument(location.uri);
            const line = document.lineAt(location.range.start.line);
            return line.text.trim();
        } catch (error) {
            return l10n.t('<Preview unavailable>');
        }
    }

    /**
     * 按文件分组引用
     */
    private groupByFile(references: vscode.Location[]): Map<string, vscode.Location[]> {
        const grouped = new Map<string, vscode.Location[]>();
        
        for (const ref of references) {
            const filePath = ref.uri.fsPath;
            if (!grouped.has(filePath)) {
                grouped.set(filePath, []);
            }
            grouped.get(filePath)!.push(ref);
        }

        // 对每个文件内的引用按行号排序
        for (const locs of grouped.values()) {
            locs.sort((a, b) => a.range.start.line - b.range.start.line);
        }

        return grouped;
    }

    /**
     * 确定符号类型
     */
    private determineSymbolType(document: vscode.TextDocument, position: vscode.Position): SymbolType {
        const line = document.lineAt(position.line);
        const lineText = line.text;

        // 检查是否是宏定义
        if (/^\s*#define\s+/.test(lineText)) {
            return SymbolType.Macro;
        }

        // 检查是否是结构体定义
        if (/^\s*(struct|cbuffer|tbuffer)\s+/.test(lineText)) {
            return SymbolType.Struct;
        }

        // 检查是否是函数（光标后面有括号）
        const wordRange = document.getWordRangeAtPosition(position);
        if (wordRange) {
            const afterWord = document.getText(
                new vscode.Range(wordRange.end, new vscode.Position(wordRange.end.line, wordRange.end.character + 10))
            );
            if (/^\s*\(/.test(afterWord)) {
                return SymbolType.Function;
            }
        }

        // 默认为变量
        return SymbolType.Variable;
    }


    /**
     * 检查是否是关键字
     */
    private isKeyword(word: string): boolean {
        const keywords = [
            'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default',
            'break', 'continue', 'return', 'discard',
            'struct', 'cbuffer', 'tbuffer',
            'void', 'bool', 'int', 'uint', 'float', 'double',
            'float2', 'float3', 'float4', 'float2x2', 'float3x3', 'float4x4',
            'int2', 'int3', 'int4', 'uint2', 'uint3', 'uint4',
            'bool2', 'bool3', 'bool4',
            'half', 'half2', 'half3', 'half4',
            'fixed', 'fixed2', 'fixed3', 'fixed4',
            'sampler', 'sampler1D', 'sampler2D', 'sampler3D', 'samplerCUBE',
            'Texture2D', 'Texture3D', 'TextureCube',
            'in', 'out', 'inout', 'uniform', 'const', 'static',
            'Shader', 'Properties', 'SubShader', 'Pass', 'Tags',
            'CGPROGRAM', 'ENDCG', 'HLSLPROGRAM', 'ENDHLSL'
        ];
        return keywords.includes(word);
    }

    /**
     * 检查是否是内置函数
     */
    private isBuiltInFunction(word: string): boolean {
        const builtInFunctions = [
            'abs', 'acos', 'all', 'any', 'asin', 'atan', 'atan2',
            'ceil', 'clamp', 'cos', 'cosh', 'cross',
            'ddx', 'ddy', 'degrees', 'determinant', 'distance', 'dot',
            'exp', 'exp2', 'faceforward', 'floor', 'fmod', 'frac',
            'length', 'lerp', 'log', 'log2', 'log10',
            'max', 'min', 'mul', 'normalize',
            'pow', 'radians', 'reflect', 'refract', 'round', 'rsqrt',
            'saturate', 'sign', 'sin', 'sinh', 'smoothstep', 'sqrt', 'step',
            'tan', 'tanh', 'tex2D', 'tex2Dproj', 'transpose', 'trunc',
            'UnityObjectToClipPos', 'UnityObjectToWorldNormal', 'UnityWorldToClipPos'
        ];
        return builtInFunctions.includes(word);
    }

    /**
     * 验证标识符是否有效
     */
    private isValidIdentifier(name: string): boolean {
        // 标识符必须以字母或下划线开头，后面可以跟字母、数字或下划线
        return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
    }

    /**
     * 转义正则表达式特殊字符
     */
    private escapeRegExp(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}
