
import { DefinitionProvider, ImplementationProvider, TypeDefinitionProvider, SymbolInformation, TextDocument, Position, Location, CancellationToken, Definition, workspace, commands, Uri, Range, window } from 'vscode';
import { execSync } from 'child_process';
import { join } from 'path';
import { rgPath } from '@vscode/ripgrep';

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
            const output = execSync(`"${rgPath}" ${includePattern} --case-sensitive -H --line-number --column --hidden -e "${macroPattern}" .`, execOpts);
            
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
            // 支持 inline, static, extern 等修饰符
            const funcPattern = `^(?:inline|static|extern)?\\s*\\w+\\s+${name}\\s*\\(`;
            const output = execSync(`"${rgPath}" ${includePattern} --case-sensitive -H --line-number --column --hidden -e "${funcPattern}" .`, execOpts);
            
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
            const output = execSync(`"${rgPath}" ${includePattern} --case-sensitive -H --line-number --column --hidden -e "${structPattern}" .`, execOpts);
            
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
                symbols.filter(s => (s.name === name || s.name.startsWith(name + ' '))).forEach(symbol => {
                    results.push(symbol.location);
                });
            } catch (error) {
                console.error('Error executing workspace symbol provider:', error);
            }
            
            // 2. 如果没有找到结果，使用 ripgrep 进行更深入的搜索
            if (results.length === 0 && workspace.workspaceFolders) {
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

    public provideDefinition(document: TextDocument, position: Position, token: CancellationToken | boolean): Thenable<Definition> {
        return this.getDefinitionLocations(document, position);
    }

    public provideImplementation(document: TextDocument, position: Position, token: CancellationToken): Thenable<Definition> {
        return this.getDefinitionLocations(document, position);
    }

    public provideTypeDefinition(document: TextDocument, position: Position, token: CancellationToken): Thenable<Definition> {
        return this.getDefinitionLocations(document, position);
    }
}