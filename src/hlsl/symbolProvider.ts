'use strict';

import { DocumentSymbolProvider, WorkspaceSymbolProvider, SymbolKind, SymbolInformation, CancellationToken, TextDocument, Position, Range, Location, Uri, Disposable, window, workspace, extensions, DocumentSymbol } from 'vscode';
import { hlslExtensions, getRgPath } from '../common';
import { join } from 'path';
import { SymbolCacheManager } from '../cache';
import { RipgrepUtils } from '../utils/CommonUtils';

interface ISymbolPattern { kind: SymbolKind, pattern: string }

// HLSL/CG 代码符号匹配模式
const searchPatterns: ISymbolPattern[] = [
    { kind: SymbolKind.Function, pattern: /^\w+\s+([a-zA-Z_\x7f-\xff][a-zA-Z0-9:_\x7f-\xff]*)\s*\(/.source },
    { kind: SymbolKind.Struct, pattern: /^(?:struct|cbuffer|tbuffer)\s+([a-zA-Z_\x7f-\xff][a-zA-Z0-9:_\x7f-\xff]*)/.source },
    { kind: SymbolKind.Variable, pattern: /^(?:sampler|sampler1D|sampler2D|sampler3D|samplerCUBE|samplerRECT|sampler_state|SamplerState)\s+([a-zA-Z_\x7f-\xff][a-zA-Z0-9:_\x7f-\xff]*)/.source },
    { kind: SymbolKind.Field, pattern: /^(?:texture|texture2D|textureCUBE|Texture1D|Texture1DArray|Texture2D|Texture2DArray|Texture2DMS|Texture2DMSArray|Texture3D|TextureCube|TextureCubeArray|RWTexture1D|RWTexture1DArray|RWTexture2D|RWTexture2DArray|RWTexture3D)(?:\s*<(?:[a-zA-Z_\x7f-\xff][a-zA-Z0-9,_\x7f-\xff]*)>)?\s+([a-zA-Z_\x7f-\xff][a-zA-Z0-9\[\]_\x7f-\xff]*)/.source },
    { kind: SymbolKind.Field, pattern: /^(?:AppendStructuredBuffer|Buffer|ByteAddressBuffer|ConsumeStructuredBuffer|RWBuffer|RWByteAddressBuffer|RWStructuredBuffer|StructuredBuffer)(?:\s*<(?:[a-zA-Z_\x7f-\xff][a-zA-Z0-9,_\x7f-\xff]*)>)?\s+([a-zA-Z_\x7f-\xff][a-zA-Z0-9\[\]_\x7f-\xff]*)/.source },
];

// ShaderLab 结构符号匹配模式
const shaderLabPatterns: ISymbolPattern[] = [
    { kind: SymbolKind.Module, pattern: /^Shader\s+"([^"]+)"/.source },
    { kind: SymbolKind.Property, pattern: /^\s*(\w+)\s*\(\s*"[^"]*"\s*,\s*(?:2D|3D|Cube|CubeArray|2DArray|Color|Vector|Float|Int|Integer|Range)/.source },
    { kind: SymbolKind.Namespace, pattern: /^\s*(SubShader)\s*\{/.source },
    { kind: SymbolKind.Method, pattern: /^\s*(Pass)\s*\{/.source },
    { kind: SymbolKind.Event, pattern: /^\s*#pragma\s+(vertex|fragment|geometry|hull|domain|surface)\s+(\w+)/.source },
];

const wsSearchPatterns: ISymbolPattern[] = [
    { kind: SymbolKind.Function, pattern: /^\w+\s+([a-zA-Z_\x7f-\xff][a-zA-Z0-9:_\x7f-\xff]*)\s*\(/.source },
    { kind: SymbolKind.Struct, pattern: /^(?:struct|cbuffer|tbuffer)\s+([a-zA-Z_\x7f-\xff][a-zA-Z0-9:_\x7f-\xff]*)/.source },
    { kind: SymbolKind.Module, pattern: /^Shader\s+"([^"]+)"/.source },
];

// 转义函数已移至 CommonUtils.RipgrepUtils.escapeRegExpForShell



export interface ISymbolCache { [path: string]: SymbolInformation[]; }

export default class HLSLDocumentSymbolProvider implements DocumentSymbolProvider, WorkspaceSymbolProvider {

	private _disposables: Disposable[] = [];

	// 支持的文件扩展名
	private _hlslPattern = ['.hlsl', '.hlsli', '.fx', '.fxh', '.vsh', '.psh', '.cginc', '.compute', '.shader', '.cg'];

	// 符号缓存机制
	private symbolCache: Map<string, { symbols: SymbolInformation[], timestamp: number }> = new Map();
	private readonly CACHE_TTL = 30000; // 30秒缓存有效期
	private readonly CACHE_KEY_PREFIX = 'workspace_symbols_';
	
	// 符号缓存管理器
	private symbolCacheManager: SymbolCacheManager | null = null;

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
            console.log(message);
        }
    }
    
	constructor(symbolCacheManager?: SymbolCacheManager | null) {
		this.symbolCacheManager = symbolCacheManager || null;
		
		const extention = extensions.getExtension('vscode.hlsl');
        if (extention && extention.packageJSON 
            && extention.packageJSON.contributes
            && extention.packageJSON.contributes.languages) {
            let hlsllang: any[] = extention.packageJSON.contributes.languages.filter((l: { id: string; }) => l.id === 'hlsl');
            if (hlsllang.length && hlsllang[0].extensions) {
                this._hlslPattern = this._hlslPattern.concat(hlsllang[0].extensions.slice());
            }
        }

        this._hlslPattern = this._hlslPattern.concat(hlslExtensions);
        
        // Keep only unique entries
        this._hlslPattern = [...new Set(this._hlslPattern)];

        // 监听文件变化，清除相关缓存
        this._disposables.push(
            workspace.onDidChangeTextDocument(e => {
                if (this.isHLSLFile(e.document.fileName)) {
                    this.invalidateCache();
                }
            }),
            workspace.onDidSaveTextDocument(doc => {
                if (this.isHLSLFile(doc.fileName)) {
                    this.invalidateCache();
                }
            }),
            workspace.onDidDeleteFiles(() => {
                this.invalidateCache();
            }),
            workspace.onDidCreateFiles(() => {
                this.invalidateCache();
            })
        );
    }

    /**
     * 检查文件是否为 HLSL 文件
     */
    private isHLSLFile(fileName: string): boolean {
        return this._hlslPattern.some(ext => fileName.endsWith(ext));
    }

    /**
     * 清除缓存
     */
    private invalidateCache(): void {
        this.devLog(`[Cache] Invalidating symbol cache`);
        this.symbolCache.clear();
    }

    /**
     * 获取缓存的符号
     */
    private getCachedSymbols(cacheKey: string): SymbolInformation[] | null {
        const cached = this.symbolCache.get(cacheKey);
        if (cached) {
            const age = Date.now() - cached.timestamp;
            if (age < this.CACHE_TTL) {
                this.devLog(`[Cache] Hit (age: ${age}ms)`);
                return cached.symbols;
            } else {
                this.devLog(`[Cache] Expired (age: ${age}ms)`);
                this.symbolCache.delete(cacheKey);
            }
        }
        return null;
    }

    /**
     * 缓存符号
     */
    private setCachedSymbols(cacheKey: string, symbols: SymbolInformation[]): void {
        this.symbolCache.set(cacheKey, {
            symbols: symbols,
            timestamp: Date.now()
        });
        this.devLog(`[Cache] Stored ${symbols.length} symbols`);
    }

    public dispose(){
        if (this._disposables.length > 0) {
            this._disposables.forEach(d => d.dispose());
            this._disposables = [];
        }
    }

    private getDocumentSymbols(uri: Uri): Promise<SymbolInformation[]> {
        return new Promise<SymbolInformation[]>((resolve, reject) => {
            let result: SymbolInformation[] = [];

            let document: TextDocument | null = null;
            for (let d of workspace.textDocuments) {
                if (d.uri.toString() === uri.toString()) {
                    document = d;
                    break;
                }
            }

            if (document === null) {
                resolve([]);
                return;
            }

            let text = document.getText();
            const isShaderFile = document.fileName.endsWith('.shader');

            // ============================================================================
            // ShaderLab 符号识别（仅 .shader 文件）
            // ============================================================================
            if (isShaderFile) {
                // Shader 声明
                const shaderMatch = /^Shader\s+"([^"]+)"/m.exec(text);
                if (shaderMatch) {
                    const line = document.positionAt(shaderMatch.index).line;
                    const range = document.lineAt(line).range;
                    result.push(new SymbolInformation(
                        shaderMatch[1],
                        SymbolKind.Module,
                        '',
                        new Location(document.uri, range)
                    ));
                }

                // Properties 块中的属性
                const propertiesMatch = /Properties\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/gm;
                let propBlockMatch: RegExpExecArray | null;
                while (propBlockMatch = propertiesMatch.exec(text)) {
                    const propContent = propBlockMatch[1];
                    const propRegex = /(\w+)\s*\(\s*"([^"]*)"\s*,\s*(?:2D|3D|Cube|CubeArray|2DArray|Color|Vector|Float|Int|Integer|Range)/g;
                    let propMatch: RegExpExecArray | null;
                    while (propMatch = propRegex.exec(propContent)) {
                        const propName = propMatch[1];
                        const displayName = propMatch[2];
                        const absoluteIndex = propBlockMatch.index + propBlockMatch[0].indexOf(propContent) + propMatch.index;
                        const line = document.positionAt(absoluteIndex).line;
                        const range = document.lineAt(line).range;
                        result.push(new SymbolInformation(
                            `${propName} ("${displayName}")`,
                            SymbolKind.Property,
                            'Properties',
                            new Location(document.uri, range)
                        ));
                    }
                }

                // SubShader 块
                const subshaderRegex = /SubShader\s*\{/g;
                let subshaderMatch: RegExpExecArray | null;
                let subshaderIndex = 0;
                while (subshaderMatch = subshaderRegex.exec(text)) {
                    subshaderIndex++;
                    const line = document.positionAt(subshaderMatch.index).line;
                    const range = document.lineAt(line).range;
                    result.push(new SymbolInformation(
                        `SubShader ${subshaderIndex}`,
                        SymbolKind.Namespace,
                        '',
                        new Location(document.uri, range)
                    ));
                }

                // Pass 块
                const passRegex = /Pass\s*\{/g;
                let passMatch: RegExpExecArray | null;
                let passIndex = 0;
                while (passMatch = passRegex.exec(text)) {
                    passIndex++;
                    const line = document.positionAt(passMatch.index).line;
                    const range = document.lineAt(line).range;
                    
                    // 尝试查找 Pass 的名称
                    const passNameMatch = /Name\s+"([^"]+)"/.exec(text.substring(passMatch.index, passMatch.index + 200));
                    const passName = passNameMatch ? passNameMatch[1] : `Pass ${passIndex}`;
                    
                    result.push(new SymbolInformation(
                        passName,
                        SymbolKind.Method,
                        '',
                        new Location(document.uri, range)
                    ));
                }

                // #pragma vertex/fragment 声明的着色器函数
                const pragmaRegex = /#pragma\s+(vertex|fragment|geometry|hull|domain|surface)\s+(\w+)/g;
                let pragmaMatch: RegExpExecArray | null;
                while (pragmaMatch = pragmaRegex.exec(text)) {
                    const type = pragmaMatch[1];
                    const funcName = pragmaMatch[2];
                    const line = document.positionAt(pragmaMatch.index).line;
                    const range = document.lineAt(line).range;
                    result.push(new SymbolInformation(
                        `${funcName} (${type})`,
                        SymbolKind.Event,
                        '',
                        new Location(document.uri, range)
                    ));
                }
            }

            // ============================================================================
            // HLSL/CG 符号识别
            // ============================================================================
            function fetchSymbol(entry: ISymbolPattern) {
                const kind = entry.kind;
                const pattern = entry.pattern;

                if (document === null) {
                    return;
                } 
                let regex = new RegExp(pattern, "gm");
                let match: RegExpExecArray | null;

                while (match = regex.exec(text)) {
                    let line = document.positionAt(match.index).line;
                    let range = document.lineAt(line).range;
                    let word = match[1];

                    // 避免与 ShaderLab 符号重复
                    if (isShaderFile && result.some(s => s.name.startsWith(word))) {
                        continue;
                    }

                    let lastChar = kind === SymbolKind.Function ? ')' :
                                   kind === SymbolKind.Struct ? '}' :
                                   kind === SymbolKind.Variable ? ';' :
                                   kind === SymbolKind.Field ? ';' :
                                   '';

                    if (lastChar) {
                        let end = text.indexOf(lastChar, match.index) + 1;
                        range = new Range(range.start, document.positionAt(end));
                    }
                    result.push(new SymbolInformation(word, kind, '', new Location(document.uri, range)));
                }
            }

            for (let entry of searchPatterns) {
                fetchSymbol(entry);
            }

            resolve(result);
        });
    }

    public provideDocumentSymbols(document: TextDocument, token: CancellationToken): Thenable<SymbolInformation[]> {
        return this.getDocumentSymbols(document.uri);
    }

    public provideWorkspaceSymbols(query: string, token: CancellationToken): Thenable<SymbolInformation[]> {

        return new Promise<SymbolInformation[]>((resolve, reject) => {
            const startTime = Date.now();
            this.devLog(`[Performance] ========== Workspace Symbol Search Started ==========`);
            this.devLog(`[Symbol] Query: "${query}"`);

            let results: SymbolInformation[] = [];

            // 检查缓存（仅对空查询使用缓存，因为空查询会返回所有符号）
            if (!query || query.trim() === '') {
                const cacheKey = this.CACHE_KEY_PREFIX + 'all';
                const cached = this.getCachedSymbols(cacheKey);
                if (cached) {
                    this.devLog(`[Performance] ========== Total time: ${Date.now() - startTime}ms (cached) ==========`);
                    resolve(cached);
                    return;
                }
            }

            if (workspace.workspaceFolders) {
                for (const folder of workspace.workspaceFolders) {

                    const rootPath = folder.uri.fsPath;
                    const execOpts = {
                        cwd: rootPath,
                        maxBuffer: 1024 * 1024
                    };

                    let includePattern = '-g *' + this._hlslPattern.join(' -g *');

                    if (query.startsWith(':')) {
                        let searchPattern = query.slice(3, query.length);
                        try {
                            // 使用RipgrepUtils统一接口
                            const escapedPattern = RipgrepUtils.escapeRegExpForShell(searchPattern);
                            this.devLog(`[Symbol] Searching custom pattern: ${searchPattern}`);
                            
                            const matches = RipgrepUtils.search({
                                pattern: escapedPattern,
                                rootPath,
                                extensions: this._hlslPattern,
                                useRegex: true,
                            });
                            
                            let kind = SymbolKind.Function;
                            if (query[1] === 'm') {
                                kind = SymbolKind.Constant;
                            }

                            for (const match of matches) {
                                let regex = new RegExp(searchPattern);
                                let word = '?????';
                                let symbolMatch = regex.exec(match.text);
                                if (symbolMatch) {
                                    word = symbolMatch[1];
                                    const startCol = symbolMatch[0].indexOf(word);
                                    let position = new Position(match.line, startCol);
                                    let range = new Range(position, position.translate(0, word.length));
                                    let containerName = `${match.line + 1}`;
                                    results.push(new SymbolInformation(word, kind, containerName, new Location(Uri.file(match.filePath), range)));
                                }
                            }
                            this.devLog(`[Symbol] Found ${results.length} custom matches`);
                        } catch (error:any) {
                            this.devLog(`[Symbol] Error: ${error.message}`);
                        }

                    }

                    for (let entry of wsSearchPatterns) {
                        try {
                            const kind = entry.kind;
                            const searchPattern = entry.pattern;
                            const kindStartTime = Date.now();

                            // 使用RipgrepUtils统一接口（带重试和fallback）
                            const escapedPattern = RipgrepUtils.escapeRegExpForShell(searchPattern);
                            this.devLog(`[Symbol] Searching ${SymbolKind[kind]}`);
                            
                            // 策略4: 减少 Module 搜索的重试次数（从4次降到1次）
                            const maxRetries = (kind === SymbolKind.Module) ? 0 : 2; // Module 不重试，其他类型最多重试2次
                            const fallbackPattern = RipgrepUtils.createFallbackPattern(searchPattern);
                            
                            const matches = RipgrepUtils.searchWithRetry(
                                {
                                    pattern: escapedPattern,
                                    rootPath,
                                    extensions: this._hlslPattern,
                                    useRegex: true,
                                },
                                maxRetries,
                                fallbackPattern
                            );
                            
                            let matchCount = 0;
                            for (const match of matches) {
                                matchCount++;
                                let regex = new RegExp(searchPattern);
                                let word = '?????';
                                let symbolMatch = regex.exec(match.text);
                                if (symbolMatch) {
                                    word = symbolMatch[1];
                                    const startCol = symbolMatch[0].indexOf(word);
                                    let position = new Position(match.line, startCol);
                                    let range = new Range(position, position.translate(0, word.length));
                                    let containerName = `${match.line + 1} : ${match.text.split(' ')[0]}`;
                                    results.push(new SymbolInformation(word, kind, containerName, new Location(Uri.file(match.filePath), range)));
                                }
                            }
                            
                            if (matchCount > 0) {
                                this.devLog(`[Symbol] ✓ Found ${matchCount} ${SymbolKind[kind]} symbols`);
                            }
                            this.devLog(`[Performance] ${SymbolKind[kind]} search: ${Date.now() - kindStartTime}ms`);
                        }
                        catch (err: any) {
                            this.devLog(`[Symbol] Error: ${err.message}`);
                        }
                    }
                }

            }

            // 缓存结果（仅对空查询缓存）
            if (!query || query.trim() === '') {
                const cacheKey = this.CACHE_KEY_PREFIX + 'all';
                this.setCachedSymbols(cacheKey, results);
            }

            const totalTime = Date.now() - startTime;
            this.devLog(`[Performance] ========== Total time: ${totalTime}ms, Found: ${results.length} symbols ==========`);

            resolve(results);
        });

    }

}
