
import { ReferenceProvider, CancellationToken, TextDocument, Position, Location, ReferenceContext, SymbolInformation, commands, workspace, Uri, Range } from 'vscode';
import * as vscode from 'vscode';
import { SymbolCacheManager } from '../cache';
import { OptimizedCacheManager } from '../cache/OptimizedCacheManager';
import { CachedSymbolKind } from '../cache/symbolCacheTypes';

export default class HLSLReferenceProvider implements ReferenceProvider {
    private cacheManager: SymbolCacheManager | null;
    private optimizedCache: OptimizedCacheManager | null = null;

    constructor(cacheManager?: SymbolCacheManager) {
        this.cacheManager = cacheManager || null;
        if (this.cacheManager) {
            this.initializeOptimizedCache();
        }
    }

    private async initializeOptimizedCache(): Promise<void> {
        if (!this.cacheManager) return;
        
        // OptimizedCacheManager 会自动从 SymbolCacheManager 获取缓存
        this.optimizedCache = new OptimizedCacheManager();
    }

    public provideReferences(document: TextDocument, position: Position, context: ReferenceContext, token: CancellationToken): Thenable<Location[]>{
        return new Promise<Location[]>( async (resolve, reject) => {
            const startTime = performance.now();
            let results: Location[] = [];

            let enable = workspace.getConfiguration('unityshader').get<boolean>('suggest.basic', true);
            let wordRange = document.getWordRangeAtPosition(position);
            if (!enable || !wordRange) {
                resolve(results);
                return;
            }

            const name = document.getText(wordRange);
            const lineText = document.lineAt(position).text;
            const isMacro = /^\s*(?:#define|#if|#ifdef|#ifndef|#elif|#undef)\s+!*([a-zA-Z_\x7f-\xff][a-zA-Z0-9:_\x7f-\xff]*)\s*/.test(lineText);

            // 当前文件内引用（优先返回）
            const text = document.getText();
            const regex = new RegExp(`\\b${name}\\b`, 'gm');
            let match: RegExpExecArray;
            while (match = regex.exec(text) as RegExpExecArray) {
                if (token.isCancellationRequested) {
                    resolve(results);
                    return;
                }
                let refPosition = document.positionAt(match.index);
                let range = document.getWordRangeAtPosition(refPosition);
                if (range !== undefined) {
                    results.push(new Location(document.uri, range));
                }
            }

            // 跨文件引用：优先使用符号缓存
            if (this.optimizedCache) {
                const cacheResults = await this.findReferencesFromCache(name, isMacro, document.uri, token);
                results.push(...cacheResults);
            } else {
                // 降级到 WorkspaceSymbolProvider
                const workspaceResults = await this.findReferencesFromWorkspace(name, isMacro, document.uri, token);
                results.push(...workspaceResults);
            }

            // 去重
            results = this.deduplicateLocations(results);
            
            const searchTime = performance.now() - startTime;
            if (searchTime > 100) {
                console.log(`[ReferenceProvider] Found ${results.length} references for "${name}" in ${searchTime.toFixed(2)}ms`);
            }
            
            resolve(results);
        });
    }

    private async findReferencesFromCache(symbolName: string, isMacro: boolean, currentUri: Uri, token: CancellationToken): Promise<Location[]> {
        if (!this.optimizedCache) return [];

        const results: Location[] = [];
        const cache = this.optimizedCache.getCache();
        if (!cache) return [];
        
        // 获取所有缓存的文件路径
        const allFiles = Array.from(cache.files.keys());
        
        // 在每个文件中搜索符号引用
        for (const filePath of allFiles) {
            if (token.isCancellationRequested) break;
            
            try {
                const fileUri = Uri.file(filePath);
                if (fileUri.toString() === currentUri.toString()) continue;
                
                const document = await workspace.openTextDocument(fileUri);
                const text = document.getText();
                
                // 使用正则表达式查找所有引用
                const regex = new RegExp(`\\b${symbolName}\\b`, 'gm');
                let match: RegExpExecArray | null;
                
                while ((match = regex.exec(text)) !== null) {
                    if (token.isCancellationRequested) break;
                    
                    const position = document.positionAt(match.index);
                    const range = document.getWordRangeAtPosition(position);
                    
                    if (range) {
                        results.push(new Location(fileUri, range));
                    }
                }
            } catch (error) {
                // 文件可能已被删除或无法访问，跳过
                continue;
            }
        }

        return results;
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
