/**
 * 优化的符号缓存管理器
 * 使用 Map 数据结构和直接符号引用提升查找性能
 */

import {
    WorkspaceSymbolCache,
    FileSymbolCache,
    CachedSymbol,
    OptimizedWorkspaceCache,
    OptimizedSymbolIndexEntry,
    SymbolSearchOptions,
    SymbolSearchResult,
    CachedSymbolKind,
} from './symbolCacheTypes';

/**
 * 优化的缓存管理器
 * 提供高性能的符号查找和缓存操作
 */
export class OptimizedCacheManager {
    private cache: OptimizedWorkspaceCache | null = null;
    
    // 查找结果缓存（LRU 缓存）
    private searchCache: Map<string, SymbolSearchResult> = new Map();
    private readonly MAX_SEARCH_CACHE_SIZE = 100;
    
    /**
     * 从持久化缓存构建优化的运行时缓存
     */
    buildOptimizedCache(persistentCache: WorkspaceSymbolCache): OptimizedWorkspaceCache {
        const startTime = performance.now();
        
        // 创建优化的缓存结构
        const optimized: OptimizedWorkspaceCache = {
            version: persistentCache.version,
            workspacePath: persistentCache.workspacePath,
            workspaceHash: persistentCache.workspaceHash,
            files: new Map(),
            symbolIndex: new Map(),
            symbolIdentifierMap: new Map(),
            lastUpdated: persistentCache.lastUpdated,
        };
        
        // 转换文件缓存为 Map
        for (const [filePath, fileCache] of Object.entries(persistentCache.files)) {
            optimized.files.set(filePath, fileCache);
        }
        
        // 构建优化的符号索引（直接存储符号引用）
        for (const [filePath, fileCache] of Array.from(optimized.files.entries())) {
            for (const symbol of fileCache.symbols) {
                // 添加到符号名称索引
                if (!optimized.symbolIndex.has(symbol.name)) {
                    optimized.symbolIndex.set(symbol.name, []);
                }
                
                optimized.symbolIndex.get(symbol.name)!.push({
                    symbol,  // 直接存储符号引用，避免二次查找
                    filePath,
                    signature: symbol.signature,
                });
                
                // 添加到符号标识符映射
                const identifier = this.getSymbolIdentifier(symbol);
                if (!optimized.symbolIdentifierMap.has(identifier)) {
                    optimized.symbolIdentifierMap.set(identifier, []);
                }
                optimized.symbolIdentifierMap.get(identifier)!.push(symbol);
            }
        }
        
        const buildTime = performance.now() - startTime;
        console.log(`[OptimizedCache] Built optimized cache in ${buildTime.toFixed(2)}ms`);
        console.log(`[OptimizedCache] Files: ${optimized.files.size}, Symbols: ${optimized.symbolIndex.size}`);
        
        this.cache = optimized;
        return optimized;
    }
    
    /**
     * 快速符号查找（使用优化的索引）
     */
    findSymbol(symbolName: string, options?: SymbolSearchOptions): SymbolSearchResult {
        const startTime = performance.now();
        
        if (!this.cache) {
            return {
                symbols: [],
                searchTime: 0,
                fromCache: false,
                fileCount: 0,
            };
        }
        
        // 生成缓存键
        const cacheKey = this.generateSearchCacheKey(symbolName, options);
        
        // 检查查找结果缓存
        if (this.searchCache.has(cacheKey)) {
            const cached = this.searchCache.get(cacheKey)!;
            return {
                ...cached,
                searchTime: performance.now() - startTime,
                fromCache: true,
            };
        }
        
        // 从优化的索引中查找
        const entries = this.cache.symbolIndex.get(symbolName);
        
        if (!entries || entries.length === 0) {
            const result: SymbolSearchResult = {
                symbols: [],
                searchTime: performance.now() - startTime,
                fromCache: false,
                fileCount: 0,
            };
            
            // 缓存空结果
            this.addToSearchCache(cacheKey, result);
            return result;
        }
        
        // 直接获取符号（无需二次查找）
        let symbols = entries.map(entry => entry.symbol);
        
        // 应用过滤选项
        if (options) {
            symbols = this.applySearchFilters(symbols, options);
        }
        
        // 统计文件数量
        const fileSet = new Set(symbols.map(s => s.filePath));
        
        const result: SymbolSearchResult = {
            symbols,
            searchTime: performance.now() - startTime,
            fromCache: false,
            fileCount: fileSet.size,
        };
        
        // 缓存查找结果
        this.addToSearchCache(cacheKey, result);
        
        return result;
    }
    
    /**
     * 批量符号查找（优化的批量操作）
     */
    findSymbols(symbolNames: string[], options?: SymbolSearchOptions): Map<string, SymbolSearchResult> {
        const results = new Map<string, SymbolSearchResult>();
        
        for (const name of symbolNames) {
            results.set(name, this.findSymbol(name, options));
        }
        
        return results;
    }
    
    /**
     * 模糊符号查找（支持部分匹配）
     */
    fuzzyFindSymbol(pattern: string, options?: SymbolSearchOptions): SymbolSearchResult {
        const startTime = performance.now();
        
        if (!this.cache) {
            return {
                symbols: [],
                searchTime: 0,
                fromCache: false,
                fileCount: 0,
            };
        }
        
        const caseSensitive = options?.caseSensitive !== false;
        const searchPattern = caseSensitive ? pattern : pattern.toLowerCase();
        const symbols: CachedSymbol[] = [];
        
        // 遍历符号索引进行模糊匹配
        for (const [symbolName, entries] of Array.from(this.cache.symbolIndex.entries())) {
            const compareName = caseSensitive ? symbolName : symbolName.toLowerCase();
            
            if (compareName.includes(searchPattern)) {
                for (const entry of entries) {
                    symbols.push(entry.symbol);
                }
            }
        }
        
        // 应用过滤选项
        let filteredSymbols = symbols;
        if (options) {
            filteredSymbols = this.applySearchFilters(symbols, options);
        }
        
        const fileSet = new Set(filteredSymbols.map(s => s.filePath));
        
        return {
            symbols: filteredSymbols,
            searchTime: performance.now() - startTime,
            fromCache: false,
            fileCount: fileSet.size,
        };
    }
    
    /**
     * 获取文件的所有符号（优化的文件查找）
     */
    getFileSymbols(filePath: string): CachedSymbol[] {
        if (!this.cache) {
            return [];
        }
        
        const fileCache = this.cache.files.get(filePath);
        return fileCache ? fileCache.symbols : [];
    }
    
    /**
     * 按类型获取符号
     */
    getSymbolsByKind(kind: CachedSymbolKind): CachedSymbol[] {
        if (!this.cache) {
            return [];
        }
        
        const symbols: CachedSymbol[] = [];
        
        for (const entries of Array.from(this.cache.symbolIndex.values())) {
            for (const entry of entries) {
                if (entry.symbol.kind === kind) {
                    symbols.push(entry.symbol);
                }
            }
        }
        
        return symbols;
    }
    
    /**
     * 增量更新缓存（优化的更新操作）
     */
    updateFileCache(filePath: string, fileCache: FileSymbolCache): void {
        if (!this.cache) {
            return;
        }
        
        // 移除旧的符号索引
        const oldFileCache = this.cache.files.get(filePath);
        if (oldFileCache) {
            this.removeFileFromIndex(filePath, oldFileCache);
        }
        
        // 更新文件缓存
        this.cache.files.set(filePath, fileCache);
        
        // 添加新的符号索引
        this.addFileToIndex(filePath, fileCache);
        
        // 清除查找结果缓存
        this.searchCache.clear();
        
        this.cache.lastUpdated = Date.now();
    }
    
    /**
     * 移除文件缓存
     */
    removeFileCache(filePath: string): void {
        if (!this.cache) {
            return;
        }
        
        const fileCache = this.cache.files.get(filePath);
        if (fileCache) {
            this.removeFileFromIndex(filePath, fileCache);
            this.cache.files.delete(filePath);
            this.searchCache.clear();
            this.cache.lastUpdated = Date.now();
        }
    }
    
    /**
     * 从索引中移除文件的符号
     */
    private removeFileFromIndex(filePath: string, fileCache: FileSymbolCache): void {
        if (!this.cache) {
            return;
        }
        
        for (const symbol of fileCache.symbols) {
            // 从符号名称索引中移除
            const entries = this.cache.symbolIndex.get(symbol.name);
            if (entries) {
                const filtered = entries.filter(e => e.filePath !== filePath);
                if (filtered.length === 0) {
                    this.cache.symbolIndex.delete(symbol.name);
                } else {
                    this.cache.symbolIndex.set(symbol.name, filtered);
                }
            }
            
            // 从符号标识符映射中移除
            const identifier = this.getSymbolIdentifier(symbol);
            const identifierSymbols = this.cache.symbolIdentifierMap.get(identifier);
            if (identifierSymbols) {
                const filtered = identifierSymbols.filter(s => s.filePath !== filePath);
                if (filtered.length === 0) {
                    this.cache.symbolIdentifierMap.delete(identifier);
                } else {
                    this.cache.symbolIdentifierMap.set(identifier, filtered);
                }
            }
        }
    }
    
    /**
     * 将文件的符号添加到索引
     */
    private addFileToIndex(filePath: string, fileCache: FileSymbolCache): void {
        if (!this.cache) {
            return;
        }
        
        for (const symbol of fileCache.symbols) {
            // 添加到符号名称索引
            if (!this.cache.symbolIndex.has(symbol.name)) {
                this.cache.symbolIndex.set(symbol.name, []);
            }
            
            this.cache.symbolIndex.get(symbol.name)!.push({
                symbol,
                filePath,
                signature: symbol.signature,
            });
            
            // 添加到符号标识符映射
            const identifier = this.getSymbolIdentifier(symbol);
            if (!this.cache.symbolIdentifierMap.has(identifier)) {
                this.cache.symbolIdentifierMap.set(identifier, []);
            }
            this.cache.symbolIdentifierMap.get(identifier)!.push(symbol);
        }
    }
    
    /**
     * 应用搜索过滤器
     */
    private applySearchFilters(symbols: CachedSymbol[], options: SymbolSearchOptions): CachedSymbol[] {
        let filtered = symbols;
        
        // 类型过滤
        if (options.kindFilter && options.kindFilter.length > 0) {
            const kindSet = new Set(options.kindFilter);
            filtered = filtered.filter(s => kindSet.has(s.kind));
        }
        
        // 文件路径过滤（简单的包含匹配）
        if (options.filePathFilter) {
            const pattern = options.filePathFilter.toLowerCase();
            filtered = filtered.filter(s => s.filePath.toLowerCase().includes(pattern));
        }
        
        // 限制结果数量
        if (options.limit && options.limit > 0) {
            filtered = filtered.slice(0, options.limit);
        }
        
        return filtered;
    }
    
    /**
     * 生成搜索缓存键
     */
    private generateSearchCacheKey(symbolName: string, options?: SymbolSearchOptions): string {
        if (!options) {
            return symbolName;
        }
        
        return `${symbolName}|${JSON.stringify(options)}`;
    }
    
    /**
     * 添加到查找结果缓存（LRU）
     */
    private addToSearchCache(key: string, result: SymbolSearchResult): void {
        // 如果缓存已满，删除最旧的条目
        if (this.searchCache.size >= this.MAX_SEARCH_CACHE_SIZE) {
            const firstKey = this.searchCache.keys().next().value;
            this.searchCache.delete(firstKey);
        }
        
        this.searchCache.set(key, result);
    }
    
    /**
     * 获取符号标识符
     */
    private getSymbolIdentifier(symbol: CachedSymbol): string {
        return `${symbol.kind}:${symbol.name}:${symbol.signature || ''}`;
    }
    
    /**
     * 转换为持久化格式
     */
    toPersistentCache(): WorkspaceSymbolCache {
        if (!this.cache) {
            throw new Error('No cache to convert');
        }
        
        // 转换 Map 为普通对象
        const files: { [filePath: string]: FileSymbolCache } = {};
        for (const [filePath, fileCache] of Array.from(this.cache.files.entries())) {
            files[filePath] = fileCache;
        }
        
        const symbolIndex: { [symbolName: string]: any[] } = {};
        for (const [symbolName, entries] of Array.from(this.cache.symbolIndex.entries())) {
            symbolIndex[symbolName] = entries.map(e => ({
                filePath: e.filePath,
                symbolIndex: 0, // 需要重新计算
                signature: e.signature,
            }));
        }
        
        return {
            version: this.cache.version,
            workspacePath: this.cache.workspacePath,
            workspaceHash: this.cache.workspaceHash,
            files,
            symbolIndex,
            lastUpdated: this.cache.lastUpdated,
        };
    }
    
    /**
     * 获取缓存统计信息
     */
    getStats(): {
        fileCount: number;
        symbolCount: number;
        indexSize: number;
        searchCacheSize: number;
    } {
        if (!this.cache) {
            return {
                fileCount: 0,
                symbolCount: 0,
                indexSize: 0,
                searchCacheSize: 0,
            };
        }
        
        let symbolCount = 0;
        for (const fileCache of Array.from(this.cache.files.values())) {
            symbolCount += fileCache.symbols.length;
        }
        
        return {
            fileCount: this.cache.files.size,
            symbolCount,
            indexSize: this.cache.symbolIndex.size,
            searchCacheSize: this.searchCache.size,
        };
    }
    
    /**
     * 清除查找结果缓存
     */
    clearSearchCache(): void {
        this.searchCache.clear();
    }
    
    /**
     * 获取缓存实例
     */
    getCache(): OptimizedWorkspaceCache | null {
        return this.cache;
    }
}
