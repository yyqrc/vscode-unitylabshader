import * as vscode from 'vscode';
import { execSync } from 'child_process';
import { join } from 'path';
import { getRgPath } from '../common';

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
            throw new Error('无法重命名：未选中有效的符号');
        }

        const word = document.getText(wordRange);
        
        // 检查是否是关键字（不能重命名）
        if (this.isKeyword(word)) {
            throw new Error(`无法重命名关键字: ${word}`);
        }

        // 检查是否是内置函数（不能重命名）
        if (this.isBuiltInFunction(word)) {
            throw new Error(`无法重命名内置函数: ${word}`);
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
            vscode.window.showErrorMessage(`无效的标识符名称: ${newName}`);
            return null;
        }

        this.devLog(`Starting rename: ${oldName} → ${newName}`);

        // 确定符号类型
        const symbolType = this.determineSymbolType(document, position);
        this.devLog(`Symbol type: ${symbolType}`);

        // 搜索整个工作区的引用
        const references = await this.searchWorkspaceReferences(oldName, symbolType);
        
        if (references.length === 0) {
            vscode.window.showWarningMessage(`未找到符号 "${oldName}" 的引用`);
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
            const includePattern = '-g *' + this._hlslPattern.join(' -g *');
            const execOpts = {
                cwd: rootPath,
                maxBuffer: 1024 * 1024
            };
            
            // 搜索宏定义和使用（词边界匹配）
            const pattern = `\\b${this.escapeRegExp(name)}\\b`;
            const output = execSync(`"${getRgPath()}" ${includePattern} --case-sensitive -H --line-number --column --hidden -e "${pattern}" .`, execOpts);
            
            const lines = output.toString().split('\n');
            for (const line of lines) {
                const lineMatch = /^(?:((?:[a-zA-Z]:)?[^:]*):)?(\d+):(\d+):(.+)/.exec(line);
                if (lineMatch) {
                    const filepath = join(rootPath, lineMatch[1]);
                    const lineNum = parseInt(lineMatch[2]) - 1;
                    const lineText = lineMatch[4];
                    
                    // 找到符号的精确位置
                    const nameMatch = new RegExp(`\\b(${this.escapeRegExp(name)})\\b`).exec(lineText);
                    if (nameMatch) {
                        const startCol = lineText.indexOf(nameMatch[1]);
                        const endCol = startCol + name.length;
                        const range = new vscode.Range(
                            new vscode.Position(lineNum, startCol),
                            new vscode.Position(lineNum, endCol)
                        );
                        results.push(new vscode.Location(vscode.Uri.file(filepath), range));
                    }
                }
            }
        } catch (error: any) {
            if (error.status !== 1) { // status 1 means no matches
                throw error;
            }
        }
        
        return results;
    }

    /**
     * 搜索函数引用（定义和调用）
     */
    private async searchFunctionReferences(name: string, rootPath: string): Promise<vscode.Location[]> {
        const results: vscode.Location[] = [];
        
        try {
            const includePattern = '-g *' + this._hlslPattern.join(' -g *');
            const execOpts = {
                cwd: rootPath,
                maxBuffer: 1024 * 1024
            };
            
            // 搜索函数名（包括定义和调用）
            const pattern = `\\b${this.escapeRegExp(name)}\\s*\\(`;
            const output = execSync(`"${getRgPath()}" ${includePattern} --case-sensitive -H --line-number --column --hidden -e "${pattern}" .`, execOpts);
            
            const lines = output.toString().split('\n');
            for (const line of lines) {
                const lineMatch = /^(?:((?:[a-zA-Z]:)?[^:]*):)?(\d+):(\d+):(.+)/.exec(line);
                if (lineMatch) {
                    const filepath = join(rootPath, lineMatch[1]);
                    const lineNum = parseInt(lineMatch[2]) - 1;
                    const lineText = lineMatch[4];
                    
                    // 找到函数名的精确位置
                    const funcNameMatch = new RegExp(`\\b(${this.escapeRegExp(name)})\\s*\\(`).exec(lineText);
                    if (funcNameMatch) {
                        const startCol = lineText.indexOf(funcNameMatch[1]);
                        const endCol = startCol + name.length;
                        const range = new vscode.Range(
                            new vscode.Position(lineNum, startCol),
                            new vscode.Position(lineNum, endCol)
                        );
                        results.push(new vscode.Location(vscode.Uri.file(filepath), range));
                    }
                }
            }
        } catch (error: any) {
            if (error.status !== 1) {
                throw error;
            }
        }
        
        return results;
    }

    /**
     * 搜索结构体引用（定义和使用）
     */
    private async searchStructReferences(name: string, rootPath: string): Promise<vscode.Location[]> {
        const results: vscode.Location[] = [];
        
        try {
            const includePattern = '-g *' + this._hlslPattern.join(' -g *');
            const execOpts = {
                cwd: rootPath,
                maxBuffer: 1024 * 1024
            };
            
            // 搜索结构体名称
            const pattern = `\\b${this.escapeRegExp(name)}\\b`;
            const output = execSync(`"${getRgPath()}" ${includePattern} --case-sensitive -H --line-number --column --hidden -e "${pattern}" .`, execOpts);
            
            const lines = output.toString().split('\n');
            for (const line of lines) {
                const lineMatch = /^(?:((?:[a-zA-Z]:)?[^:]*):)?(\d+):(\d+):(.+)/.exec(line);
                if (lineMatch) {
                    const filepath = join(rootPath, lineMatch[1]);
                    const lineNum = parseInt(lineMatch[2]) - 1;
                    const lineText = lineMatch[4];
                    
                    // 找到结构体名的精确位置
                    const structNameMatch = new RegExp(`\\b(${this.escapeRegExp(name)})\\b`).exec(lineText);
                    if (structNameMatch) {
                        const startCol = lineText.indexOf(structNameMatch[1]);
                        const endCol = startCol + name.length;
                        const range = new vscode.Range(
                            new vscode.Position(lineNum, startCol),
                            new vscode.Position(lineNum, endCol)
                        );
                        results.push(new vscode.Location(vscode.Uri.file(filepath), range));
                    }
                }
            }
        } catch (error: any) {
            if (error.status !== 1) {
                throw error;
            }
        }
        
        return results;
    }

    /**
     * 搜索变量引用
     */
    private async searchVariableReferences(name: string, rootPath: string): Promise<vscode.Location[]> {
        const results: vscode.Location[] = [];
        
        try {
            const includePattern = '-g *' + this._hlslPattern.join(' -g *');
            const execOpts = {
                cwd: rootPath,
                maxBuffer: 1024 * 1024
            };
            
            // 搜索变量名（词边界匹配）
            const pattern = `\\b${this.escapeRegExp(name)}\\b`;
            const output = execSync(`"${getRgPath()}" ${includePattern} --case-sensitive -H --line-number --column --hidden -e "${pattern}" .`, execOpts);
            
            const lines = output.toString().split('\n');
            for (const line of lines) {
                const lineMatch = /^(?:((?:[a-zA-Z]:)?[^:]*):)?(\d+):(\d+):(.+)/.exec(line);
                if (lineMatch) {
                    const filepath = join(rootPath, lineMatch[1]);
                    const lineNum = parseInt(lineMatch[2]) - 1;
                    const lineText = lineMatch[4];
                    
                    // 找到变量名的精确位置
                    const varNameMatch = new RegExp(`\\b(${this.escapeRegExp(name)})\\b`).exec(lineText);
                    if (varNameMatch) {
                        const startCol = lineText.indexOf(varNameMatch[1]);
                        const endCol = startCol + name.length;
                        const range = new vscode.Range(
                            new vscode.Position(lineNum, startCol),
                            new vscode.Position(lineNum, endCol)
                        );
                        results.push(new vscode.Location(vscode.Uri.file(filepath), range));
                    }
                }
            }
        } catch (error: any) {
            if (error.status !== 1) {
                throw error;
            }
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
        const items: vscode.QuickPickItem[] = [];
        
        // 添加摘要信息
        items.push({
            label: `$(info) 重命名摘要`,
            description: `${oldName} → ${newName}`,
            detail: `影响 ${fileCount} 个文件，共 ${totalRefs} 处引用`
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
                description: `${locs.length} 处`,
                detail: relativePath
            });

            // 显示每个引用的预览（最多显示前3个）
            const previewCount = Math.min(locs.length, 3);
            for (let i = 0; i < previewCount; i++) {
                const loc = locs[i];
                const preview = await this.getLinePreview(loc);
                items.push({
                    label: `  $(symbol-misc) Line ${loc.range.start.line + 1}`,
                    description: '',
                    detail: preview
                });
            }

            if (locs.length > previewCount) {
                items.push({
                    label: `  ...还有 ${locs.length - previewCount} 处`,
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
            label: `$(check) 确认重命名`,
            description: '按 Enter 继续',
            detail: '将执行上述所有修改'
        });

        items.push({
            label: `$(close) 取消`,
            description: '按 Esc 取消',
            detail: '不执行任何修改'
        });

        // 显示预览
        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: `预览重命名操作：${oldName} → ${newName}`,
            title: '重命名预览'
        });

        // 用户选择确认才继续
        return selected?.label === `$(check) 确认重命名`;
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
            return '<无法加载预览>';
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
