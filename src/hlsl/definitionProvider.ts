
import { DefinitionProvider, ImplementationProvider, TypeDefinitionProvider, SymbolInformation, TextDocument, Position, Location, CancellationToken, Definition, workspace, commands, Uri, Range, window } from 'vscode';
import { execSync } from 'child_process';
import { join } from 'path';
import { getRgPath } from '../common';

export default class HLSLDefinitionProvider implements DefinitionProvider, ImplementationProvider, TypeDefinitionProvider {

    // 支持的文件扩展名
    private _hlslPattern = ['.hlsl', '.hlsli', '.fx', '.fxh', '.vsh', '.psh', '.cginc', '.compute', '.shader', '.cg'];

    /**
     * 搜索宏定义
     */
    private async searchMacroDefinitions(name: string, rootPath: string): Promise<Location[]> {
        const results: Location[] = [];
        
        try {
            const includePattern = '-g *' + this._hlslPattern.join(' -g *');
            const execOpts = {
                cwd: rootPath,
                maxBuffer: 1024 * 1024
            };
            
            // 搜索 #define 宏定义
            const macroPattern = `^\\s*#define\\s+${name}\\b`;
            const output = execSync(`"${getRgPath()}" ${includePattern} --case-sensitive -H --line-number --column --hidden -e "${macroPattern}" .`, execOpts);
            
            const lines = output.toString().split('\n');
            for (const line of lines) {
                const lineMatch = /^(?:((?:[a-zA-Z]:)?[^:]*):)?(\d+):(\d+):(.+)/.exec(line);
                if (lineMatch) {
                    const filepath = join(rootPath, lineMatch[1]);
                    const lineNum = parseInt(lineMatch[2]) - 1;
                    const colNum = parseInt(lineMatch[3]) - 1;
                    
                    // 找到宏名称的精确位置
                    const lineText = lineMatch[4];
                    const macroNameMatch = new RegExp(`#define\\s+(${name})\\b`).exec(lineText);
                    if (macroNameMatch) {
                        const startCol = lineText.indexOf(macroNameMatch[1]);
                        const endCol = startCol + name.length;
                        const range = new Range(
                            new Position(lineNum, startCol),
                            new Position(lineNum, endCol)
                        );
                        results.push(new Location(Uri.file(filepath), range));
                    }
                }
            }
        } catch (error: any) {
            // 没有找到结果时 ripgrep 会抛出错误，这是正常的
            if (error.status !== 1) {
                console.error('Error searching macro definitions:', error.message);
            }
        }
        
        return results;
    }

    /**
     * 搜索函数定义
     */
    private async searchFunctionDefinitions(name: string, rootPath: string): Promise<Location[]> {
        const results: Location[] = [];

        try {
            const includePattern = '-g *' + this._hlslPattern.join(' -g *');
            const execOpts = {
                cwd: rootPath,
                maxBuffer: 1024 * 1024
            };

            // 搜索函数定义（可选修饰符 + 返回类型 + 函数名 + 左括号）
            // 支持 inline, static, extern 等修饰符，以及无修饰符的情况
            // 使用更宽松的模式：返回类型 + 空白 + 函数名 + 可选空白 + 左括号
            const funcPattern = `^[a-zA-Z_][a-zA-Z0-9_<>,\\s]*\\s+${name}\\s*\\(`;
            const output = execSync(`"${getRgPath()}" ${includePattern} --case-sensitive -H --line-number --column --hidden -e "${funcPattern}" .`, execOpts);

            const lines = output.toString().split('\n');
            for (const line of lines) {
                const lineMatch = /^(?:((?:[a-zA-Z]:)?[^:]*):)?(\d+):(\d+):(.+)/.exec(line);
                if (lineMatch) {
                    const filepath = join(rootPath, lineMatch[1]);
                    const lineNum = parseInt(lineMatch[2]) - 1;
                    const lineText = lineMatch[4];

                    // 找到函数名称的精确位置
                    const funcNameMatch = new RegExp(`\\b(${name})\\s*\\(`).exec(lineText);
                    if (funcNameMatch) {
                        const startCol = lineText.indexOf(funcNameMatch[1]);
                        const endCol = startCol + name.length;
                        const range = new Range(
                            new Position(lineNum, startCol),
                            new Position(lineNum, endCol)
                        );
                        results.push(new Location(Uri.file(filepath), range));
                    }
                }
            }
        } catch (error: any) {
            if (error.status !== 1) {
                console.error('Error searching function definitions:', error.message);
            }
        }

        return results;
    }

    /**
     * 搜索结构体定义
     */
    private async searchStructDefinitions(name: string, rootPath: string): Promise<Location[]> {
        const results: Location[] = [];
        
        try {
            const includePattern = '-g *' + this._hlslPattern.join(' -g *');
            const execOpts = {
                cwd: rootPath,
                maxBuffer: 1024 * 1024
            };
            
            // 搜索结构体定义
            const structPattern = `^(?:struct|cbuffer|tbuffer)\\s+${name}\\b`;
            const output = execSync(`"${getRgPath()}" ${includePattern} --case-sensitive -H --line-number --column --hidden -e "${structPattern}" .`, execOpts);
            
            const lines = output.toString().split('\n');
            for (const line of lines) {
                const lineMatch = /^(?:((?:[a-zA-Z]:)?[^:]*):)?(\d+):(\d+):(.+)/.exec(line);
                if (lineMatch) {
                    const filepath = join(rootPath, lineMatch[1]);
                    const lineNum = parseInt(lineMatch[2]) - 1;
                    const lineText = lineMatch[4];
                    
                    // 找到结构体名称的精确位置
                    const structNameMatch = new RegExp(`(?:struct|cbuffer|tbuffer)\\s+(${name})\\b`).exec(lineText);
                    if (structNameMatch) {
                        const startCol = lineText.indexOf(structNameMatch[1]);
                        const endCol = startCol + name.length;
                        const range = new Range(
                            new Position(lineNum, startCol),
                            new Position(lineNum, endCol)
                        );
                        results.push(new Location(Uri.file(filepath), range));
                    }
                }
            }
        } catch (error: any) {
            if (error.status !== 1) {
                console.error('Error searching struct definitions:', error.message);
            }
        }
        
        return results;
    }

    /**
     * 按优先级排序结果：已打开的文件优先，然后按文件名排序
     */
    private sortLocationsByPriority(locations: Location[]): Location[] {
        const openedFiles = new Set(workspace.textDocuments.map(doc => doc.uri.fsPath));
        
        return locations.sort((a, b) => {
            const aIsOpen = openedFiles.has(a.uri.fsPath);
            const bIsOpen = openedFiles.has(b.uri.fsPath);
            
            // 已打开的文件优先
            if (aIsOpen && !bIsOpen) return -1;
            if (!aIsOpen && bIsOpen) return 1;
            
            // 都打开或都未打开，按文件名排序
            return a.uri.fsPath.localeCompare(b.uri.fsPath);
        });
    }

    public getDefinitionLocations(document: TextDocument, position: Position): Thenable<Location[]> {

        return new Promise<Location[]>(async (resolve, reject) => {

            let enable = workspace.getConfiguration('unityshader').get<boolean>('suggest.basic', true);
            if (!enable) {
                reject();
                return;
            }

            let wordRange = document.getWordRangeAtPosition(position);
            if (!wordRange) {
                reject();
                return;
            }

            let results: Location[] = [];
            let name = document.getText(wordRange);

            // 1. 首先尝试使用 workspace symbol provider（快速）
            try {
                let symbols = await commands.executeCommand<SymbolInformation[]>('vscode.executeWorkspaceSymbolProvider', name);
                if (symbols && symbols.length > 0) {
                    // 精确匹配符号名称（符号名可能是 "funcName" 或 "funcName (vertex)" 等格式）
                    const exactMatches = symbols.filter(s => {
                        const symbolName = s.name.split(' ')[0].split('(')[0].trim();
                        return symbolName === name;
                    });
                    exactMatches.forEach(symbol => {
                        results.push(symbol.location);
                    });
                }
            } catch (error) {
                console.error('Error executing workspace symbol provider:', error);
            }

            // 2. 始终使用 ripgrep 进行搜索以确保找到所有定义
            if (workspace.workspaceFolders) {
                for (const folder of workspace.workspaceFolders) {
                    const rootPath = folder.uri.fsPath;

                    // 搜索宏定义
                    const macroResults = await this.searchMacroDefinitions(name, rootPath);
                    results.push(...macroResults);

                    // 搜索函数定义
                    const funcResults = await this.searchFunctionDefinitions(name, rootPath);
                    results.push(...funcResults);

                    // 搜索结构体定义
                    const structResults = await this.searchStructDefinitions(name, rootPath);
                    results.push(...structResults);
                }
            }

            // 3. 去重（同一位置可能被多次找到）
            const uniqueResults = new Map<string, Location>();
            for (const loc of results) {
                const key = `${loc.uri.fsPath}:${loc.range.start.line}:${loc.range.start.character}`;
                if (!uniqueResults.has(key)) {
                    uniqueResults.set(key, loc);
                }
            }

            // 4. 按优先级排序
            const sortedResults = this.sortLocationsByPriority(Array.from(uniqueResults.values()));

            resolve(sortedResults);
        });
    }

    /**
     * 搜索 #include 文件
     */
    private async searchIncludeFile(includePath: string, currentFilePath: string, rootPath: string): Promise<Location | null> {
        try {
            const path = require('path');
            const fs = require('fs');
            
            // 移除引号
            includePath = includePath.replace(/["<>]/g, '').trim();
            
            // 1. 尝试相对于当前文件的路径
            const currentDir = path.dirname(currentFilePath);
            let fullPath = path.join(currentDir, includePath);
            
            if (fs.existsSync(fullPath)) {
                return new Location(Uri.file(fullPath), new Position(0, 0));
            }
            
            // 2. 尝试相对于工作区根目录
            fullPath = path.join(rootPath, includePath);
            if (fs.existsSync(fullPath)) {
                return new Location(Uri.file(fullPath), new Position(0, 0));
            }
            
            // 3. 使用 ripgrep 搜索文件名
            const fileName = path.basename(includePath);
            const includePattern = '-g *' + this._hlslPattern.join(' -g *');
            const execOpts = {
                cwd: rootPath,
                maxBuffer: 1024 * 1024
            };
            
            try {
                const output = execSync(`"${getRgPath()}" ${includePattern} --files --hidden -g "*${fileName}" .`, execOpts);
                const files = output.toString().split('\n').filter(f => f.trim());
                
                if (files.length > 0) {
                    // 返回第一个匹配的文件
                    const foundPath = path.join(rootPath, files[0]);
                    return new Location(Uri.file(foundPath), new Position(0, 0));
                }
            } catch (error: any) {
                // 没有找到文件
            }
            
        } catch (error) {
            console.error('Error searching include file:', error);
        }
        
        return null;
    }

    /**
     * 搜索 FallBack Shader
     */
    private async searchFallBackShader(shaderName: string, rootPath: string): Promise<Location[]> {
        const results: Location[] = [];
        
        try {
            const includePattern = '-g *.shader';
            const execOpts = {
                cwd: rootPath,
                maxBuffer: 1024 * 1024
            };
            
            // 搜索 Shader "ShaderName" 定义
            const shaderPattern = `^\\s*Shader\\s+"${shaderName}"`;
            const output = execSync(`"${getRgPath()}" ${includePattern} --case-sensitive -H --line-number --column --hidden -e "${shaderPattern}" .`, execOpts);
            
            const lines = output.toString().split('\n');
            for (const line of lines) {
                const lineMatch = /^(?:((?:[a-zA-Z]:)?[^:]*):)?(\d+):(\d+):(.+)/.exec(line);
                if (lineMatch) {
                    const filepath = join(rootPath, lineMatch[1]);
                    const lineNum = parseInt(lineMatch[2]) - 1;
                    const lineText = lineMatch[4];
                    
                    // 找到 Shader 名称的精确位置
                    const shaderNameMatch = new RegExp(`Shader\\s+"(${shaderName.replace(/\//g, '\\/')})"`, 'i').exec(lineText);
                    if (shaderNameMatch) {
                        const startCol = lineText.indexOf(shaderNameMatch[1]);
                        const endCol = startCol + shaderName.length;
                        const range = new Range(
                            new Position(lineNum, startCol),
                            new Position(lineNum, endCol)
                        );
                        results.push(new Location(Uri.file(filepath), range));
                    }
                }
            }
        } catch (error: any) {
            if (error.status !== 1) {
                console.error('Error searching FallBack shader:', error.message);
            }
        }
        
        return results;
    }

    public provideDefinition(document: TextDocument, position: Position, token: CancellationToken | boolean): Thenable<Definition> {
        return new Promise<Definition>(async (resolve, reject) => {
            let enable = workspace.getConfiguration('unityshader').get<boolean>('suggest.basic', true);
            if (!enable) {
                reject();
                return;
            }
            
            const line = document.lineAt(position.line);
            const lineText = line.text;
            
            // 1. 检查是否在 #include 行上
            const includeMatch = /#include\s+["<]([^">]+)[">]/.exec(lineText);
            if (includeMatch) {
                const includePath = includeMatch[1];
                const includeStart = lineText.indexOf(includePath);
                const includeEnd = includeStart + includePath.length;
                
                // 检查光标是否在 include 路径上
                if (position.character >= includeStart && position.character <= includeEnd) {
                    if (workspace.workspaceFolders && workspace.workspaceFolders.length > 0) {
                        const rootPath = workspace.workspaceFolders[0].uri.fsPath;
                        const location = await this.searchIncludeFile(includePath, document.uri.fsPath, rootPath);
                        if (location) {
                            resolve(location);
                            return;
                        }
                    }
                }
            }
            
            // 2. 检查是否在 FallBack 行上
            const fallbackMatch = /FallBack\s+"([^"]+)"/.exec(lineText);
            if (fallbackMatch) {
                const shaderName = fallbackMatch[1];
                const shaderStart = lineText.indexOf(shaderName);
                const shaderEnd = shaderStart + shaderName.length;
                
                // 检查光标是否在 Shader 名称上
                if (position.character >= shaderStart && position.character <= shaderEnd) {
                    if (workspace.workspaceFolders && workspace.workspaceFolders.length > 0) {
                        const rootPath = workspace.workspaceFolders[0].uri.fsPath;
                        const locations = await this.searchFallBackShader(shaderName, rootPath);
                        if (locations.length > 0) {
                            resolve(locations);
                            return;
                        }
                    }
                }
            }
            
            // 3. 默认行为：查找符号定义
            const result = await this.getDefinitionLocations(document, position);
            resolve(result);
        });
    }

    public provideImplementation(document: TextDocument, position: Position, token: CancellationToken): Thenable<Definition> {
        return this.getDefinitionLocations(document, position);
    }

    public provideTypeDefinition(document: TextDocument, position: Position, token: CancellationToken): Thenable<Definition> {
        return this.getDefinitionLocations(document, position);
    }
}