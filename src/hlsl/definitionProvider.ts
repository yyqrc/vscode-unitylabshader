import { DefinitionProvider, ImplementationProvider, TypeDefinitionProvider, SymbolInformation, TextDocument, Position, Location, CancellationToken, Definition, workspace, commands, Uri, Range, window } from 'vscode';
import { CachedSymbolKind } from '../cache/symbolCacheTypes';
import { join } from 'path';
import { getRgPath } from '../common';
import { EngineContextManager, EngineType } from '../common/engineContext';
import { SymbolCacheManager, CachedSymbol } from '../cache';
import { RipgrepUtils, SymbolLookupUtils } from '../utils/CommonUtils';

// 缓存条目接口
interface CacheEntry {
    results: Location[];
    timestamp: number;
}

export default class HLSLDefinitionProvider implements DefinitionProvider, ImplementationProvider, TypeDefinitionProvider {

	// 符号定义缓存（30秒有效期）
	private definitionCache: Map<string, CacheEntry> = new Map();
	private readonly CACHE_TTL = 30000; // 30秒
	
	// 文件变更监听
	private fileWatcher: any = null;
	
	// 符号缓存管理器
	private symbolCacheManager: SymbolCacheManager | null = null;
	
	constructor(symbolCacheManager?: SymbolCacheManager | null) {
		this.symbolCacheManager = symbolCacheManager || null;
	}

    /**
     * 判断是否为开发环境
     * 开发环境：通过 "Run Extension" 或 "Debug Extension" 启动
     * 生产环境：通过 VSIX 安装后运行
     */
    private isDevelopment(): boolean {
        return process.env.VSCODE_DEBUG_MODE === 'true' || 
               process.env.NODE_ENV === 'development';
    }
    
    /**
     * 初始化文件监听器（增量索引）
     */
    private initFileWatcher(): void {
        if (this.fileWatcher) return;
        
        const pattern = '**/*.{hlsl,hlsli,fx,fxh,vsh,psh,cginc,compute,shader,cg,usf,ush}';
        this.fileWatcher = workspace.createFileSystemWatcher(pattern);
        
        // 文件变更时清除相关缓存
        this.fileWatcher.onDidChange((uri: Uri) => {
            this.devLog(`[Cache] File changed: ${uri.fsPath}, clearing cache`);
            this.clearCache();
        });
        
        this.fileWatcher.onDidCreate((uri: Uri) => {
            this.devLog(`[Cache] File created: ${uri.fsPath}, clearing cache`);
            this.clearCache();
        });
        
        this.fileWatcher.onDidDelete((uri: Uri) => {
            this.devLog(`[Cache] File deleted: ${uri.fsPath}, clearing cache`);
            this.clearCache();
        });
        
        this.devLog(`[Cache] File watcher initialized`);
    }
    
    /**
     * 清除缓存
     */
    private clearCache(): void {
        this.definitionCache.clear();
        this.devLog(`[Cache] All cache cleared`);
    }
    


    /**
     * 开发环境日志输出
     */
    private devLog(message: string): void {
        if (this.isDevelopment()) {
            console.log(message);
        }
    }

    // 支持的文件扩展名
    private _hlslPattern = ['.hlsl', '.hlsli', '.fx', '.fxh', '.vsh', '.psh', '.cginc', '.compute', '.shader', '.cg', '.usf', '.ush'];

    /**
     * 搜索宏定义
     */
    private async searchMacroDefinitions(name: string, rootPath: string): Promise<Location[]> {
        this.devLog(`[Macro] Searching: "${name}"`);
        
        try {
            // 使用RipgrepUtils统一接口
            const matches = RipgrepUtils.searchMacroDefinitions(name, rootPath, this._hlslPattern);
            
            // 转换为Location并精确定位符号位置
            const results: Location[] = [];
            for (const match of matches) {
                const lineText = match.text;
                const macroNameMatch = new RegExp(`#define\\s+(${name})\\b`).exec(lineText);
                if (macroNameMatch) {
                    const startCol = lineText.indexOf(macroNameMatch[1]);
                    const endCol = startCol + name.length;
                    const range = new Range(
                        new Position(match.line, startCol),
                        new Position(match.line, endCol)
                    );
                    results.push(new Location(Uri.file(match.filePath), range));
                    this.devLog(`[Macro] ✓ Found: ${match.filePath}:${match.line + 1}`);
                }
            }
            
            if (results.length === 0) {
                this.devLog(`[Macro] ✗ Not found`);
            }
            
            return results;
        } catch (error: any) {
            this.devLog(`[Macro] Error: ${error.message}`);
            return [];
        }
    }

    /**
     * 搜索函数定义
     */
    private async searchFunctionDefinitions(name: string, rootPath: string): Promise<Location[]> {
        this.devLog(`[Function] Searching: "${name}"`);

        try {
            // 使用RipgrepUtils统一接口
            const matches = RipgrepUtils.searchFunctionDefinitions(name, rootPath, this._hlslPattern);
            
            // 转换为Location并精确定位符号位置
            const results: Location[] = [];
            for (const match of matches) {
                const lineText = match.text;
                const funcNameMatch = new RegExp(`\\b(${name})\\s*\\(`).exec(lineText);
                if (funcNameMatch) {
                    const startCol = lineText.indexOf(funcNameMatch[1]);
                    const endCol = startCol + name.length;
                    const range = new Range(
                        new Position(match.line, startCol),
                        new Position(match.line, endCol)
                    );
                    results.push(new Location(Uri.file(match.filePath), range));
                    this.devLog(`[Function] ✓ Found: ${match.filePath}:${match.line + 1}`);
                }
            }
            
            if (results.length === 0) {
                this.devLog(`[Function] ✗ Not found`);
            }
            
            return results;
        } catch (error: any) {
            this.devLog(`[Function] Error: ${error.message}`);
            return [];
        }
    }

    /**
     * 搜索结构体定义
     */
    private async searchStructDefinitions(name: string, rootPath: string): Promise<Location[]> {
        this.devLog(`[Struct] Searching: "${name}"`);
        
        try {
            // 使用RipgrepUtils统一接口
            const matches = RipgrepUtils.searchStructDefinitions(name, rootPath, this._hlslPattern);
            
            // 转换为Location并精确定位符号位置
            const results: Location[] = [];
            for (const match of matches) {
                const lineText = match.text;
                const structNameMatch = new RegExp(`(?:struct|cbuffer|tbuffer)\\s+(${name})\\b`).exec(lineText);
                if (structNameMatch) {
                    const startCol = lineText.indexOf(structNameMatch[1]);
                    const endCol = startCol + name.length;
                    const range = new Range(
                        new Position(match.line, startCol),
                        new Position(match.line, endCol)
                    );
                    results.push(new Location(Uri.file(match.filePath), range));
                    this.devLog(`[Struct] ✓ Found: ${match.filePath}:${match.line + 1}`);
                }
            }
            
            if (results.length === 0) {
                this.devLog(`[Struct] ✗ Not found`);
            }
            
            return results;
        } catch (error: any) {
            this.devLog(`[Struct] Error: ${error.message}`);
            return [];
        }
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

    /**
     * 根据上下文推测符号类型
     */
    private guessSymbolType(document: TextDocument, position: Position): 'function' | 'macro' | 'both' | 'type' | 'unknown' {
        try {
            const line = document.lineAt(position.line).text;
            const wordRange = document.getWordRangeAtPosition(position);
            if (!wordRange) return 'unknown';
            
            const word = document.getText(wordRange);
            const charAfter = line.charAt(wordRange.end.character);
            
            // 函数调用：后面有括号
            if (charAfter === '(' || line.substring(wordRange.end.character).trim().startsWith('(')) {
                // 检查是否是全大写（可能是宏函数）
                if (word === word.toUpperCase() && word.length > 2) {
                    this.devLog(`[Guess] Macro-function detected: ${word}`);
                    return 'both'; // 既可能是宏，也可能是函数
                }
                return 'function';
            }
            
            // 判断是否在宏定义行上
            if (line.includes('#define')) {
                // 获取宏定义行的完整单词序列
                const lineTokens = line.trim().split(/\s+/);
                const defineIndex = lineTokens.findIndex(token => token === '#define');
                
                if (defineIndex !== -1) {
                    // 宏名是#define后面的第一个单词
                    const macroNameIndex = defineIndex + 1;
                    
                    // 判断当前单词是否是宏名
                    const wordStartInLine = wordRange.start.character;
                    const lineBeforeWord = line.substring(0, wordStartInLine);
                    const tokensBeforeWord = lineBeforeWord.trim().split(/\s+/);
                    
                    // 如果当前单词前面有一个#define，并且当前单词是#define后面的第一个单词，那么它是宏名
                    if (tokensBeforeWord.includes('#define') && tokensBeforeWord.filter(t => t !== '#define').length === 0) {
                        // 当前单词是宏名
                        return 'macro';
                    } else {
                        // 当前单词是宏值，可能是函数名、常量、数字等
                        // 为了更准确，返回'unknown'让系统搜索所有可能类型
                        return 'unknown';
                    }
                }
            }
            
            // 非宏定义行，检查是否是全大写（可能是单独的宏）
            if (word === word.toUpperCase()) {
                return 'macro';
            }
            
            // 类型声明：前面有类型关键字
            const beforeWord = line.substring(0, wordRange.start.character).trim();
            if (/\b(struct|class|typedef|uniform|varying|attribute|cbuffer|tbuffer)\s*$/.test(beforeWord)) {
                return 'type';
            }
            
            // 变量声明：前面是类型名（首字母大写）
            const tokens = beforeWord.split(/\s+/);
            const lastToken = tokens[tokens.length - 1];
            if (lastToken && /^[A-Z]/.test(lastToken)) {
                return 'type';
            }
            
            // 默认推测为函数（最常见）
            return 'function';
        } catch (error) {
            return 'unknown';
        }
    }
    
	/**
	 * 搜索符号（不使用缓存）
	 */
	private async searchSymbolWithoutCache(name: string): Promise<Location[]> {
		const results: Location[] = [];
		
		if (workspace.workspaceFolders) {
			for (const folder of workspace.workspaceFolders) {
				const rootPath = folder.uri.fsPath;
				
				// 并行搜索所有类型
				const [macroResults, funcResults, structResults] = await Promise.all([
					this.searchMacroDefinitions(name, rootPath),
					this.searchFunctionDefinitions(name, rootPath),
					this.searchStructDefinitions(name, rootPath)
				]);
				
				results.push(...macroResults, ...funcResults, ...structResults);
				
				if (results.length > 0) {
					break;
				}
			}
		}
		
		return results;
	}
	
	/**
	 * 从持久化缓存中查找符号
	 */
	private searchSymbolFromPersistentCache(name: string): Location[] {
		if (!this.symbolCacheManager) {
			return [];
		}
		
		const symbols = this.symbolCacheManager.findSymbol(name);
		if (symbols.length === 0) {
			return [];
		}
		
		this.devLog(`[PersistentCache] Found ${symbols.length} symbols for "${name}"`);
		
		// 转换为 Location 对象
		const results: Location[] = [];
		for (const symbol of symbols) {
			try {
				const uri = Uri.file(this.getAbsolutePath(symbol.filePath));
				const range = new Range(
					new Position(symbol.line, symbol.column),
					new Position(symbol.endLine, symbol.endColumn)
				);
				results.push(new Location(uri, range));
			} catch (error) {
				this.devLog(`[PersistentCache] Error converting symbol: ${error}`);
			}
		}
		
		return results;
	}
	
	/**
	 * 获取绝对路径
	 */
	private getAbsolutePath(relativePath: string): string {
		if (workspace.workspaceFolders && workspace.workspaceFolders.length > 0) {
			const path = require('path');
			return path.join(workspace.workspaceFolders[0].uri.fsPath, relativePath);
		}
		return relativePath;
	}

    public getDefinitionLocations(document: TextDocument, position: Position): Thenable<Location[]> {

        return new Promise<Location[]>(async (resolve, reject) => {
            const startTime = Date.now();
            this.devLog(`[Performance] ========== Definition Search Started ==========`);

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
            this.devLog(`[Search] Looking for: "${name}"`);
            
            // 初始化文件监听器（首次调用时）
            if (!this.fileWatcher) {
                this.initFileWatcher();
            }
            
            // 策略0: 检查缓存
            const cacheKey = `${name}:${document.uri.fsPath}:${position.line}:${position.character}`;
            const cached = this.definitionCache.get(cacheKey);
            if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
                this.devLog(`[Cache] ✓ Hit! Returning ${cached.results.length} cached results (age: ${Date.now() - cached.timestamp}ms)`);
                this.devLog(`[Performance] ========== Total time: ${Date.now() - startTime}ms (cached), Found: ${cached.results.length} ==========`);
                resolve(cached.results);
                return;
            }
            
			// 策略0.5: 检查持久化缓存
			if (this.symbolCacheManager) {
				const persistentStartTime = Date.now();
				const persistentResults = this.searchSymbolFromPersistentCache(name);
				
				if (persistentResults.length > 0) {
					this.devLog(`[PersistentCache] ✓ Hit! Returning ${persistentResults.length} results (time: ${Date.now() - persistentStartTime}ms)`);
					this.devLog(`[Performance] ========== Total time: ${Date.now() - startTime}ms (persistent), Found: ${persistentResults.length} ==========`);
					
					// 存入定义缓存
					this.definitionCache.set(cacheKey, {
						results: persistentResults,
						timestamp: Date.now()
					});
					
					resolve(persistentResults);
					return;
				}
				
			this.devLog(`[PersistentCache] ✗ Miss (time: ${Date.now() - persistentStartTime}ms)`);
			}

            // 智能类型判断：根据上下文推测符号类型（提前计算，后续存储缓存时使用）
            const symbolType = this.guessSymbolType(document, position);

            // 策略1: 优先使用 ripgrep 直接搜索（最快最准确）
            if (workspace.workspaceFolders) {
                const rgStartTime = Date.now();
                this.devLog(`[Performance] Starting ripgrep search...`);
                
                this.devLog(`[Search] Guessed type: ${symbolType}`);
                
                for (const folder of workspace.workspaceFolders) {
                    const rootPath = folder.uri.fsPath;

                    // 优化：根据推测的类型调整搜索顺序和策略
                    if (symbolType === 'function') {
                        // 只搜索函数（最常见的情况）
                        const funcStart = Date.now();
                        const funcResults = await this.searchFunctionDefinitions(name, rootPath);
                        this.devLog(`[Performance] Function search: ${Date.now() - funcStart}ms`);
                        results.push(...funcResults);
                        
                        // 提前终止：找到结果就返回
                        if (results.length > 0) {
                            this.devLog(`[Search] Found ${results.length} results, early termination`);
                            break;
                        }
                    } else if (symbolType === 'both') {
                        // 宏函数：同时搜索宏和函数
                        const bothStart = Date.now();
                        const [macroResults, funcResults] = await Promise.all([
                            this.searchMacroDefinitions(name, rootPath),
                            this.searchFunctionDefinitions(name, rootPath)
                        ]);
                        this.devLog(`[Performance] Macro+Function search: ${Date.now() - bothStart}ms`);
                        results.push(...macroResults, ...funcResults);
                        
                        if (results.length > 0) {
                            this.devLog(`[Search] Found ${results.length} results (macro: ${macroResults.length}, function: ${funcResults.length}), early termination`);
                            break;
                        }
                    } else if (symbolType === 'type') {
                        // 只搜索结构体
                        const structStart = Date.now();
                        const structResults = await this.searchStructDefinitions(name, rootPath);
                        this.devLog(`[Performance] Struct search: ${Date.now() - structStart}ms`);
                        results.push(...structResults);
                        
                        if (results.length > 0) {
                            this.devLog(`[Search] Found ${results.length} results, early termination`);
                            break;
                        }
                    } else if (symbolType === 'macro') {
                        // 只搜索宏
                        const macroStart = Date.now();
                        const macroResults = await this.searchMacroDefinitions(name, rootPath);
                        this.devLog(`[Performance] Macro search: ${Date.now() - macroStart}ms`);
                        results.push(...macroResults);
                        
                        if (results.length > 0) {
                            this.devLog(`[Search] Found ${results.length} results, early termination`);
                            break;
                        }
                    } else {
                        // 未知类型：并行搜索所有类型（但找到后立即终止）
                        const searchStart = Date.now();
                        const [macroResults, funcResults, structResults] = await Promise.all([
                            this.searchMacroDefinitions(name, rootPath),
                            this.searchFunctionDefinitions(name, rootPath),
                            this.searchStructDefinitions(name, rootPath)
                        ]);
                        this.devLog(`[Performance] Parallel search: ${Date.now() - searchStart}ms`);
                        
                        results.push(...macroResults, ...funcResults, ...structResults);
                        
                        if (results.length > 0) {
                            this.devLog(`[Search] Found ${results.length} results, early termination`);
                            break;
                        }
                    }
                }
                
                this.devLog(`[Performance] Total ripgrep time: ${Date.now() - rgStartTime}ms`);
            }

            // 策略2: 只有在 ripgrep 未找到结果时，才使用 workspace symbol provider 作为后备
            if (results.length === 0) {
                this.devLog(`[Search] Ripgrep found nothing, trying workspace symbol provider...`);
                const symbolStartTime = Date.now();
                
                try {
                    let symbols = await commands.executeCommand<SymbolInformation[]>('vscode.executeWorkspaceSymbolProvider', name);
                    this.devLog(`[Performance] Symbol provider time: ${Date.now() - symbolStartTime}ms`);
                    
                    if (symbols && symbols.length > 0) {
                        this.devLog(`[Symbol] Provider returned ${symbols.length} symbols`);
                        // 精确匹配符号名称（符号名可能是 "funcName" 或 "funcName (vertex)" 等格式）
                        const exactMatches = symbols.filter(s => {
                            const symbolName = s.name.split(' ')[0].split('(')[0].trim();
                            return symbolName === name;
                        });
                        this.devLog(`[Symbol] Exact matches: ${exactMatches.length}`);
                        exactMatches.forEach(symbol => {
                            results.push(symbol.location);
                        });
                    }
                } catch (error) {
                    this.devLog(`[Symbol] Error: ${error}`);
                }
            } else {
                this.devLog(`[Search] Ripgrep found ${results.length} results, skipping symbol provider`);
            }

            // 去重（同一位置可能被多次找到）
            const uniqueResults = new Map<string, Location>();
            for (const loc of results) {
                const key = `${loc.uri.fsPath}:${loc.range.start.line}:${loc.range.start.character}`;
                if (!uniqueResults.has(key)) {
                    uniqueResults.set(key, loc);
                }
            }

            // 按优先级排序
            const sortedResults = this.sortLocationsByPriority(Array.from(uniqueResults.values()));
            
            // 存入缓存
            if (sortedResults.length > 0) {
                this.definitionCache.set(cacheKey, {
                    results: sortedResults,
                    timestamp: Date.now()
                });
                this.devLog(`[Cache] Stored ${sortedResults.length} results for "${name}"`);                
                // 同时存入持久化缓存（如果存在）
                if (this.symbolCacheManager) {
                    this.storeResultsToPersistentCache(name, sortedResults, symbolType);
                }
                
                // 限制缓存大小（最多100个条目）
                if (this.definitionCache.size > 100) {
                    const oldestKey = this.definitionCache.keys().next().value;
                    if (oldestKey) {
                        this.definitionCache.delete(oldestKey);
                        this.devLog(`[Cache] Evicted oldest entry`);
                    }
                }
            }

            const totalTime = Date.now() - startTime;
            this.devLog(`[Performance] ========== Total time: ${totalTime}ms, Found: ${sortedResults.length} ==========`);

            resolve(sortedResults);
        });
    }

    /**
     * 将搜索结果存入持久化缓存
     */
    private storeResultsToPersistentCache(
        name: string,
        results: Location[],
        symbolType: 'function' | 'macro' | 'both' | 'type' | 'unknown'
    ): void {
        if (!this.symbolCacheManager || results.length === 0) {
            return;
        }

        // 将符号类型映射到 CachedSymbolKind
        let kind: CachedSymbolKind;
        switch (symbolType) {
            case 'function':
                kind = CachedSymbolKind.Function;
                break;
            case 'macro':
                kind = CachedSymbolKind.Macro;
                break;
            case 'type':
                kind = CachedSymbolKind.Struct;
                break;
            default:
                kind = CachedSymbolKind.Function; // 默认为函数
        }

        for (const location of results) {
            try {
                const relativePath = this.getRelativePath(location.uri.fsPath);
                
                const symbol = {
                    name: name,
                    kind: kind,
                    filePath: relativePath,
                    line: location.range.start.line,
                    column: location.range.start.character,
                    endLine: location.range.end.line,
                    endColumn: location.range.end.character,
                    signature: name, // 简单签名
                    documentation: '',
                };

                this.symbolCacheManager.storeSymbol(symbol);
            } catch (error) {
                this.devLog(`[PersistentCache] Error storing symbol: ${error}`);
            }
        }
    }

    /**
     * 获取相对路径
     */
    private getRelativePath(absolutePath: string): string {
        if (workspace.workspaceFolders && workspace.workspaceFolders.length > 0) {
            const path = require('path');
            const workspacePath = workspace.workspaceFolders[0].uri.fsPath;
            return path.relative(workspacePath, absolutePath).replace(/\\/g, '/');
        }
        return absolutePath;
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
            
            this.devLog(`[Include] Searching: "${includePath}"`);
            this.devLog(`[Include] Current file: ${currentFilePath}`);
            this.devLog(`[Include] Root path: ${rootPath}`);
            
            // 1. 处理 Unreal 的虚拟路径（以 /Engine/ 开头）
            // 例如：/Engine/Public/Platform.ush -> {ShaderRoot}/Public/Platform.ush
            if (includePath.startsWith('/Engine/')) {
                // 移除 /Engine/ 前缀
                const relativePath = includePath.substring('/Engine/'.length);
                
                // 尝试在 Shaders 目录下查找
                // 可能的路径：
                // 1. {workspace}/Engine/Shaders/{relativePath}
                // 2. {workspace}/Shaders/{relativePath}
                const possiblePaths = [
                    path.join(rootPath, 'Engine', 'Shaders', relativePath),
                    path.join(rootPath, 'Shaders', relativePath),
                    path.join(rootPath, relativePath)
                ];
                
                for (const fullPath of possiblePaths) {
                    this.devLog(`[Include] Trying: ${fullPath}`);
                    if (fs.existsSync(fullPath)) {
                        this.devLog(`[Include] ✓ Found: ${fullPath}`);
                        return new Location(Uri.file(fullPath), new Position(0, 0));
                    }
                }
            }
            
            // 2. 尝试相对于当前文件的路径
            const currentDir = path.dirname(currentFilePath);
            let fullPath = path.join(currentDir, includePath);
            
            this.devLog(`[Include] Trying relative: ${fullPath}`);
            if (fs.existsSync(fullPath)) {
                this.devLog(`[Include] ✓ Found: ${fullPath}`);
                return new Location(Uri.file(fullPath), new Position(0, 0));
            }
            
            // 3. 尝试相对于工作区根目录
            fullPath = path.join(rootPath, includePath);
            this.devLog(`[Include] Trying root: ${fullPath}`);
            if (fs.existsSync(fullPath)) {
                this.devLog(`[Include] ✓ Found: ${fullPath}`);
                return new Location(Uri.file(fullPath), new Position(0, 0));
            }
            
            // 4. 使用 ripgrep 直接搜索文件名（方案5：更简单高效）
            const fileName = path.basename(includePath);
            try {
                this.devLog(`[Include] Searching by filename: ${fileName}`);
                
                // 使用RipgrepUtils统一接口搜索文件
                const matchingFiles = RipgrepUtils.searchFiles(fileName, rootPath);
                this.devLog(`[Include] Found ${matchingFiles.length} matching files`);
                
                if (matchingFiles.length > 0) {
                    // 优先选择路径最匹配的文件
                    let bestMatch = matchingFiles[0];
                    const includeDir = path.dirname(includePath);
                    
                    // 如果 include 路径包含目录，尝试找到最匹配的文件
                    if (includeDir && includeDir !== '.') {
                        for (const file of matchingFiles) {
                            if (file.includes(includeDir)) {
                                bestMatch = file;
                                break;
                            }
                        }
                    }
                    
                    const foundPath = path.join(rootPath, bestMatch);
                    this.devLog(`[Include] ✓ Found by search: ${foundPath}`);
                    return new Location(Uri.file(foundPath), new Position(0, 0));
                }                
            } catch (error: any) {
                // 没有找到文件
                this.devLog(`[Include] Search failed: ${error.message}`);
            }
            
            this.devLog(`[Include] ✗ Not found`);
        } catch (error) {
            this.devLog(`[Include] Error: ${error}`);
        }
        
        return null;
    }

    /**
     * 搜索 FallBack Shader
     * 支持搜索 Shader "ShaderName" 定义，例如：
     * - FallBack "Diffuse" -> 搜索 Shader "Diffuse"
     * - FallBack "Mobile/VertexLit" -> 搜索 Shader "Mobile/VertexLit"
     */
    private async searchFallBackShader(shaderName: string, rootPath: string): Promise<Location[]> {
        this.devLog(`[FallBack] Searching: "${shaderName}"`);
        
        // 首先尝试从缓存中查找 shader 定义
        const cachedResults = await this.searchShaderFromCache(shaderName, rootPath);
        if (cachedResults.length > 0) {
            this.devLog(`[FallBack] ✓ Found in cache: ${cachedResults.length} result(s)`);
            return cachedResults;
        }
        
        // 缓存未命中，使用 ripgrep 搜索
        return this.searchShaderWithRipgrep(shaderName, rootPath);
    }
    
    /**
     * 从缓存中查找 Shader 定义
     */
    private async searchShaderFromCache(shaderName: string, rootPath: string): Promise<Location[]> {
        const results: Location[] = [];
        
        if (!this.symbolCacheManager) {
            return results;
        }
        
        try {
            // 在缓存中查找符号
            const cachedSymbols = this.symbolCacheManager.findSymbol(shaderName);
            
            // 只保留 shader 类型的符号
            const shaderSymbols = cachedSymbols.filter(s => s.kind === CachedSymbolKind.Shader);
            
            for (const symbol of shaderSymbols) {
                const absolutePath = join(rootPath, symbol.filePath);
                const range = new Range(
                    new Position(symbol.line, symbol.column),
                    new Position(symbol.endLine, symbol.endColumn)
                );
                results.push(new Location(Uri.file(absolutePath), range));
            }
        } catch (error) {
            this.devLog(`[FallBack] Cache search error: ${error}`);
        }
        
        return results;
    }
    
    /**
     * 使用 ripgrep 搜索 Shader 定义
     */
    private async searchShaderWithRipgrep(shaderName: string, rootPath: string): Promise<Location[]> {
        const results: Location[] = [];
        const rgPath = getRgPath();
        const isWindows = process.platform === 'win32';
        
        try {
            // 注意：/ 字符在 ripgrep 正则表达式中不是特殊字符，不需要转义
            // 只需要转义正则表达式的特殊字符：. * + ? ^ $ { } ( ) | [ ] \
            const escapedShaderName = shaderName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            
            // FallBack 是 Unity 独有的功能，只需要搜索 .shader 和 .cginc 文件
            const fileTypes = ['*.shader', '*.cginc'];
            const globPattern = fileTypes.map(t => `-g "${t}"`).join(' ');
            
            // 构建搜索模式：匹配 Shader "ShaderName" 行
            // 跨平台处理：
            // - Windows: 使用 \" 转义双引号，外层用双引号包裹
            // - macOS/Linux: 使用单引号包裹整个模式，内部双引号不需要转义
            // 使用RipgrepUtils统一接口搜索Shader定义
            this.devLog(`[FallBack] Searching Shader definition: ${shaderName}`);
            
            // FallBack 是 Unity 独有的功能，只需要搜索 .shader 和 .cginc 文件
            const searchExtensions = ['shader', 'cginc'];
            const matches = RipgrepUtils.searchShaderDefinition(shaderName, rootPath, searchExtensions);
            
            for (const match of matches) {
                const filepath = match.filePath;
                const lineNum = match.line;
                const lineText = match.text;
                
                // 在行文本中查找 Shader 名称的精确位置
                const nameMatch = new RegExp(`Shader\\s+"([^"]+)"`, 'i').exec(lineText);
                if (nameMatch && nameMatch[1] === shaderName) {
                    // 计算Shader名称在行中的起始位置
                    const startCol = lineText.indexOf(`"${shaderName}"`) + 1; // +1 跳过开头的引号
                    const endCol = startCol + shaderName.length;
                    const range = new Range(
                        new Position(lineNum, startCol),
                        new Position(lineNum, endCol)
                    );
                    
                    // 获取相对路径用于日志
                    const relativePath = filepath.replace(rootPath, '').replace(/^[\\\/]/, '');
                    
                    results.push(new Location(Uri.file(filepath), range));
                    this.devLog(`[FallBack] ✓ Found: ${relativePath}:${lineNum + 1}`);
                }
            }
            
            if (results.length === 0) {
                this.devLog(`[FallBack] ✗ Not found`);
            } else {
                this.devLog(`[FallBack] ✓ Jump to: ${results[0].uri.fsPath}`);
            }
        } catch (error: any) {
            // ripgrep 返回 status 1 表示没有找到匹配
            if (error.status === 1) {
                this.devLog(`[FallBack] ✗ Not found`);
            } else {
                this.devLog(`[FallBack] Error: ${error.message}`);
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
            
            // 2. 检查是否在 FallBack 行上（不区分大小写）
            // 注意：FallBack 是 Unity ShaderLab 特有的功能，只在 Unity 模式下启用
            const engineContext = EngineContextManager.getInstance();
            const isUnityMode = engineContext.isUnityMode();
            
            if (isUnityMode) {
                const fallbackMatch = /FallBack\s+"([^"]+)"/i.exec(lineText);
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
                        // FallBack 未找到时直接返回，不继续搜索符号
                        reject();
                        return;
                    }
                }
            }
            
            // 3. 默认行为：查找符号定义
            const wordRange = document.getWordRangeAtPosition(position);
            const result = await this.getDefinitionLocations(document, position);
            
            // 如果结果超过3个，显示快速选择面板
            if (result.length > 3 && wordRange) {
                const selected = await this.showQuickPickForDefinitions(result, document.getText(wordRange));
                if (selected) {
                    resolve(selected);
                } else {
                    resolve(result);
                }
            } else {
                resolve(result);
            }
        });
    }

    public provideImplementation(document: TextDocument, position: Position, token: CancellationToken): Thenable<Definition> {
        return this.getDefinitionLocations(document, position);
    }

    public provideTypeDefinition(document: TextDocument, position: Position, token: CancellationToken): Thenable<Definition> {
        return this.getDefinitionLocations(document, position);
    }

    private async showQuickPickForDefinitions(locations: Location[], symbolName: string): Promise<Location | Location[] | undefined> {
        interface DefinitionQuickPickItem {
            label: string;
            description?: string;
            detail?: string;
            location: Location;
        }

        const items: DefinitionQuickPickItem[] = await Promise.all(
            locations.map(async (loc) => {
                const doc = await workspace.openTextDocument(loc.uri);
                const line = doc.lineAt(loc.range.start.line);
                const preview = line.text.trim();
                const fileName = loc.uri.fsPath.split(/[\\\/]/).pop() || '';
                const relativePath = workspace.asRelativePath(loc.uri.fsPath);
                
                let symbolType = '$(symbol-misc)';
                if (preview.match(/^\s*#define/)) {
                    symbolType = '$(symbol-constant)';
                } else if (preview.match(/^\s*struct\s+/)) {
                    symbolType = '$(symbol-struct)';
                } else if (preview.match(/\w+\s+\w+\s*\(/)) {
                    symbolType = '$(symbol-method)';
                }

                return {
                    label: `${symbolType} ${fileName}:${loc.range.start.line + 1}`,
                    description: relativePath,
                    detail: preview,
                    location: loc
                };
            })
        );

        const selected = await window.showQuickPick(items, {
            placeHolder: `选择 "${symbolName}" 的定义 (${locations.length} 个结果)`,
            matchOnDescription: true,
            matchOnDetail: true
        });

        return selected ? selected.location : undefined;
    }
}
