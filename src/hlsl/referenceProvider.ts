
import { ReferenceProvider, CancellationToken, TextDocument, Position, Location, ReferenceContext, SymbolInformation, commands, workspace, Uri, Range } from 'vscode';
import * as vscode from 'vscode';
import { SymbolCacheManager } from '../cache';
import { RipgrepUtils } from '../utils/CommonUtils';

export default class HLSLReferenceProvider implements ReferenceProvider {
    private cacheManager: SymbolCacheManager | null;
    private readonly _hlslPattern = ['.hlsl', '.cginc', '.shader', '.cg', '.glsl', '.compute'];

    constructor(cacheManager?: SymbolCacheManager) {
        this.cacheManager = cacheManager || null;
    }

    private devLog(message: string): void {
        const enable = workspace.getConfiguration('unityshader').get<boolean>('dev.log', false);
        if (enable) {
            console.log(`[ReferenceProvider] ${message}`);
        }
    }

    public provideReferences(document: TextDocument, position: Position, context: ReferenceContext, token: CancellationToken): Thenable<Location[]>{
        return new Promise<Location[]>( async (resolve, reject) => {
            const startTime = Date.now();
            this.devLog(`========== Reference Search Started ==========`);

            let enable = workspace.getConfiguration('unityshader').get<boolean>('suggest.basic', true);
            let wordRange = document.getWordRangeAtPosition(position);
            if (!enable || !wordRange) {
                resolve([]);
                return;
            }

            const name = document.getText(wordRange);
            this.devLog(`Looking for references: "${name}"`);

            let results: Location[] = [];

            // 策略1: 使用 ripgrep 搜索所有引用（最快最准确）
            if (workspace.workspaceFolders) {
                const rgStartTime = Date.now();
                this.devLog(`Starting ripgrep search...`);
                
                for (const folder of workspace.workspaceFolders) {
                    if (token.isCancellationRequested) {
                        resolve([]);
                        return;
                    }

                    const rootPath = folder.uri.fsPath;
                    const rgResults = await this.searchReferencesWithRipgrep(name, rootPath);
                    results.push(...rgResults);
                    
                    this.devLog(`Ripgrep found ${rgResults.length} references in ${rootPath}`);
                }
                
                this.devLog(`Total ripgrep time: ${Date.now() - rgStartTime}ms`);
            }

            // 策略2: 如果 ripgrep 未找到结果，降级到 WorkspaceSymbolProvider
            if (results.length === 0) {
                this.devLog(`Ripgrep found nothing, trying workspace symbol provider...`);
                const lineText = document.lineAt(position).text;
                const isMacro = /^\s*(?:#define|#if|#ifdef|#ifndef|#elif|#undef)\s+!*([a-zA-Z_\x7f-\xff][a-zA-Z0-9:_\x7f-\xff]*)\s*/.test(lineText);
                const workspaceResults = await this.findReferencesFromWorkspace(name, isMacro, document.uri, token);
                results.push(...workspaceResults);
            }

            // 去重
            results = this.deduplicateLocations(results);
            
            const totalTime = Date.now() - startTime;
            this.devLog(`========== Total time: ${totalTime}ms, Found: ${results.length} ==========`);
            
            resolve(results);
        });
    }

    /**
     * 使用 ripgrep 搜索符号的所有引用
     * 注意：这里搜索的是所有使用位置，包括定义和引用
     */
    private async searchReferencesWithRipgrep(name: string, rootPath: string): Promise<Location[]> {
        this.devLog(`[Ripgrep] Searching references for: "${name}"`);

        try {
            // 使用简单的单词边界匹配，查找所有使用位置
            const pattern = `\\b${name}\\b`;
            const matches = RipgrepUtils.searchReferences(pattern, rootPath, this._hlslPattern);
            
            // 转换为 Location
            const results: Location[] = [];
            for (const match of matches) {
                const range = new Range(
                    new Position(match.line, match.column),
                    new Position(match.line, match.column + name.length)
                );
                results.push(new Location(Uri.file(match.filePath), range));
            }
            
            this.devLog(`[Ripgrep] Found ${results.length} references`);
            return results;
        } catch (error: any) {
            this.devLog(`[Ripgrep] Error: ${error.message}`);
            return [];
        }
    }

    private async findReferencesFromWorkspace(symbolName: string, isMacro: boolean, currentUri: Uri, token: CancellationToken): Promise<Location[]> {
        const results: Location[] = [];

        if (token.isCancellationRequested) return results;

        if (isMacro) {
            const query = `:m ${/^\s*(?:#define|#if|#ifdef|#ifndef|#elif|#undef)\s+!*(marcoName)\s*/.source}`.replace('marcoName', symbolName);
            const symbols = await commands.executeCommand<SymbolInformation[]>('vscode.executeWorkspaceSymbolProvider', query);
            symbols.filter(s => (s.name === symbolName && s.location.uri.toString() !== currentUri.toString())).forEach(symbol => {
                if (!token.isCancellationRequested) {
                    results.push(symbol.location);
                }
            });
        } else {
            const query = `:f ${/^\s*(?:\w+\s*\.)?(functionName)\s*\(/.source}`.replace('functionName', symbolName);
            const symbols = await commands.executeCommand<SymbolInformation[]>('vscode.executeWorkspaceSymbolProvider', query);
            symbols.filter(s => (s.name === symbolName && s.location.uri.toString() !== currentUri.toString())).forEach(symbol => {
                if (!token.isCancellationRequested) {
                    results.push(symbol.location);
                }
            });
        }

        return results;
    }

    private deduplicateLocations(locations: Location[]): Location[] {
        const seen = new Set<string>();
        return locations.filter(loc => {
            const key = `${loc.uri.toString()}:${loc.range.start.line}:${loc.range.start.character}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }
}
